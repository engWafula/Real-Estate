import express from "express"
import {ApolloServer} from "apollo-server-express";
import {resolvers,typeDefs,} from "./graphql";

const startServer= async()=>{

const app =express();
const port =9000;


const server = new ApolloServer({typeDefs,resolvers});

await server.start();

server.applyMiddleware({app,path:"/api"})




app.listen(port);

console.log(`[app]:http://localhost:${port}`);

}

startServer();