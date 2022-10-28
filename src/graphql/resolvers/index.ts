import merge from "lodash.merge"
import { viewerResolvers } from "./Viewer"
import { userResolver} from "./User"
import {ListingResolver} from "./Listing"
import {BookingResolver} from "./Booking"


export const resolvers =merge(viewerResolvers,userResolver,ListingResolver,BookingResolver)