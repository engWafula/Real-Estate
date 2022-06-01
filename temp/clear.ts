require("dotenv").config();
import { connectDB } from "../src/database";


const seed = async () => {
  try {
    console.log("[clear]:clearing...");
    const db = await connectDB();


    const listings = await db.listings.find({}).toArray();

    const bookings = await db.bookings.find({}).toArray();

    const users = await db.users.find({}).toArray();
    
    if(bookings.length>0){
        await db.bookings.drop();
    }
   
    if(listings.length>0){
        await db.listings.drop();
    }

    if(users.length>0){
        await db.users.drop();
    }
 
 
     

    console.log("[Clearing]:clearing complete");
  } catch (error) { 
    throw new Error("Failed to clear database");
  }
};

seed();
