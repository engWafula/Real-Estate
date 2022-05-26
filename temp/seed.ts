require("dotenv").config();
import { connectDB } from "../src/database";
import { ObjectId } from "mongodb";
import { Listing } from "../src/lib/types";

const seed = async () => {
  try {
    console.log("[seed]:seeding...");
    const db = await connectDB();

    const listings: Listing[] = [
      {
        _id: new ObjectId(),
        title: "First Listing",
        image:
          "https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",

        address: "123 Main St",
        price: 1300,
        numOfGuests: 2,
        numOfBeds: 1,
        numOfBaths: 1,
        rating: 4,
      },
      {
        _id: new ObjectId(),
        title: "First Listing",
        image:
          "https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",

        address: "123 Main St",
        price: 200,
        numOfGuests: 2,
        numOfBeds: 1,
        numOfBaths: 1,
        rating: 4,
      },
      {
        _id: new ObjectId(),
        title: "First Listing",
        image:
          "https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",

        address: "123 Main St",

        price: 1300,
        numOfGuests: 2,
        numOfBeds: 1,
        numOfBaths: 1,
        rating: 4,
      },
      {
        _id: new ObjectId(),
        title: "Second Listing",
        image:
          "https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMld9&auto=format&fit=crop&w=800&q=60",

        address: "143 Main St",

        price: 4200,
        numOfGuests: 8,
        numOfBeds: 1,
        numOfBaths: 1,
        rating: 5,
      },
    ];

    for (const listing of listings) {
      await db.listings.insertOne(listing);
    }

    console.log("[seed]:seeding complete");
  } catch (error) { 
    throw new Error("Failed to seed database");
  }
};

seed();
