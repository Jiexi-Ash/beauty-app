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
import { endOfMonth, getTime, startOfMonth } from "date-fns";

const geospatial = new GeospatialIndex(components.geospatial);

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

export const updateBusinessSettings = mutation({
  args: {
    businessId: v.id("business"),
    allowBookingBeyondCloseTime: v.optional(v.boolean()),
    enableBusinessBufferTime: v.optional(v.boolean()),
    bufferTimeMinutes: v.optional(v.number()),
    maxConcurrentBookings: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const business = await ctx.db.get(args.businessId)

    if (!business) throw new ConvexError("Business not found.")
    if (business.ownerId !== user._id)
      throw new ConvexError("You can only update a business you own.")

    const businessSettings = await ctx.db
      .query("businessSettings")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .unique()

    if (!businessSettings)
      throw new ConvexError("Settings for this business were not found.")

    if (args.bufferTimeMinutes !== undefined && args.bufferTimeMinutes < 0)
      throw new ConvexError("Buffer time cannot be negative.")
    if (args.maxConcurrentBookings !== undefined && args.maxConcurrentBookings < 1)
      throw new ConvexError("Maximum concurrent bookings must be at least 1.")

    // Only patch the fields that were actually provided.
    const updates: {
      allowBookingBeyondCloseTime?: boolean
      enableBusinessBufferTime?: boolean
      bufferTimeMinutes?: number
      maxConcurrentBookings?: number
    } = {}

    if (args.allowBookingBeyondCloseTime !== undefined)
      updates.allowBookingBeyondCloseTime = args.allowBookingBeyondCloseTime
    if (args.enableBusinessBufferTime !== undefined)
      updates.enableBusinessBufferTime = args.enableBusinessBufferTime
    if (args.bufferTimeMinutes !== undefined)
      updates.bufferTimeMinutes = args.bufferTimeMinutes
    if (args.maxConcurrentBookings !== undefined)
      updates.maxConcurrentBookings = args.maxConcurrentBookings

    if (Object.keys(updates).length === 0) return

    await ctx.db.patch(businessSettings._id, updates)
  }
})

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

    const [settings, hours] = await Promise.all([
      ctx.db.query("businessSettings").withIndex("by_business", q => q.eq("businessId", business._id)).unique(),
      ctx.db.query("businessHours").withIndex("by_businessId", q => q.eq("businessId", business._id)).collect()

    ])

    return {
      ...business,
      settings,
      businessHours:hours,
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

export type UserBusinessResult = {
  settings: Doc<"businessSettings"> | null;
  businessHours: Doc<"businessHours">[]
  coverImageUrl: string | null;
} & Doc<"business"> | null


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


/**
 * Client roster for the business: every user who has a real booking (upcoming,
 * in_progress or completed), with their total bookings, total net revenue
 * (denormalized merchantAmount of completed payments) and last visit (most
 * recent completed booking). Sorted by most recent activity.
 */
export const getClients = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) return [];

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .collect();

    type Agg = {
      totalBookings: number;
      revenue: number;
      lastVisit: number | null;
    };
    const map = new Map<Id<"users">, Agg>();
    const bookingToUser = new Map<Id<"booking">, Id<"users">>();

    for (const b of bookings) {
      const isReal =
        b.status === "upcoming" ||
        b.status === "in_progress" ||
        b.status === "completed";
      if (!isReal) continue;

      bookingToUser.set(b._id, b.userId);

      const agg = map.get(b.userId) ?? {
        totalBookings: 0,
        revenue: 0,
        lastVisit: null,
      };
      agg.totalBookings += 1;
      if (b.status === "completed") {
        agg.lastVisit =
          agg.lastVisit === null
            ? b.bookingStartDate
            : Math.max(agg.lastVisit, b.bookingStartDate);
      }
      map.set(b.userId, agg);
    }

    // Attribute revenue via completed payments (mapped back to the client).
    const payments = await ctx.db
      .query("bookingPayment")
      .withIndex("by_business_and_status_and_date", (q) =>
        q.eq("businessId", business._id).eq("status", "completed"),
      )
      .collect();

    for (const p of payments) {
      const userId = bookingToUser.get(p.bookingId);
      if (!userId) continue;
      const agg = map.get(userId);
      if (agg) agg.revenue += p.merchantAmount ?? 0;
    }

    const clients = await Promise.all(
      [...map.entries()].map(async ([userId, agg]) => {
        const u = await ctx.db.get(userId);
        return {
          _id: userId,
          name: u?.fullname ?? "Unknown client",
          email: u?.email ?? null,
          phone: u?.phone ?? null,
          image: u?.image ?? null,
          totalBookings: agg.totalBookings,
          revenue: agg.revenue,
          lastVisit: agg.lastVisit,
        };
      }),
    );

    clients.sort((a, b) => (b.lastVisit ?? 0) - (a.lastVisit ?? 0));
    return clients;
  },
});


/**
 * Replaces a business's operating hours. `days` should contain only the days
 * the business is open; any day omitted is treated as closed (its row removed).
 */
export const updateBusinessHours = mutation({
  args: {
    businessId: v.id("business"),
    days: v.array(businessDayValidator),
  },
  handler: async (ctx, { businessId, days }) => {
    const user = await getCurrentUserOrThrow(ctx);

    const business = await ctx.db.get(businessId);
    if (!business) throw new ConvexError("Business not found.");
    if (business.ownerId !== user._id)
      throw new ConvexError("You can only update a business you own.");

    for (const day of days) {
      const isValidDay = BUSINESS_DAYS.some(
        (d) => d.shortName === day.shortName && d.fullName === day.fullName,
      );
      if (!isValidDay)
        throw new ConvexError(`Invalid business day: ${day.fullName}`);
      if (day.openTime >= day.closeTime)
        throw new ConvexError(
          `Opening time must be before closing time for ${day.fullName}.`,
        );
    }

    // Replace all existing hours rows with the provided open days.
    const existing = await ctx.db
      .query("businessHours")
      .withIndex("by_businessId", (q) => q.eq("businessId", businessId))
      .collect();

    await Promise.all(existing.map((h) => ctx.db.delete(h._id)));
    await Promise.all(
      days.map((day) =>
        ctx.db.insert("businessHours", {
          businessId,
          fullName: day.fullName,
          shortName: day.shortName,
          openTime: day.openTime,
          closeTime: day.closeTime,
        }),
      ),
    );
  },
});


/**
 * Updates a business's address. Re-geocodes the selected place to refresh
 * coordinates and city, then persists via an internal mutation.
 */
export const updateBusinessAddress = action({
  args: {
    businessId: v.id("business"),
    address: v.string(),
    placesId: v.string(),
  },
  handler: async (ctx, { businessId, address, placesId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new ConvexError("User is unauthenticated.");

    const coordinates = await ctx.runAction(
      internal.business.actions.getBusinessCoordinates,
      { placesId },
    );
    if (!coordinates)
      throw new ConvexError("Could not resolve that address.");

    const city =
      (await ctx.runAction(internal.business.actions.getCityFromCoordinates, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      })) ?? "";

    await ctx.runMutation(internal.business.admin.saveBusinessAddress, {
      businessId,
      address,
      city,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });
  },
});

export const saveBusinessAddress = internalMutation({
  args: {
    businessId: v.id("business"),
    address: v.string(),
    city: v.string(),
    latitude: v.float64(),
    longitude: v.float64(),
  },
  handler: async (ctx, { businessId, address, city, latitude, longitude }) => {
    const user = await getCurrentUserOrThrow(ctx);

    const business = await ctx.db.get(businessId);
    if (!business) throw new ConvexError("Business not found.");
    if (business.ownerId !== user._id)
      throw new ConvexError("You can only update a business you own.");

    await ctx.db.patch(businessId, {
      location: address,
      city,
      latitude,
      longitude,
      searchText: `${business.name} ${city}`,
    });

    // Keep the geospatial index in sync with the new coordinates.
    await geospatial.insert(
      ctx,
      businessId,
      { latitude, longitude },
      { slug: business.slug },
    );
  },
});
