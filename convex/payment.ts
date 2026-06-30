"use node";
import { ConvexError } from "convex/values";

export async function initiatePaystackCheckout(args: {
  amount: number,
  email: string,
  reference: string,
  callback_url: string,
  subaccount: string
  transaction_charge?: number,
  metadata: {
    clientName: string,
    clientSurname: string,
    service: string
  }
}) {
  const { amount, email, reference, callback_url, metadata, subaccount, transaction_charge } = args

  const response = await fetch(`${process.env.PAYSTACK_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: amount,
      transaction_charge,
      subaccount,
      reference,
      callback_url,
      metadata,
      currency: "ZAR"
    })
  })
  const result = await response.json()

  if (!result.status) {
    console.error("Paystack checkout error:", result.message);
    throw new ConvexError("We couldn't process your booking at this time. Please try again later.");
  }

  return result.data.authorization_url
}