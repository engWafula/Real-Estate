import { IResolvers } from "@graphql-tools/utils";
import {Booking,Database,Listing} from "../../../lib/types"

export const BookingResolver:IResolvers = {
    Booking:{
        id:(booking:Booking):String=>{
            return booking. _id.toString()
        },
        listing:(booking:Booking,_args:{},{db}:{db:Database}):Promise<Listing | null>=>{
            return db.listings.findOne({_id:booking.listing})
        }
    }
}