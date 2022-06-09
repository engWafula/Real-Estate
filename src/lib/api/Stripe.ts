import stripe from "stripe"

const client = new stripe(`${process.env.S_SECRET_KEY}`, {
    //@ts-ignore
  apiVersion: "2019-12-03"
})

export const Stripe={
    connect:async(code:string)=>{
        const response = await client.oauth.token({
            grant_type: "authorization_code",
            code
          });
  
      return response;
    }

}