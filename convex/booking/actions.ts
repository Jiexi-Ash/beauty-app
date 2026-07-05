"use node";
import { ConvexError, v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { initiatePaystackCheckout } from "../payment";
import { DEPOSIT_PERCENT } from "../../constants";

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

    const SPLIT_MAX_CENTS = Number(process.env.SPLIT_MAX);
    if (isNaN(SPLIT_MAX_CENTS) || SPLIT_MAX_CENTS <= 0) {
      console.error("SPLIT_MAX env var is missing or invalid — payment split cannot be configured.");
      throw new ConvexError("We couldn't process your booking at this time. Please try again later.");
    }

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
    const depositAmountCents = Math.round(result.servicePrice * DEPOSIT_PERCENT);
    const platformFee = Math.round(depositAmountCents * (result.commission / 100));

    const checkoutArgs: Parameters<typeof initiatePaystackCheckout>[0] = {
      amount: depositAmountCents,
      callback_url: `${process.env.APP_URL}/profile/bookings/${result.bookingId}/confirmation`,
      email: result.email,
      subaccount: result.subaccount,
      transaction_charge: Math.min(platformFee, SPLIT_MAX_CENTS),
      metadata: {
        clientName: firstName,
        clientSurname: lastName,
        service: result.serviceName,
      },
      reference: result.reference,
    };


    const paystackCheckoutUrl = await initiatePaystackCheckout(checkoutArgs);

    return paystackCheckoutUrl
  },
});

export const rescheduleBooking = action({
  args: {
    bookingId: v.id("booking"),
    date: v.string(),
    time: v.string(),
  },
  handler: async (ctx, { bookingId, date, time }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new ConvexError("You must be logged in to reschedule.");

    await ctx.runMutation(internal.booking.public.rescheduleBookingRecord, {
      bookingId: bookingId,
      date: date,
      time: time,
      clerkId: identity.subject,
    });
  },
});

export const verifyAndSyncPaymentForBooking = action({
  args: { bookingId: v.id("booking") },
  returns: v.null(),
  handler: async (ctx, { bookingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("You must be logged in.");

    const [caller, booking] = await Promise.all([
      ctx.runQuery(internal.users.queryUserByClerkId, { clerkId: identity.subject }),
      ctx.runQuery(internal.booking.admin.getBookingById, { bookingId }),
    ]);

    if (!caller || !booking || booking.userId !== caller._id) return null;

    const payment = await ctx.runQuery(
      internal.booking.queries.getLatestForBooking,
      { bookingId },
    );

    if (!payment || payment.status !== "pending" || !payment.paymentReference) {
      return null; // already resolved or nothing to check
    }

    const result = await ctx.runAction(
      internal.paystack.actions.verifyPaystackTransaction,
      { reference: payment.paymentReference },
    );

    if (result.status === "success") {
      if (result.amount !== undefined && result.amount !== payment.amount) {
        console.error(
          `Amount mismatch for ${payment.paymentReference}: expected ${payment.amount}, got ${result.amount}`,
        );
        return null;
      }
      await ctx.runMutation(internal.booking.admin.markCompleted, {
        paymentId: payment._id,
        fees_split: result.fees_split,
      });
    } else if (result.status === "failed" || result.status === "abandoned") {
      await ctx.runMutation(internal.booking.admin.markFailed, {
        paymentId: payment._id,
      });
    }

    return null;
  },
});


export const sweepStalePendingPayments = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const staleThreshold = Date.now() - 15 * 60 * 1000; // retry window; matches the cancel boundary

    const stalePending = await ctx.runQuery(
      internal.booking.queries.getStalePending,
      { staleThreshold },
    );

    for (const payment of stalePending) {
      if (!payment.paymentReference) continue;

      const result = await ctx.runAction(
        internal.paystack.actions.verifyPaystackTransaction,
        { reference: payment.paymentReference },
      );

      if (result.status === "success") {
        if (result.amount !== undefined && result.amount !== payment.amount) {
          console.error(
            `Amount mismatch for ${payment.paymentReference}: expected ${payment.amount}, got ${result.amount}`,
          );
        } else {
          await ctx.runMutation(internal.booking.admin.markCompleted, {
            paymentId: payment._id,
            fees_split: result.fees_split,
          });
        }
      } else if (result.status === "failed" || result.status === "abandoned") {
        await ctx.runMutation(internal.booking.admin.markFailed, {
          paymentId: payment._id,
        });
      }
      // "unknown" (e.g. transient Paystack/API error) → leave pending and
      // retry on the next sweep rather than wrongly failing a valid payment.
    }

    return null;
  },
});
