"use node";

import { PayfastPayment } from "../types";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";




export async function initiatePaystackCheckout(args: {
  amount:number,
  email:string,
  reference:string,
  callback_url:string,
  metadata: {
    clientName:string,
    clientSurname:string,
    service:string
  }
}) {
  const {amount,email,reference,callback_url,metadata} = args

  const  response = await fetch(`${process.env.PAYSTACK_CHECKOUT_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
       'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount:amount,
      reference,
      callback_url,
      metadata,
      currency:"ZAR"
    })
  })
  const result = await response.json()

  if (!result.status) {
     throw new ConvexError({
      message: `Paystack Gateway Error: ${result.message}`,
      code: "PAYSTACK_ERROR"
    });
  }

  return result.data.authorization_url
}