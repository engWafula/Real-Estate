import { Booking, Listing, ListingType } from "../../../lib/types";


export interface ListingArgs{
    id:string;
}

export interface ListingBookingsArgs {
    limit: number;
    page: number;
  }
  
  export interface ListingBookingsData {
    total: number;
    result: Booking[];
  }
  

  export enum ListingsFilter {
    PRICE_LOW_TO_HIGH = "PRICE_LOW_TO_HIGH",
    PRICE_HIGH_TO_LOW = "PRICE_HIGH_TO_LOW"
  }

  export interface ListingsArgs{
    filter:ListingsFilter;
    limit:number;
    page:number;
  }

  export interface ListingsData {
    total: number;
    result: Listing[];
  }

  export interface HostListingInput{
    title:string;
    description:string;
    image:string;
    type:ListingType;
    address:string;
    city:string;
    price:number;
    numOfGuests:number;
    phone:number
    country:string;
    admin:string;
  }

  export interface HostListingArgs {
  input:HostListingInput;
  }