import { IResolvers } from "@graphql-tools/utils";
import { Database, Listing, ListingType, User } from "../../../lib/types";
import {
  ListingArgs,
  ListingBookingsArgs,
  ListingBookingsData,
  ListingsArgs,
  ListingsData,
  ListingsFilter,
  HostListingArgs,
  HostListingInput
} from "./types";
import { ObjectId } from "mongodb";
import { authorize } from "../../../lib/utils";
import { Request } from "express";
import { Google } from "../../../lib/api";


const verifyHostListingInput = (input: HostListingInput): void => {
  const { title, description, type, price,phone,country,admin,city } = input;
  if (title.length > 100) {
    throw new Error("listing title must be under 100 characters.");
  }

  if (description.length > 5000) {
    throw new Error("listing description must be under 5000 characters.");
  }

  if (type !== ListingType.Apartment && type !== ListingType.Hostel && type !== ListingType.Hotel && type !== ListingType.Rental) {
    throw new Error("Listing type must be either apartment,hostel,hotel or rental.");
  }

  if (price < 0) {
    throw new Error("Price must be greater than 0.");
  }
  if(!phone){
    throw new Error("Your Phone Number should be included so that tenants can contact you.");
  }

  if(!country){
    throw new Error("Your Country should be included so that tenants can contact you.");
  }
  if(!admin){
    throw new Error("Your Admin should be included so that tenants can contact you.");
  }
};


export const ListingResolver: IResolvers = {
  Mutation:{
hostListing: async (_id:undefined,{input}:HostListingArgs,{db,req}:{db:Database;req:Request}):Promise<Listing | null> => {
  verifyHostListingInput(input);

  const viewer= await authorize(db,req);

  if(!viewer){
    throw new Error("Viewer cannot be found.");
  }

  // const { country, admin, city } = await Google.geocode(input.address);
  // if (!country || !admin || !city) {
  //   throw new Error("invalid address input.");
  // }

  const insertResult= await db.listings.insertOne({
    _id: new ObjectId(),
    ...input,
    bookings: [],
    bookingsIndex: {},
    host:viewer._id

  });

  const insertedListing:Listing | null =await db.listings.findOne({ _id: insertResult.insertedId });
  
  await db.users.updateOne(
    { _id: viewer._id },
    {
      $push: {
        // @ts-ignore: Object is possibly 'null'.
        listings: insertedListing._id 
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
    listings: async(_root:undefined,{filter,limit,page}:ListingsArgs,{db}:{db:Database}):Promise<ListingsData> => {
      try {
        const data: ListingsData = {
          total: 0,
          result: []
        };

        let cursor = await db.listings.find({  });
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
        cursor= cursor.limit(limit);

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
