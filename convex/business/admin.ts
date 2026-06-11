import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  QueryCtx,
} from "../_generated/server";
import { GeospatialIndex } from "@convex-dev/geospatial";
import { components, internal } from "../_generated/api";
import { getCurrentUser, getCurrentUserOrThrow } from "../users";
import { Doc, Id } from "../_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { businessDayValidator } from "../schema";
import { BUSINESS_DAYS } from "../../constants";
import { slugify } from "../../lib/utils";
import { endOfMonth, getMonth, getTime, startOfMonth } from "date-fns";

const geospatial = new GeospatialIndex(components.geospatial);

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

export const searchAddressPublic = action({
  args: { input: v.string() },
  handler: async (ctx, { input }) => {
    const address = await ctx.runAction(
      internal.business.actions.searchAddress,
      { input },
    );

    const filteredAddress: { placeId: string; description: string }[] =
      address.filter(
        (item): item is { placeId: string; description: string } =>
          item !== null,
      );

    return filteredAddress;
  },
});

export const createBusiness = action({
  args: {
    name: v.string(),
    description: v.string(),
    address: v.string(),
    coverImageStorageId: v.id("_storage"),
    merchantId: v.number(),
    businessDays: v.array(businessDayValidator),
    placesId: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (
    ctx,
    {
      tags,
      name,
      address,
      coverImageStorageId,
      description,
      placesId,
      businessDays,
      merchantId,
    },
  ) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError("User is unauthenticated");
    }

    const coordinates = await ctx.runAction(
      internal.business.actions.getBusinessCoordinates,
      {
        placesId: placesId,
      },
    );

    if (!coordinates) throw new ConvexError("Could not get coordinates");

    const city =
      (await ctx.runAction(internal.business.actions.getCityFromCoordinates, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      })) ?? "";
    const businessId: Id<"business"> = await ctx.runMutation(
      internal.business.admin.saveBusiness,
      {
        address,
        city,
        businessDays,
        coverImageStorageId,
        description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        merchantId,
        name,
        tags,
      },
    );

    return businessId;
  },
});

export const saveBusiness = internalMutation({
  args: {
    name: v.string(),
    description: v.string(),
    address: v.string(),
    city: v.string(),
    coverImageStorageId: v.id("_storage"),
    merchantId: v.number(),
    businessDays: v.array(businessDayValidator),
    latitude: v.float64(),
    longitude: v.float64(),
    tags: v.array(v.string()),
  },
  handler: async (
    ctx,
    {
      tags,
      name,
      address,
      coverImageStorageId,
      description,
      latitude,
      longitude,
      businessDays,
      merchantId,
      city,
    },
  ) => {
    const businessSlug = slugify(name);

    for (const day of businessDays) {
      const isValidDay = BUSINESS_DAYS.some(
        (d) => d.shortName === day.shortName && d.fullName === day.fullName,
      );
      if (!isValidDay)
        throw new ConvexError(`Invalid business day: ${day.shortName}`);

      if (day.openTime >= day.closeTime) {
        throw new ConvexError(
          `Opening time must be before closing time for ${day.fullName}`,
        );
      }
    }

    const user = await getCurrentUserOrThrow(ctx);
    const userBusiness = await getBusinessByUserId(ctx, user._id);

    if (userBusiness) throw new ConvexError("User already has a business.");

    const businessBySlug = await ctx.db
      .query("business")
      .withIndex("by_slug", (q) => q.eq("slug", businessSlug))
      .first();

    if (businessBySlug)
      throw new ConvexError("A business with that name already exists.");

    const subscription = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_tier", (q) => q.eq("tier", "free"))
      .unique();

    if (!subscription)
      throw new ConvexError(
        "Error pulling the subscription tiers, please try again later.",
      );

    const formattedTags = tags.map((tag) => tag.toLowerCase());

    if (formattedTags.length > 3)
      throw new ConvexError("You can only select a maximum of 3 tags.");

    const businessId = await ctx.db.insert("business", {
      ownerId: user._id,
      name,
      description,
      location: address,
      city,
      coverImageStorageId,
      latitude,
      longitude,
      slug: businessSlug,
      merchantId,
      subscriptionTierId: subscription._id,
      timezone: "Africa/Johannesburg",
      visibility: "hidden",
      tags: formattedTags,
      searchText: `${name} ${city}`,
    });

    await geospatial.insert(
      ctx,
      businessId,
      {
        latitude: latitude,
        longitude: longitude,
      },
      { slug: businessSlug },
    );

    await ctx.db.insert("businessSettings", {
      businessId,
      allowBookingBeyondCloseTime: false,
      bufferTimeMinutes: 0,
      enableBusinessBufferTime: false,
      maxConcurrentBookings: 1,
    });

    await Promise.all(
      businessDays.map((day) =>
        ctx.db.insert("businessHours", {
          businessId,
          closeTime: day.closeTime,
          fullName: day.fullName,
          openTime: day.openTime,
          shortName: day.shortName,
        }),
      ),
    );

    return businessId;
  },
});
export const getUserBusiness = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) return null;

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) return null;
    const coverImageUrl = await ctx.storage.getUrl(
      business.coverImageStorageId,
    );

    return {
      ...business,
      coverImageUrl,
    };
  },
});

export const verifyUserBusiness = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) return false;

    const business = await getBusinessByUserId(ctx, user._id);

    return !!business;
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

export const getBusinessByUserId = (ctx: QueryCtx, userId: Id<"users">) => {
  return ctx.db
    .query("business")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .unique();
};

export const getDashboardAnalytics  = query({
  handler: async (ctx) => {
    const date = new Date()
const monthStart = getTime(startOfMonth(date))
const endMonth = getTime(endOfMonth(date))

    const user = await getCurrentUserOrThrow(ctx);
    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) return undefined

    // total bookings
   const totalBookings = await ctx.db
  .query("booking")
  .withIndex("by_business_and_date", (q) =>
    q
      .eq("businessId", business._id)
      .gte("bookingStartDate", monthStart)
      .lte("bookingStartDate", endMonth)
  ).filter((q) => q.or(q.eq(q.field("status"), "in_progress"), q.eq(q.field("status"), "upcoming"), q.eq(q.field("status"), "completed")))
  .collect();


  // unique clients
  const uniqueClientCount = new Set(totalBookings.map(b => b.userId)).size

  // revenue earned this month, attributed by payment date (when money was
  // received). Uses the denormalized merchantAmount, so no paymentSplits join.
  const payments = await ctx.db
    .query("bookingPayment")
    .withIndex("by_business_and_status_and_date", (q) =>
      q
        .eq("businessId", business._id)
        .eq("status", "completed")
        .gte("paymentDate", monthStart)
        .lte("paymentDate", endMonth),
    )
    .collect();

  const revenue = payments.reduce(
    (sum, payment) => sum + (payment.merchantAmount ?? 0),
    0,
  );

    return {
      revenue,
      reviews: {averageReviews: 0, count: 0},
      totalBookings: totalBookings.length,
      uniqueClients: uniqueClientCount,
      

    }
  },

})

export const getUpcomingAppointments = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, {limit}) => {
    const take = limit ?? 5
    const user = await getCurrentUser(ctx)

    if (!user) return []
      const now = Date.now();

    const business = await ctx.db.query("business").withIndex("by_owner", q => q.eq("ownerId", user._id)).unique()

    if (!business) return []

    const appointments = await ctx.db.query("booking").withIndex("by_business_and_status_and_date", q => q.eq("businessId", business._id).eq("status", "upcoming").gte("bookingStartDate", now)).order("asc").take(take)

    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const client = await ctx.db.get(appointment.userId);
        const service = await ctx.db.get(appointment.serviceId);
        const payment = appointment.bookingPaymentId ? await ctx.db.get(appointment.bookingPaymentId) : null;

        return {
          ...appointment,
          client: { name: client?.fullname, avatar: client?.image, email:client?.email },
          service: { _id: service?._id, name: service?.name, duration: service?.duration },
          payment: payment ? {amount: payment.amount, status: payment.status, type: payment.paymentType } : null,
          business: {timezone:business.timezone}
        };
      })
    );

    return appointmentsWithDetails
  }
})


// types
export type AppointmentWithDetails = Doc<"booking"> & {
  client: { name?: string; avatar?: string, email?:string };
  service: { _id?: Id<"service">; name?: string, duration?: number };
  payment: { amount: number; status: "pending" | "completed" | "failed" | "refunded" | "cancelled", type:"deposit" | "full-payment" } | null;
  business: {timezone: string}
};


/**
 * Top-performing services for the business this month, ranked by number of
 * bookings (statuses that count as real demand). Returns up to `limit`
 * services with their booking counts, plus the total bookings considered.
 */
export const getServiceHighlights = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const take = limit ?? 3;

    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) return null;

    const date = new Date();
    const monthStart = getTime(startOfMonth(date));
    const monthEnd = getTime(endOfMonth(date));

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_business_and_date", (q) =>
        q
          .eq("businessId", business._id)
          .gte("bookingStartDate", monthStart)
          .lte("bookingStartDate", monthEnd),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "in_progress"),
          q.eq(q.field("status"), "upcoming"),
          q.eq(q.field("status"), "completed"),
        ),
      )
      .collect();

    const counts = new Map<Id<"service">, number>();
    for (const booking of bookings) {
      counts.set(booking.serviceId, (counts.get(booking.serviceId) ?? 0) + 1);
    }

    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, take);

    const services = await Promise.all(
      top.map(async ([serviceId, count]) => {
        const service = await ctx.db.get(serviceId);
        return { serviceId, name: service?.name ?? "Unknown service", count };
      }),
    );

    return {
      services,
      totalBookings: bookings.length,
    };
  },
});
