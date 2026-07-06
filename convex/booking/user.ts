import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUser, getCurrentUserOrThrow } from "../users";
import { createNotification } from "../notifications/admin";

export const getUserBookings = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) return null;

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_user_and_date", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();

    const bookingWithServiceInfo = await Promise.all(
      bookings.map(async (booking) => {
        const review =
          booking.status === "completed"
            ? await ctx.db
                .query("reviews")
                .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
                .unique()
            : null;
        const reviewInfo = review
          ? { rating: review.rating, comment: review.comment }
          : null;

        const service = await ctx.db.get(booking.serviceId);
        const business = await ctx.db.get(booking.businessId);

        if (!service || !business)
          return { ...booking, service: null, business: null, review: reviewInfo };

        const serviceImage = await ctx.storage.getUrl(
          service.primaryImageStorageId,
        );
        const businessImage = await ctx.storage.getUrl(
          business.coverImageStorageId,
        );

        return {
          ...booking,
          service: { ...service, serviceImage },
          business: {
            name: business.name,
            location: business.location,
            slug: business.slug,
            timezone: business.timezone,
            coverImageUrl: businessImage,
          },
          review: reviewInfo,
        };
      }),
    );

    return bookingWithServiceInfo;
  },
});

export const cancelBooking = mutation({
  args: {
    bookingId: v.id("booking"),
  },
  handler: async (ctx, { bookingId }) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (!user)
      throw new ConvexError("You need to be logged in to perform this action.");

    const booking = await ctx.db.get(bookingId);

    if (!booking || booking.userId != user._id)
      throw new ConvexError("Booking not found.");

    if (booking.status !== "upcoming") {
      throw new ConvexError("This booking cannot be cancelled.");
    }

    if (booking.bookingStartDate <= Date.now()) {
      throw new ConvexError(
        "This appointment has already started and can no longer be cancelled.",
      );
    }

    await ctx.db.patch(booking._id, {
      status: "cancelled_by_user",
    });

    const service = await ctx.db.get(booking.serviceId);
    await createNotification(ctx, {
      businessId: booking.businessId,
      type: "booking_cancelled",
      message: `${user.fullname} cancelled their ${service?.name ?? "booking"}.`,
      bookingId: booking._id,
    });
  },
});
