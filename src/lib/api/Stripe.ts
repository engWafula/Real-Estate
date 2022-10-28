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
    },
    charge:async(source:string,amount:number,stripeAccount:string)=>{
        const response = await client.charges.create({
            amount,
            currency: "usd",
            source,
            application_fee_amount: Math.round(amount * 0.05)
          },{
           stripeAccount
          });
       if(response.status!=="succeeded"){
            throw new Error("failed to create charge with stripe")
                 }
        return response;

    }

}