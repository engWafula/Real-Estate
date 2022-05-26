import { MongoClient } from "mongodb"

const user="Wafula";
const userPassword="Wafula1998";
const cluster="cluster0.bd7xosz";


const uri=`mongodb+srv://${user}:${userPassword}@${cluster}.mongodb.net/?retryWrites=true&w=majority`

export const connectDB = async()=>{

    const client= await MongoClient.connect(uri);
    const db=await client.db("main");

    return{
        listings:db.collection("test_listing")
    }
 
}