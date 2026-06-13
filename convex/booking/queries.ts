import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users";
import { getBusinessByUserId } from "../business/admin";
import { formatBookingDate } from "../../lib/utils";

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

/**
 * Full detail for a single booking, scoped to the business owned by the
 * requesting user. Returns null when the booking doesn't exist or doesn't
 * belong to the caller's business (the page renders not-found in that case).
 */
export const getBookingDetails = query({
  args: { bookingId: v.id("booking") },
  handler: async (ctx, { bookingId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) return null;

    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.businessId !== business._id) return null;

    const [client, service] = await Promise.all([
      ctx.db.get(booking.userId),
      ctx.db.get(booking.serviceId),
    ]);

    const payment = booking.bookingPaymentId
      ? await ctx.db.get(booking.bookingPaymentId)
      : null;

    const serviceImage = service?.primaryImageStorageId
      ? await ctx.storage.getUrl(service.primaryImageStorageId)
      : null;

    // Financials (all amounts in cents).
    const totalFee = service?.price ?? 0;
    const paid = payment?.status === "completed" ? payment.amount : 0;
    const remaining = Math.max(totalFee - paid, 0);

    // Booking history: this client's other bookings at this business,
    // most recent first.
    const clientBookings = await ctx.db
      .query("booking")
      .withIndex("by_user_and_date", (q) => q.eq("userId", booking.userId))
      .order("desc")
      .collect();

    const history = await Promise.all(
      clientBookings
        .filter((b) => b.businessId === business._id && b._id !== booking._id)
        .slice(0, 8)
        .map(async (b) => {
          const s = await ctx.db.get(b.serviceId);
          return {
            _id: b._id,
            serviceName: s?.name ?? "Service",
            date: b.bookingStartDate,
            price: s?.price ?? 0,
            status: b.status,
          };
        }),
    );

    return {
      booking: {
        _id: booking._id,
        status: booking.status,
        bookingStartDate: booking.bookingStartDate,
        bookingEndDate: booking.bookingEndDate,
        notes: booking.notes ?? null,
      },
      client: {
        name: client?.fullname ?? "Unknown client",
        email: client?.email ?? null,
        phone: client?.phone ?? null,
        image: client?.image ?? null,
      },
      service: {
        name: service?.name ?? "Service",
        description: service?.description ?? null,
        duration: service?.duration,
        price: service?.price ?? 0,
        imageUrl: serviceImage,
      },
      payment: payment
        ? {
            amount: payment.amount,
            status: payment.status,
            type: payment.paymentType,
          }
        : null,
      financials: { totalFee, paid, remaining },
      history,
      business: { timezone: business.timezone },
    };
  },
});
