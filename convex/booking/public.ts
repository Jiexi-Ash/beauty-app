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
          .gte(
            "bookingStartDate",
            bookingStart.getTime() - service.duration * 60000,
          )
          .lte("bookingStartDate", bookingEnd.getTime()),
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "failed"),
          q.lt(q.field("bookingStartDate"), bookingEnd.getTime()),
          q.gt(q.field("bookingEndDate"), bookingStart.getTime()),
        ),
      )
      .collect();

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
