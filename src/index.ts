require('dotenv').config();

import bodyParser from "body-parser";
import express, { Application } from "express";
import { ApolloServer } from "apollo-server-express";
import {  typeDefs,resolvers } from "./graphql";
import { connectDB } from "./database";
import cookieParser from "cookie-parser"



const mount = async (app: Application)=> {

    const db = await connectDB();
     app.use(bodyParser.json({ limit: '3mb' }));
    app.use(cookieParser(process.env.SECRET));

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({res,req}) => ({ db ,res,req}),
    }); 

    await server.start();

    server.applyMiddleware({ app, path: "/api" });

    app.listen(process.env.PORT);

    console.log(`[app]:http://localhost:${process.env.PORT}`);

    // const listings = await db.listings.find({}).toArray();

    // console.log(listings)
  };



mount(express());
