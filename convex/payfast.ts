"use node";

import * as crypto from "crypto";
import * as dns from "dns/promises";
import { PayfastITN, PayfastPayment } from "../types";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const VALID_PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
  "sandbox.payfast.co.za",
];

export const generateSignature = (data: PayfastPayment) => {
  const encode = (v: string) =>
    encodeURIComponent(v.trim())
      .replace(/%20/g, "+")
      .replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase());

  const passPhrase = process.env.PAYFAST_PASSPHRASE;

  // Fields in exact PayFast-required order: merchant, customer, transaction, then top-level
  const fields: [string, unknown][] = [
    // Merchant details
    ["merchant_id", data.merchant.merchant_id],
    ["merchant_key", data.merchant.merchant_key],
    ["return_url", data.merchant.return_url],
    ["cancel_url", data.merchant.cancel_url],
    ["notify_url", data.merchant.notify_url],
    ["fica_idnumber", data.merchant.fica_idnumber],
    // Customer details
    ["name_first", data.customer.name_first],
    ["name_last", data.customer.name_last],
    ["email_address", data.customer.email_address],
    ["cell_number", data.customer.cell_number],
    // Transaction details
    ["m_payment_id", data.transactions.m_payment_id],
    ["amount", data.transactions.amount],
    ["item_name", data.transactions.item_name],
    ["item_description", data.transactions.item_description],
    ["custom_int1", data.transactions.custom_int1],
    ["custom_int2", data.transactions.custom_int2],
    ["custom_int3", data.transactions.custom_int3],
    ["custom_int4", data.transactions.custom_int4],
    ["custom_int5", data.transactions.custom_int5],
    ["custom_str1", data.transactions.custom_str1],
    ["custom_str2", data.transactions.custom_str2],
    ["custom_str3", data.transactions.custom_str3],
    ["custom_str4", data.transactions.custom_str4],
    ["custom_str5", data.transactions.custom_str5],
    // Top-level fields
    ["email_confirmation", data.email_confirmation],
    ["confirmation_address", data.confirmation_address],
  ];

  const pfOutput = fields
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encode(String(v))}`)
    .join("&");

  const getString = passPhrase
    ? `${pfOutput}&passphrase=${encode(passPhrase)}`
    : pfOutput;

  return crypto.createHash("md5").update(getString).digest("hex");
};

export const verifyITNSignature = (
  body: string,
  passPhrase = "jt7NOE43FZPn",
) => {
  const encode = (v: string) =>
    encodeURIComponent(v.trim())
      .replace(/%20/g, "+")
      .replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase());

  const pfParamString = body
    .split("&")
    .filter((pair) => !pair.startsWith("signature="))
    .join("&");

  const getString = passPhrase
    ? `${pfParamString}&passphrase=${encode(passPhrase)}`
    : pfParamString;

  const signature = Object.fromEntries(new URLSearchParams(body)).signature;

  const generated = crypto.createHash("md5").update(getString).digest("hex");

  return generated === signature;
};

export const handleITN = internalAction({
  args: {
    body: v.string(),
    pfIp: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { body, pfIp }) => {
    const params = Object.fromEntries(new URLSearchParams(body)) as Record<
      string,
      string
    >;

    const itn = params as unknown as PayfastITN;

    const isSignatureValid = verifyITNSignature(body);
    if (!isSignatureValid) {
      console.error("Invalid signature");
      return false;
    }

    const isValidDomain = await isValidPayfastIP(pfIp);

    if (!isValidDomain) {
      console.error("Invalid domain");
      return false;
    }

    const bookingPayment = await ctx.runQuery(
      internal.booking.admin.getBookingPayment,
      { bookingId: itn.custom_str1 as Id<"booking"> },
    );

    if (!bookingPayment) {
      console.error("Booking not found");
      return false;
    }

    const isValidAmount = validatePaymentAmount(
      bookingPayment.amount,
      parseFloat(itn.amount_gross),
    );

    if (!isValidAmount) {
      console.error("Amount invalid");
      return false;
    }

    const isServerConfirmed = await validateWithPayfast(params, true);

    if (!isServerConfirmed) {
      console.error("PayFast server confirmation failed");
      return false;
    }

    await ctx.runMutation(internal.booking.admin.updateBookingStatus, {
      bookingId: itn.custom_str1 as Id<"booking">,
      status: itn.payment_status === "COMPLETE" ? "confirmed" : "cancelled",
    });

    if (itn.payment_status === "COMPLETE") {
      const amountGross = parseFloat(itn.amount_gross as unknown as string);
      const amountFee = parseFloat(itn.amount_fee as unknown as string);
      const amountNet = parseFloat(itn.amount_net as unknown as string);
      const merchantAmount =
        amountGross * ((100 - bookingPayment.commission) / 100);
      const platformAmount = parseFloat(
        (amountNet - merchantAmount).toFixed(2),
      );

      await ctx.runMutation(internal.booking.admin.createPaymentSplit, {
        bookingPaymentId: bookingPayment._id,
        amountGross,
        amountFee,
        amountNet,
        platformAmount,
        merchantAmount,
        commission: bookingPayment.commission,
      });
    }
  },
});

export const isValidPayfastIP = async (
  pfIp: string | null,
): Promise<boolean> => {
  if (!pfIp) return false;

  try {
    const validIps: string[] = [];

    for (const host of VALID_PAYFAST_HOSTS) {
      const results = await dns.lookup(host, { all: true });
      validIps.push(...results.map((r) => r.address));
    }

    const uniqueIps = [...new Set(validIps)];
    return uniqueIps.includes(pfIp);
  } catch (err) {
    console.error("PayFast IP lookup failed:", err);
    return false;
  }
};

const validatePaymentAmount = (
  bookingAmounmtGross: number,
  payfastITNAmountGross: number,
) => {
  // payment.amount is in cents, amountGross is in rands
  if (!bookingAmounmtGross) return false;
  const expectedRands = bookingAmounmtGross / 100;

  return Math.abs(expectedRands - payfastITNAmountGross) <= 0.01;
};

export const validateWithPayfast = async (
  params: Record<string, string>,
  isSandbox = true,
): Promise<boolean> => {
  const host = isSandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";

  // Remove signature from params for validation string
  const { signature, ...rest } = params;

  const pfParamString = Object.entries(rest)
    .filter(([, v]) => v !== "" && v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join("&");

  try {
    const response = await fetch(`https://${host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pfParamString,
    });

    const result = await response.text();
    return result === "VALID";
  } catch (err) {
    console.error("PayFast server validation failed:", err);
    return false;
  }
};
