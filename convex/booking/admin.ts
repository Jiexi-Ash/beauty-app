import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";
import { getCurrentUser } from "../users";
import { getBusinessByUserId } from "../business/admin";
import { tz } from "@date-fns/tz";
import {
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getTime,
  format,
} from "date-fns";

export const updateBookingStatus = internalMutation({
  args: {
    bookingId: v.id("booking"),
    status: v.union(v.literal("cancelled"), v.literal("confirmed")),
  },
  handler: async (ctx, { bookingId, status }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking || !booking.bookingPaymentId)
      return { transitioned: false as const };

    const payment = await ctx.db.get(booking.bookingPaymentId);
    if (!payment) return { transitioned: false as const };

    // Idempotency guard: only act on a payment that is still pending.
    // PayFast delivers ITNs at-least-once, so a duplicate notification finds a
    // terminal status here and becomes a no-op. The check-and-set runs inside
    // this single mutation transaction, so concurrent duplicates can't both
    // pass (the second conflicts and re-reads the terminal status).
    if (payment.status !== "pending") return { transitioned: false as const };

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

    return { transitioned: true as const };
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

    // Denormalize the business's net amount onto the payment so revenue
    // queries don't need to join paymentSplits.
    await ctx.db.patch(args.bookingPaymentId, {
      merchantAmount: args.merchantAmount,
    });

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

export const markCompleted = internalMutation({
  args: { paymentId: v.id("bookingPayment") },
  returns: v.null(),
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) return null;

    const booking = await ctx.db.get(payment.bookingId);
    // Only complete a booking that is still awaiting payment. If it was
    // cancelled after the retry window, do NOT revive it — there is no retry
    // once cancelled (a late success here is a refund case, not a completion).
    if (!booking || booking.status !== "pending") return null;

    await ctx.db.patch(paymentId, { status: "completed" });
    await ctx.db.patch(booking._id, { status: "upcoming" });

    return null;
  },
});

export const markFailed = internalMutation({
  args: { paymentId: v.id("bookingPayment") },
  returns: v.null(),
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) return null;

    // only act if still pending
    if (payment.status !== "pending") return null;

    await ctx.db.patch(paymentId, { status: "failed" });

    // This runs only after Paystack verified the transaction as
    // failed/abandoned (past the retry window), so cancel the booking too.
    const booking = await ctx.db.get(payment.bookingId);
    if (booking && booking.status === "pending") {
      await ctx.db.patch(booking._id, { status: "cancelled_by_payment_failed" });
    }
    return null;
  },
});

export const updateCompletedBookings = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    // Grace window before auto-completing an appointment the owner started but
    // hasn't marked complete — gives them time to close it out manually.
    const inProgressCutoff = now - 15 * 60 * 1000;

    // Upcoming appointments the owner never started: complete at end time.
    const endedUpcoming = await ctx.db
      .query("booking")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .filter((q) => q.lt(q.field("bookingEndDate"), now))
      .collect();

    // In-progress appointments left open past the grace window.
    const staleInProgress = await ctx.db
      .query("booking")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .filter((q) => q.lt(q.field("bookingEndDate"), inProgressCutoff))
      .collect();

    await Promise.all(
      [...endedUpcoming, ...staleInProgress].map((b) =>
        ctx.db.patch(b._id, { status: "completed" }),
      ),
    );
  },
});



/**
 * Returns the business's revenue bucketed by the requested period:
 * - "year"  -> one bucket per month (Jan - Dec)
 * - "month" -> one bucket per week of the current month (Week 1 - Week n)
 * - "week"  -> one bucket per day of the current week (Mon - Sun)
 *
 * Revenue is the business's net share (paymentSplits.merchantAmount) of
 * completed payments, attributed to the payment date (when the money was
 * received). Amounts are in rands (same unit as getDashboardAnalytics).
 */
export const getRevenueData = query({
  args: {
    period: v.union(v.literal("week"), v.literal("month"), v.literal("year")),
  },
  handler: async (ctx, { period }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const business = await ctx.db
      .query("business")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
    if (!business) return [];

    const zone = tz(business.timezone);
    const now = new Date();

    // Build the time buckets for the requested period.
    let points: Date[];
    let rangeEnd: Date;
    let labelFor: (date: Date, index: number) => string;

    if (period === "year") {
      const start = startOfYear(now, { in: zone });
      rangeEnd = endOfYear(now, { in: zone });
      points = eachMonthOfInterval({ start, end: rangeEnd }, { in: zone });
      labelFor = (date) => format(date, "MMM", { in: zone });
    } else if (period === "month") {
      const start = startOfMonth(now, { in: zone });
      rangeEnd = endOfMonth(now, { in: zone });
      points = eachWeekOfInterval(
        { start, end: rangeEnd },
        { weekStartsOn: 1, in: zone },
      );
      labelFor = (_date, index) => `Week ${index + 1}`;
    } else {
      const start = startOfWeek(now, { weekStartsOn: 1, in: zone });
      rangeEnd = endOfWeek(now, { weekStartsOn: 1, in: zone });
      points = eachDayOfInterval({ start, end: rangeEnd }, { in: zone });
      labelFor = (date) => format(date, "EEE", { in: zone });
    }

    const buckets = points.map((point, index) => {
      const next = points[index + 1];
      return {
        label: labelFor(point, index),
        startTs: getTime(point),
        endTs: next ? getTime(next) : getTime(rangeEnd) + 1,
        revenue: 0,
      };
    });

    if (buckets.length === 0) return [];

    const rangeStartTs = buckets[0].startTs;
    const rangeEndTs = getTime(rangeEnd);

    // Completed payments for this business whose paymentDate falls in range.
    // merchantAmount is denormalized onto the payment, so no join is needed.
    const payments = await ctx.db
      .query("bookingPayment")
      .withIndex("by_business_and_status_and_date", (q) =>
        q
          .eq("businessId", business._id)
          .eq("status", "completed")
          .gte("paymentDate", rangeStartTs)
          .lte("paymentDate", rangeEndTs),
      )
      .collect();

    // Sum each payment's net revenue into the bucket of its payment date.
    for (const payment of payments) {
      const amount = payment.merchantAmount ?? 0;
      if (amount === 0) continue;

      const paidAt = payment.paymentDate;
      const bucket = buckets.find(
        (b) => paidAt >= b.startTs && paidAt < b.endTs,
      );
      if (bucket) bucket.revenue += amount;
    }

    return buckets.map(({ label, revenue }) => ({ label, revenue }));
  },
});


/**
 * Starts an upcoming appointment: transitions it to "in_progress".
 * Ownership-checked (the booking must belong to the caller's business) and
 * only valid from the "upcoming" state.
 */
export const startAppointment = mutation({
  args: { bookingId: v.id("booking") },
  handler: async (ctx, { bookingId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError("You must be signed in.");

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) throw new ConvexError("No business found for this user.");

    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.businessId !== business._id) {
      throw new ConvexError("Booking not found.");
    }

    if (booking.status !== "upcoming") {
      throw new ConvexError("Only upcoming appointments can be started.");
    }

    await ctx.db.patch(booking._id, { status: "in_progress" });
    return { ok: true };
  },
});


/**
 * Completes an in-progress appointment: transitions it to "completed".
 * Ownership-checked and only valid from the "in_progress" state.
 */
export const completeAppointment = mutation({
  args: { bookingId: v.id("booking") },
  handler: async (ctx, { bookingId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError("You must be signed in.");

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) throw new ConvexError("No business found for this user.");

    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.businessId !== business._id) {
      throw new ConvexError("Booking not found.");
    }

    if (booking.status !== "in_progress") {
      throw new ConvexError("Only in-progress appointments can be completed.");
    }

    await ctx.db.patch(booking._id, { status: "completed" });
    return { ok: true };
  },
});
