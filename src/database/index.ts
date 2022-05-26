import { MongoClient } from "mongodb"
import { Database } from "../lib/types";




const uri=`mongodb+srv://${process.env.DB_USER}:${process.env.USER_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`

export const connectDB = async():Promise<Database>=>{

    const client= await MongoClient.connect(uri);
    const db=await client.db("main");

    return{
        listings:db.collection("test_listing")
    }
 
}