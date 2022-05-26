import express, { Application } from "express";
import { ApolloServer } from "apollo-server-express";
import { resolvers, typeDefs } from "./graphql";
import { connectDB } from "./database";


const port = 9000;

const mount = async (app: Application) => {

    const db = await connectDB();
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: () => ({ db }),
    }); 

    await server.start();

    server.applyMiddleware({ app, path: "/api" });

    app.listen(port);

    console.log(`[app]:http://localhost:${port}`);

    const listings = await db.listings.find({}).toArray();

    console.log(listings)
  };



mount(express());
