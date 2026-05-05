import { query } from "../_generated/server";
import { getCurrentUser } from "../users";

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
        const service = await ctx.db.get(booking.serviceId);
        const business = await ctx.db.get(booking.businessId);

        if (!service || !business)
          return { ...booking, service: null, business: null };

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
        };
      }),
    );

    return bookingWithServiceInfo;
  },
});
