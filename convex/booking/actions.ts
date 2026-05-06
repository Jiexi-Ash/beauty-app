"use node";
import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { initiatePayment } from "../payment";

export const bookSlot = action({
  args: {
    serviceSlug: v.string(),
    businessSlug: v.string(),
    date: v.string(),
    time: v.string(),
    fullName: v.string(),
    phoneNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("You must be logged in to book.");

    const result = await ctx.runMutation(
      internal.booking.public.createBookingRecord,
      {
        serviceSlug: args.serviceSlug,
        businessSlug: args.businessSlug,
        date: args.date,
        time: args.time,
        fullName: args.fullName,
        phoneNumber: args.phoneNumber,
        notes: args.notes,
        clerkId: identity.subject,
      },
    );

    const [firstName, ...lastParts] = args.fullName.split(" ");
    const lastName = lastParts.join(" ") || firstName;
    const depositAmount = (result.servicePrice / 100) * 0.5;

    const paymentData = initiatePayment({
      merchant: {
        merchant_id: process.env.PAYFAST_MERCHANT_ID!,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
        return_url: `${process.env.APP_URL}/profile/bookings?status=success`,
        cancel_url: `${process.env.APP_URL}/payment/cancel`,
        notify_url: `${process.env.HTTP_URL}/api/payfast/notify`,
      },
      customer: {
        name_first: firstName,
        name_last: lastName,
        email_address: identity.email!,
        ...(args.phoneNumber && { cell_number: args.phoneNumber }),
      },
      transactions: {
        m_payment_id: result.bookingPaymentId,
        amount: depositAmount.toFixed(2),
        item_name:
          result.serviceName.charAt(0).toUpperCase() +
          result.serviceName.slice(1),
        custom_str1: result.bookingId,
        custom_str2: result.userId,
      },
      split_payment: {
        merchant_id: result.merchantId,
        percentage: 100 - result.commission,
      },
    });

    return paymentData;
  },
});
