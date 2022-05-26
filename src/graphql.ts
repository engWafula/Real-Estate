import {GraphQLSchema,GraphQLObjectType, GraphQLString} from "graphql";



const query = new GraphQLObjectType({
    name:"Query",
    fields:{
        hello:{
            type:GraphQLString,
            resolve:()=>"Hello World this is a query"
        }
    }
})



const mutation= new GraphQLObjectType({
    name:"Mutation",
    fields:{
        hello:{
            type:GraphQLString,
            resolve:()=>"Hello World this is a mutation"
        }
    }
})

export const schema =new GraphQLSchema({query,mutation})