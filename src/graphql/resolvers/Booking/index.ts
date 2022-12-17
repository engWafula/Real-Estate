import { Booking, Database, Listing, BookingsIndex } from "../../../lib/types";
import { IResolvers } from "@graphql-tools/utils";
import { createBookingArgs } from "./types";
import { Request } from "express";
import { ObjectId } from "mongodb";
import { authorize } from "../../../lib/utils";
import { Stripe } from "../../../lib/api";

const resolveBookingsIndex = (
  bookingsIndex: BookingsIndex,
  checkInDate: string,
  checkOutDate: string
): BookingsIndex => {
  let dateCursor = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const newBookingsIndex: BookingsIndex = { ...bookingsIndex };
  while (dateCursor <= checkOut) {
    const year = dateCursor.getUTCFullYear();
    const month = dateCursor.getUTCMonth();
    const day = dateCursor.getUTCDate();
    if (!newBookingsIndex[year]) {
      newBookingsIndex[year] = {};
    }
    if (!newBookingsIndex[year][month]) {
      newBookingsIndex[year][month] = {};
    }
    if (!newBookingsIndex[year][month][day]) {
      newBookingsIndex[year][month][day] = true;
    } else {
      throw new Error(
        "selected dates can't overlap dates that have already been booked"
      );
    }
    dateCursor = new Date(dateCursor.getTime() + 86400000);
  }
  return newBookingsIndex;
};

export const BookingResolver: IResolvers = {
  Mutation: {
    createBooking: async (
      _root: undefined,
      { input }: createBookingArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<Booking | null> => {
      try {
        const { id, source, checkIn, checkOut } = input;
        //verfiy a logged in user is making the
        const viewer = await authorize(db, req);
        if (!viewer) {
          throw new Error("viewer can't be found.");
        }
        //find the listing the user is trying to book
        const listing = await db.listings.findOne({
          _id: new ObjectId(id),
        });

        if (!listing) {
          throw new Error("listing can't be found.");
        }
        //check that viewer is not booking their own listing
        if (listing.host === viewer._id) {
          throw new Error("viewer can't book their own listing.");
        }
        //check that check in is before check out
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkOutDate < checkInDate) {
          throw new Error("check out date can't be before check in date.");
        }
        //create a new booking index  the listing being booked
        const bookingsIndex = resolveBookingsIndex(
          listing.bookingsIndex,
          checkIn,
          checkOut
        );
        //get total price to charge
        const totalPrice =
          listing.price *
          ((checkOutDate.getTime() - checkInDate.getTime()) / 86400000 + 1);
        //get user doc of the host  of the listing
        const host = await db.users.findOne({
          _id: listing.host,
        });

        if (!host || !host.walletId) {
          throw new Error(
            "the host either can't be found or is not connected with Stripe."
          );
        }
        // create stripe charge on behalf of the host
        await Stripe.charge(source, totalPrice, host.walletId);

        //insert a new booking in our booking collection
        const insertResult = await db.bookings.insertOne({
          _id: new ObjectId(),
          listing: listing._id,
          tenant: viewer._id,
          checkIn,
          checkOut,
        });

        const insertedBooking: Booking | null = await db.bookings.findOne({
          _id: insertResult.insertedId,
        });

  // update the booking field of the tenant
  await db.users.updateOne(
    {
      _id: viewer._id,
    },
    {
      $push: { bookings: insertedBooking?._id },
    }
  );
  // update the booking field of the listing document
  await db.listings.updateOne(
    {
      _id: listing._id,
    },
    {
      $set: { bookingsIndex },
      $push: { bookings: insertedBooking?._id },
    }
  ),
    //update the user doc of the host to incerement their income
    await db.users.updateOne(
      {
        _id: host._id,
      },
      {
        $inc: { income: totalPrice },
      }
    );

        return insertedBooking;


      } catch (error) {
        throw new Error(`Failed to create a booking: ${error}`);
      }
    },
  },
  Booking: {
    id: (booking: Booking): String => {
      return booking._id.toString();
    },
    listing: (
      booking: Booking,
      _args: {},
      { db }: { db: Database }
    ): Promise<Listing | null> => {
      return db.listings.findOne({ _id: booking.listing });
    },
    tenant: (booking: Booking, _args: {}, { db }: { db: Database }) => {
      return db.users.findOne({ _id: booking.tenant });
    },
  },
};
 