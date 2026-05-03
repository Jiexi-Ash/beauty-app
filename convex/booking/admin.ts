import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const updateBookingStatus = internalMutation({
  args: {
    bookingId: v.id("booking"),
    status: v.union(v.literal("cancelled"), v.literal("confirmed")),
  },
  handler: async (ctx, { bookingId, status }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking || !booking.bookingPaymentId) return false;

    if (status === "confirmed") {
      await Promise.all([
        ctx.db.patch(booking._id, { status: "confirmed" }),
        ctx.db.patch(booking.bookingPaymentId, { status: "completed" }),
      ]);
    } else {
      await Promise.all([
        ctx.db.patch(booking._id, { status: "failed" }),
        ctx.db.patch(booking.bookingPaymentId, { status: "cancelled" }),
      ]);
    }

    return booking._id;
  },
});

export const getBookingById = internalQuery({
  args: {
    bookingId: v.id("booking"),
  },
  handler: async (ctx, { bookingId }) => {
    return await ctx.db.get(bookingId);
  },
});

export const getBookingPayment = internalQuery({
  args: {
    bookingId: v.id("booking"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookingPayment")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .unique();

    
  },
});

export const createPaymentSplit = internalMutation({
  args: {
    bookingPaymentId: v.id("bookingPayment"),
    amountGross: v.number(),
    amountFee: v.number(),
    amountNet: v.number(),
    platformAmount: v.number(),
    merchantAmount: v.number(),
    commission: v.number(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.bookingPaymentId);
    if (!payment) throw new ConvexError("Booking payment not found.");

    return await ctx.db.insert("paymentSplits", {
      bookingPaymentId: args.bookingPaymentId,
      amountGross: args.amountGross,
      amountFee: args.amountFee,
      amountNet: args.amountNet,
      platformAmount: args.platformAmount,
      merchantAmount: args.merchantAmount,
      commission: args.commission,
    });
  },
});
