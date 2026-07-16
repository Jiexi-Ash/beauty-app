import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";
import {
  ACTIVE_BOOKING_STATUSES,
  DEPOSIT_PERCENT,
  RESCHEDULE_MIN_NOTICE_HOURS,
} from "../../constants";
import { createNotification } from "../notifications/admin";
import { assertSlotAvailable } from "./availability";

export const createBookingRecord = internalMutation({
  args: {
    serviceSlug: v.string(),
    businessSlug: v.string(),
    date: v.string(),
    time: v.string(),
    fullName: v.string(),
    phoneNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    clerkId: v.string(),
  },

  handler: async (ctx, args) => {
    if (args.phoneNumber && !/^\+?[0-9\s-]{10,15}$/.test(args.phoneNumber)) {
      throw new ConvexError("Enter a valid phone number.");
    }

    const business = await ctx.db
      .query("business")
      .withIndex("by_slug", (q) => q.eq("slug", args.businessSlug))
      .unique();
    if (!business) throw new ConvexError("Business not found.");

    if (business.visibility !== "visible")
      throw new ConvexError("This business is not active at the moment.");

    const businessBanking = await ctx.db.query("businessBanking").withIndex("by_business", q => q.eq("businessId", business._id)).unique()

    if (!businessBanking || !businessBanking?.subAccountCode) throw new ConvexError("This business is not yet set up to accept payments.")

    const service = await ctx.db
      .query("service")
      .withIndex("by_business_and_slug", (q) =>
        q.eq("businessId", business._id).eq("slug", args.serviceSlug),
      )
      .unique();
    if (!service) throw new ConvexError("Service not found.");

    if (service.visibility !== "visible")
      throw new ConvexError("This service is not available.");
    if (service.businessId !== business._id)
      throw new ConvexError("Service and business do not match.");

    const subTier = await ctx.db.get(business.subscriptionTierId);
    if (!subTier) throw new ConvexError("Business subscription tier not found.");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new ConvexError("User not found.");

    // Rate limit: without this, the overlap check below (which treats
    // "pending" as slot-blocking) can be gamed — a user can repeatedly
    // start-and-abandon checkout to hold a single-slot solo operator's
    // calendar indefinitely, since each abandoned hold only clears after the
    // ~15-20min stale-pending sweep, and nothing stops immediately re-creating
    // one. Counts only pending/abandoned attempts, not completed bookings, so
    // a legitimate repeat customer isn't penalized.
    const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
    const RATE_LIMIT_MAX_ATTEMPTS = 3;

    const recentAttempts = await ctx.db
      .query("booking")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    const recentAbandonedAttempts = recentAttempts.filter(
      (b) =>
        b.businessId === business._id &&
        b._creationTime > Date.now() - RATE_LIMIT_WINDOW_MS &&
        (b.status === "pending" || b.status === "cancelled_by_payment_failed"),
    );

    if (recentAbandonedAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
      throw new ConvexError(
        "Too many recent booking attempts. Please wait a while before trying again, or contact the business directly.",
      );
    }

    const bookingStart = new Date(`${args.date}T${args.time}:00+02:00`);
    if (Number.isNaN(bookingStart.getTime()))
      throw new ConvexError("Invalid date or time.");
    if (bookingStart.getTime() <= Date.now())
      throw new ConvexError("Booking time must be in the future.");

    const bookingEnd = new Date(
      bookingStart.getTime() + service.duration * 60000,
    );

    const settings = await ctx.db
      .query("businessSettings")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .unique();

    const maxConcurrent = settings?.maxConcurrentBookings ?? 1;

    const overlapping = await ctx.db
      .query("booking")
      .withIndex("by_business_and_date", (q) =>
        q
          .eq("businessId", business._id)
          // Go back far enough to catch any long-running booking that might overlap
          .gte("bookingStartDate", bookingStart.getTime() - 24 * 60 * 60 * 1000) // 24hr lookback
          .lte("bookingStartDate", bookingEnd.getTime()),
      )
      .filter((q) =>
        q.and(
          q.or(
            ...ACTIVE_BOOKING_STATUSES.map((status) =>
              q.eq(q.field("status"), status),
            ),
          ),
          q.lt(q.field("bookingStartDate"), bookingEnd.getTime()),
          q.gt(q.field("bookingEndDate"), bookingStart.getTime()),
        ),
      )
      .collect()

    if (overlapping.length >= maxConcurrent)
      throw new ConvexError("This time slot is fully booked.");

    const bookingId = await ctx.db.insert("booking", {
      businessId: business._id,
      serviceId: service._id,
      userId: user._id,
      bookingStartDate: bookingStart.getTime(),
      bookingEndDate: bookingEnd.getTime(),
      notes: args.notes,
      phoneNumber: args.phoneNumber,
      status: "pending",
    });

    const depositPrice = Math.round(service.price * DEPOSIT_PERCENT);
    const reference = `${bookingId}_${Date.now()}`

    const bookingPaymentId = await ctx.db.insert("bookingPayment", {
      bookingId,
      businessId: business._id,
      paymentType: "deposit",
      amount: depositPrice,
      paymentDate: Date.now(),
      status: "pending",
      paymentReference: reference,
      commission: subTier.commission,
    });

    await ctx.db.patch(bookingId, { bookingPaymentId });

    return {
      bookingId: bookingId as string,
      bookingPaymentId: bookingPaymentId as string,
      businessId: business._id as string,
      serviceId: service._id as string,
      userId: user._id as string,
      serviceName: service.name,
      depositAmount: depositPrice,
      commission: subTier.commission,
      reference,
      email: user.email,
      subaccount: businessBanking.subAccountCode
    };
  },
});

export const rescheduleBookingRecord = internalMutation({
  args: {
    bookingId: v.id("booking"),
    date: v.string(),
    time: v.string(),
    clerkId: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new ConvexError("User not found.");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError("Booking not found.");

    if (booking.userId !== user._id)
      throw new ConvexError("You are not allowed to reschedule this booking.");

    if (booking.status !== "upcoming")
      throw new ConvexError("This booking cannot be rescheduled.");

    const minNoticeMs = RESCHEDULE_MIN_NOTICE_HOURS * 60 * 60 * 1000;
    if (booking.bookingStartDate - Date.now() < minNoticeMs)
      throw new ConvexError(
        `Bookings can only be rescheduled at least ${RESCHEDULE_MIN_NOTICE_HOURS} hours before the appointment.`,
      );

    const business = await ctx.db.get(booking.businessId);
    if (!business) throw new ConvexError("Business not found.");
    if (business.visibility !== "visible")
      throw new ConvexError("This business is not active at the moment.");

    const service = await ctx.db.get(booking.serviceId);
    if (!service) throw new ConvexError("Service not found.");
    if (service.visibility !== "visible")
      throw new ConvexError("This service is not available.");

    const newStart = new Date(`${args.date}T${args.time}:00+02:00`);
    if (Number.isNaN(newStart.getTime()))
      throw new ConvexError("Invalid date or time.");

    const newStartMs = newStart.getTime();
    const newEndMs = newStartMs + service.duration * 60000;

    if (newStartMs <= Date.now())
      throw new ConvexError("New booking time must be in the future.");

    if (
      newStartMs === booking.bookingStartDate &&
      newEndMs === booking.bookingEndDate
    )
      throw new ConvexError(
        "New time is the same as the current booking time.",
      );

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

    await createNotification(ctx, {
      businessId: business._id,
      type: "booking_rescheduled",
      message: `${user.fullname} rescheduled their ${service.name} booking.`,
      bookingId: booking._id,
    });
  },
});
