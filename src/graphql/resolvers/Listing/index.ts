import { IResolvers } from "@graphql-tools/utils";
import { Database, Listing, ListingType, User } from "../../../lib/types";
import {
  ListingArgs,
  ListingBookingsArgs,
  ListingBookingsData,
  ListingsArgs,
  ListingsData,
  ListingsFilter,
  ListingsQuery,
  HostListingArgs,
  HostListingInput,
} from "./types";
import { ObjectId } from "mongodb";
import { authorize } from "../../../lib/utils";
import { Request } from "express";
import { Google,Cloudinary } from "../../../lib/api";

const verifyHostListingInput = (input: HostListingInput): void => {
  const { title, description, type, price } = input;
  if (title.length > 100) {
    throw new Error("listing title must be under 100 characters.");
  }

  if (description.length > 5000) {
    throw new Error("listing description must be under 5000 characters.");
  }

  if (type !== ListingType.Commercial && type !== ListingType.Residential) {
    throw new Error("Listing type must be either apartment or house.");
  }

  if (price < 0) {
    throw new Error("Price must be greater than 0.");
  }
};

export const ListingResolver: IResolvers = {
  Mutation: {
    hostListing: async (
      _root: undefined,
      { input }: HostListingArgs,
      { db, req }: { db: Database; req: Request }
    ):Promise<Listing | null> => {
      verifyHostListingInput(input);

      const viewer = await authorize(db, req);
      if (!viewer) {
        throw new Error("viewer can't be found.");
      }

      const { country, admin, city } = await Google.geocode(input.address);
      if (!country || !admin || !city) {
        throw new Error("invalid address input...");
    }

    const imageUrl = await Cloudinary.upload(input.image);

    const insertResult = await db.listings.insertOne({
      _id: new ObjectId(),
      ...input,
      bookings: [],
      bookingsIndex: {},
      country,
      admin,
      city,
      host: viewer._id
    });


    
    const insertedListing:Listing | null = await db.listings.findOne({ _id: insertResult.insertedId });

    await db.users.updateOne(
      { _id: viewer._id },
      {
        $push: {
          listings: insertedListing?._id
        }
      }
    );

    return insertedListing;

    }
  },
  Query: {
    listing: async (
      _root: undefined,
      { id }: ListingArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<Listing> => {
      try {
        const listing = await db.listings.findOne({ _id: new ObjectId(id) });

        if (!listing) {
          throw new Error("no listing found");
        }

        const viewer = await authorize(db, req);
        if (viewer && viewer?._id === listing.host) {
          listing.authorized = true;
        }

        return listing;
      } catch (error) {
        throw new Error(`Failed to query listing: ${error}`);
      }
    },
    listings: async (
      _root: undefined,
      { location, filter, limit, page }: ListingsArgs,
      { db }: { db: Database }
    ): Promise<ListingsData> => {
      try {
        const query: ListingsQuery = {};

        const data: ListingsData = {
          region: null,
          total: 0,
          result: [],
        };

        if (location) {
          const { country, city, admin } = await Google.geocode(location);
          if (city) query.city = city;

          if (admin) query.admin = admin;

          if (country) {
            query.country = country;
          } else {
            throw new Error("No country found");
          }

          const cityText = city ? `${city}, ` : "";
          const adminText = admin ? `${admin}, ` : "";
          data.region = `${cityText}${adminText}${country}`;
        }

        let cursor = await db.listings.find(query);
        if (filter && filter === ListingsFilter.PRICE_LOW_TO_HIGH) {
          cursor = cursor.sort({
            price: 1,
          });
        }
        if (filter && filter === ListingsFilter.PRICE_HIGH_TO_LOW) {
          cursor = cursor.sort({
            price: -1,
          });
        }

        cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
        cursor = cursor.limit(limit);

        data.total = await cursor.count();
        data.result = await cursor.toArray();
        return data;
      } catch (error) {
        throw new Error(`Failed to query  listings: ${error}`);
      }
    },
  },
  Listing: {
    id: (listing: Listing): string => {
      return listing._id.toString();
    },
    host: async (
      listing: Listing,
      _args: {},
      { db }: { db: Database }
    ): Promise<User> => {
      const host = await db.users.findOne({ _id: listing.host });
      if (!host) {
        throw new Error("no host found");
      }
      return host;
    },
    bookingsIndex: (listing: Listing): string => {
      return JSON.stringify(listing.bookingsIndex);
    },
    bookings: async (
      { authorized, bookings }: Listing,
      { limit, page }: ListingBookingsArgs,
      { db }: { db: Database }
    ): Promise<ListingBookingsData | null> => {
      try {
        if (!authorized) {
          return null;
        }

        const data: ListingBookingsData = {
          total: 0,
          result: [],
        };

        let cursor = db.bookings.find({ _id: { $in: bookings } });
        cursor.skip(page > 0 ? (page - 1) * limit : 0).limit(limit);

        data.total = await cursor.count();
        data.result = await cursor.toArray();

        return data;
      } catch (error) {
        throw new Error(`Failed to query listing's bookings: ${error}`);
      }
    },
  },
};
