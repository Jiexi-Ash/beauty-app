import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { Context } from "twilio/lib/rest/intelligence/v3/configuration";

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
        ctx.db.patch(booking._id, { status: "upcoming" }),
        ctx.db.patch(booking.bookingPaymentId, { status: "completed" }),
      ]);
    } else {
      await Promise.all([
        ctx.db.patch(booking._id, { status: "cancelled_by_payment_failed" }),
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

export const queryBusinessById = internalQuery({
  args: {
    businessId: v.id("business"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.businessId)
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

export const cancelStalePendingBookings = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - 15 * 60 * 1000

    const stale = await ctx.db
      .query("booking")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.lt(q.field("_creationTime"), cutoff))
      .collect();

      await Promise.all(
      stale.map((b) => ctx.db.patch(b._id, { 
        status: "cancelled_by_payment_failed" 
      }))
    )
  }
})


export const updateCompletedBookings = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .filter((q) => q.lt(q.field("bookingEndDate"), now))
      .collect();

    await Promise.all(
      bookings.map((b) => ctx.db.patch(b._id, { status: "completed" }))
    );
  },
});