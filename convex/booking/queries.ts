import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users";
import {
  formatBookingDate,
  formatBookingShortDate,
  formatBookingTime,
} from "../../lib/utils";

export const getUserBookingById = query({
  args: {
    bookingId: v.id("booking"),
  },
  handler: async (ctx, { bookingId }) => {
    const user = await getCurrentUser(ctx);

    if (!user) return null;

    const booking = await ctx.db.get(bookingId);

    if (!booking) return null;

    if (booking.userId !== user._id) return null;

    const [business, service] = await Promise.all([
      ctx.db.get(booking.businessId),
      ctx.db.get(booking.serviceId),
    ]);

    const bookingPaymentDetails = booking.bookingPaymentId
      ? await ctx.db.get(booking.bookingPaymentId)
      : null;

    return {
      id: booking._id,
      status: booking.status,
      startDate: formatBookingDate(
        booking.bookingStartDate,
        business?.timezone,
      ),

      time: booking.bookingStartDate,
      paymentDetails: {
        amountPaid: bookingPaymentDetails?.amount,
        paymentType: bookingPaymentDetails?.paymentType,
      },
      business: {
        name: business?.name ?? "Unknown Business",
        location: business?.location,
        timezone: business?.timezone,
        coverImage: business
          ? await ctx.storage.getUrl(business?.coverImageStorageId)
          : null,
        tags: business?.tags,
      },
      service: {
        name: service?.name,
      },
    };
  },
});
