import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  MutationCtx,
  query,
} from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { getCurrentUser } from "../users";
import { getBusinessByUserId } from "../business/admin";
import { createNotification } from "../notifications/admin";
import { internal } from "../_generated/api";
import { NO_SHOW_CORRECTION_WINDOW_HOURS } from "../../constants";
import { computeSplitFallback } from "../paystack/split";
import { assertSlotAvailable } from "./availability";
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

export const markCompleted = internalMutation({
  args: {
    paymentId: v.id("bookingPayment"),
    fees_split: v.optional(v.object({
      paystack: v.number(),
      integration: v.number(),
      subaccount: v.number(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, { paymentId, fees_split }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) return null;

    const booking = await ctx.db.get(payment.bookingId);
    // Only complete a booking that is still awaiting payment. If it was
    // cancelled after the retry window, do NOT revive it — there is no retry
    // once cancelled (a late success here is a refund case, not a completion).
    if (!booking || booking.status !== "pending") return null;

    const { paystackFee, platformAmount, merchantAmount, amountNet } =
      computeSplitFallback(payment.amount, payment.commission, fees_split);

    await ctx.db.patch(paymentId, { status: "completed", merchantAmount, paymentDate: Date.now() });
    await ctx.db.patch(booking._id, { status: "upcoming" });

    await ctx.db.insert("paymentSplits", {
      bookingPaymentId: paymentId,
      amountGross: payment.amount,
      amountFee: paystackFee,
      amountNet,
      platformAmount,
      merchantAmount,
      commission: payment.commission,
    });

    const [service, customer] = await Promise.all([
      ctx.db.get(booking.serviceId),
      ctx.db.get(booking.userId),
    ]);

    await createNotification(ctx, {
      businessId: booking.businessId,
      type: "booking_created",
      message: `New booking: ${service?.name ?? "a service"} with ${customer?.fullname ?? "a customer"}.`,
      bookingId: booking._id,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.messages.SendWhatsAppBookingConfirmedMessage,
      { bookingId: booking._id },
    );

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

/**
 * Compensating action for when Paystack checkout initialization fails right
 * after createBookingRecord already committed the booking+payment as
 * "pending" — Convex actions don't roll back mutations when a later external
 * call fails, so this cancels the orphaned booking explicitly, freeing the
 * slot immediately instead of waiting on the stale-pending sweep (which can't
 * resolve a payment reference Paystack never actually registered). Idempotent:
 * no-ops if either record has already moved past "pending".
 */
export const cancelOrphanedBooking = internalMutation({
  args: {
    bookingId: v.id("booking"),
    bookingPaymentId: v.id("bookingPayment"),
  },
  returns: v.null(),
  handler: async (ctx, { bookingId, bookingPaymentId }) => {
    const booking = await ctx.db.get(bookingId);
    if (booking && booking.status === "pending") {
      await ctx.db.patch(bookingId, { status: "cancelled_by_payment_failed" });
    }

    const payment = await ctx.db.get(bookingPaymentId);
    if (payment && payment.status === "pending") {
      await ctx.db.patch(bookingPaymentId, { status: "failed" });
    }

    return null;
  },
});

export const updateCompletedBookings = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    // Grace window before auto-completing a booking the owner started but
    // hasn't marked complete — gives them time to close it out manually.
    const inProgressCutoff = now - 15 * 60 * 1000;

    // Upcoming bookings the owner never started by end time: the client
    // never showed, so this resolves to no_show rather than completed.
    const endedUpcoming = await ctx.db
      .query("booking")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .filter((q) => q.lt(q.field("bookingEndDate"), now))
      .collect();

    // In-progress bookings left open past the grace window: they started,
    // so the service happened even if the owner forgot to close it out.
    const staleInProgress = await ctx.db
      .query("booking")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .filter((q) => q.lt(q.field("bookingEndDate"), inProgressCutoff))
      .collect();

    await Promise.all([
      ...endedUpcoming.map(async (b) => {
        await ctx.db.patch(b._id, { status: "no_show" });

        const service = await ctx.db.get(b.serviceId);
        await createNotification(ctx, {
          businessId: b.businessId,
          type: "booking_no_show",
          message: `${service?.name ?? "A booking"} was marked as a no-show — the client never checked in.`,
          bookingId: b._id,
        });
      }),
      ...staleInProgress.map(async (b) => {
        await ctx.db.patch(b._id, { status: "completed" });

        const service = await ctx.db.get(b.serviceId);
        await createNotification(ctx, {
          businessId: b.businessId,
          type: "booking_auto_completed",
          message: `${service?.name ?? "A booking"} was automatically marked complete.`,
          bookingId: b._id,
        });
      }),
    ]);
  },
});

export const getBookingsDueForReminder = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now + 24 * 60 * 60 * 1000;

    const upcoming = await ctx.db
      .query("booking")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .filter((q) =>
        q.and(
          q.gt(q.field("bookingStartDate"), now),
          q.lte(q.field("bookingStartDate"), cutoff),
        ),
      )
      .collect();

    return upcoming.filter((b) => !b.reminderSent);
  },
});

export const markReminderSent = internalMutation({
  args: { bookingId: v.id("booking") },
  returns: v.null(),
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, { reminderSent: true });
    return null;
  },
});

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
      const amount = payment.merchantAmount ? (payment.merchantAmount / 100) : 0;
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


export const startBooking = mutation({
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
      throw new ConvexError("Only upcoming bookings can be started.");
    }

    await ctx.db.patch(booking._id, { status: "in_progress" });
    return { ok: true };
  },
});


/**
 * Attests that a deposit's remaining balance was collected outside the app
 * (cash/card in person). Self-reported, not commission-bearing — never
 * touches `status`/`amount`/`merchantAmount`, which stay verified-Paystack
 * only. The eligibility guard is load-bearing for `completeBooking`, which
 * calls this unconditionally with no pre-check of its own; it's redundant
 * defense-in-depth for `markBalanceCollected`, which already validates the
 * same conditions itself with more specific, user-facing error messages
 * before calling in.
 */
async function settleDepositBalance(
  ctx: MutationCtx,
  payment: Doc<"bookingPayment">,
): Promise<void> {
  if (
    payment.status !== "completed" ||
    payment.paymentType !== "deposit" ||
    payment.balanceCollected
  ) {
    return;
  }

  await ctx.db.patch(payment._id, {
    balanceCollected: true,
    balanceCollectedAt: Date.now(),
    balanceCollectedSource: "manual",
  });
}

/**
 * Completes an in-progress booking: transitions it to "completed".
 * Ownership-checked and only valid from the "in_progress" state.
 *
 * `balanceCollected` is an optional owner attestation, surfaced in the same
 * completion dialog, that the remaining deposit balance was collected
 * outside the app (cash/card in person). It's self-reported and never
 * touches `status`/`amount`/`merchantAmount` on the payment record, so it
 * can't be conflated with verified Paystack revenue.
 */
export const completeBooking = mutation({
  args: {
    bookingId: v.id("booking"),
    balanceCollected: v.optional(v.boolean()),
  },
  handler: async (ctx, { bookingId, balanceCollected }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError("You must be signed in.");

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) throw new ConvexError("No business found for this user.");

    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.businessId !== business._id) {
      throw new ConvexError("Booking not found.");
    }

    if (booking.status !== "in_progress") {
      throw new ConvexError("Only in-progress bookings can be completed.");
    }

    // Data-integrity guard on the status transition itself, independent of
    // verification: a booking shouldn't be completable before it's started.
    if (booking.bookingStartDate > Date.now()) {
      throw new ConvexError("Cannot mark a booking complete before its start time.");
    }

    await ctx.db.patch(booking._id, { status: "completed" });

    if (balanceCollected && booking.bookingPaymentId) {
      const payment = await ctx.db.get(booking.bookingPaymentId);
      if (payment) await settleDepositBalance(ctx, payment);
    }

    return { ok: true };
  },
});

/**
 * Fallback for settling a deposit balance after the fact (the owner didn't
 * check the box at completion time). Same attestation semantics as the
 * `balanceCollected` flag on `completeBooking` — self-reported, not
 * commission-bearing, kept off the verified payment fields.
 */
export const markBalanceCollected = mutation({
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

    if (booking.status !== "completed") {
      throw new ConvexError(
        "Only completed appointments can have their balance marked as collected.",
      );
    }

    if (!booking.bookingPaymentId) {
      throw new ConvexError("This appointment has no payment on record.");
    }

    const payment = await ctx.db.get(booking.bookingPaymentId);
    if (!payment || payment.status !== "completed" || payment.paymentType !== "deposit") {
      throw new ConvexError("This appointment has no outstanding balance to collect.");
    }

    if (payment.balanceCollected) {
      throw new ConvexError("This balance has already been marked as collected.");
    }

    await settleDepositBalance(ctx, payment);

    return { ok: true };
  },
});

/**
 * Cancels an upcoming booking on the business's side: transitions it to
 * "cancelled_by_business" and notifies the client via WhatsApp. Deposits
 * are non-refundable per policy, so this does not touch payment records.
 */
export const cancelBookingByBusiness = mutation({
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
      throw new ConvexError("Only upcoming bookings can be cancelled.");
    }

    if (booking.bookingStartDate <= Date.now()) {
      throw new ConvexError(
        "This appointment has already started and can no longer be cancelled.",
      );
    }

    await ctx.db.patch(booking._id, { status: "cancelled_by_business" });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.messages.SendWhatsAppBookingCancelledMessage,
      { bookingId: booking._id },
    );

    return { ok: true };
  },
});

/**
 * Corrects an auto-marked no_show back to completed, for when the business
 * forgot to click Start but the client actually attended. Only allowed
 * within NO_SHOW_CORRECTION_WINDOW_HOURS of the booking's end time, so old
 * no-shows can't be flipped to completed long after the fact. Silent by
 * design — the business already knows what they did.
 */
export const markNoShowAsCompleted = mutation({
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

    if (booking.status !== "no_show") {
      throw new ConvexError("Only bookings marked as a no-show can be corrected.");
    }

    const correctionWindowMs = NO_SHOW_CORRECTION_WINDOW_HOURS * 60 * 60 * 1000;
    if (Date.now() > booking.bookingEndDate + correctionWindowMs) {
      throw new ConvexError(
        `No-shows can only be corrected within ${NO_SHOW_CORRECTION_WINDOW_HOURS} hours of the appointment.`,
      );
    }

    await ctx.db.patch(booking._id, { status: "completed" });
    return { ok: true };
  },
});

/**
 * Reschedules an upcoming booking on the business's side to a new date/time.
 * Unlike the client-initiated reschedule (booking.public.rescheduleBookingRecord),
 * this has no minimum-notice restriction — the owner should be able to
 * reschedule anytime, including last-minute. Slot availability is still
 * enforced with the same overlap logic so the new time can't double-book.
 */
export const rescheduleBookingByBusiness = mutation({
  args: {
    bookingId: v.id("booking"),
    date: v.string(),
    time: v.string(),
  },
  handler: async (ctx, { bookingId, date, time }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError("You must be signed in.");

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) throw new ConvexError("No business found for this user.");

    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.businessId !== business._id) {
      throw new ConvexError("Booking not found.");
    }

    if (booking.status !== "upcoming") {
      throw new ConvexError("Only upcoming appointments can be rescheduled.");
    }

    const service = await ctx.db.get(booking.serviceId);
    if (!service) throw new ConvexError("Service not found.");

    const newStart = new Date(`${date}T${time}:00+02:00`);
    if (Number.isNaN(newStart.getTime())) {
      throw new ConvexError("Invalid date or time.");
    }

    const newStartMs = newStart.getTime();
    const newEndMs = newStartMs + service.duration * 60000;

    if (newStartMs <= Date.now()) {
      throw new ConvexError("New appointment time must be in the future.");
    }

    if (
      newStartMs === booking.bookingStartDate &&
      newEndMs === booking.bookingEndDate
    ) {
      throw new ConvexError(
        "New time is the same as the current appointment time.",
      );
    }

    await assertSlotAvailable(ctx, {
      businessId: business._id,
      excludeBookingId: booking._id,
      newStartMs,
      newEndMs,
    });

    await ctx.db.patch(booking._id, {
      bookingStartDate: newStartMs,
      bookingEndDate: newEndMs,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.messages.SendWhatsAppBookingRescheduledMessage,
      { bookingId: booking._id },
    );

    return { ok: true };
  },
});
