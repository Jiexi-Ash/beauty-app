import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";

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
    const business = await ctx.db
      .query("business")
      .withIndex("by_slug", (q) => q.eq("slug", args.businessSlug))
      .unique();
    if (!business) throw new ConvexError("Business not found.");

    if (business.visibility !== "visible")
      throw new ConvexError("This business is not active at the moment.");

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
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new ConvexError("User not found.");

    const bookingStart = new Date(`${args.date}T${args.time}:00+02:00`);
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
      q.neq(q.field("status"), "failed"),
      q.neq(q.field("status"), "cancelled_by_user"),
      q.neq(q.field("status"), "cancelled_by_business"),
      q.neq(q.field("status"), "cancelled_by_payment_failed"),
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
      status: "pending",
    });

    const depositPrice = Math.round(service.price * 0.5);

    const bookingPaymentId = await ctx.db.insert("bookingPayment", {
      bookingId,
      businessId: business._id,
      paymentType: "deposit",
      amount: depositPrice,
      paymentDate: Date.now(),
      status: "pending",
      paymentReference: "payfast",
      commission: subTier?.commission ?? 10,
    });

    await ctx.db.patch(bookingId, { bookingPaymentId });

    return {
      bookingId: bookingId as string,
      bookingPaymentId: bookingPaymentId as string,
      businessId: business._id as string,
      serviceId: service._id as string,
      userId: user._id as string,
      serviceName: service.name,
      servicePrice: service.price,
      merchantId: business.merchantId,
      commission: subTier?.commission ?? 10,
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
          .gte("bookingStartDate", newStartMs - service.duration * 60000)
          .lte("bookingStartDate", newEndMs),
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), booking._id),
          q.neq(q.field("status"), "failed"),
          q.neq(q.field("status"), "pending"),
          q.neq(q.field("status"), "cancelled_by_user"),
          q.neq(q.field("status"), "cancelled_by_business"),
          q.neq(q.field("status"), "cancelled_by_payment_failed"),
          q.lt(q.field("bookingStartDate"), newEndMs),
          q.gt(q.field("bookingEndDate"), newStartMs),
        ),
      )
      .collect();

    if (overlapping.length >= maxConcurrent)
      throw new ConvexError("This time slot is fully booked.");

    await ctx.db.patch(booking._id, {
      bookingStartDate: newStartMs,
      bookingEndDate: newEndMs,
    });
  },
});
