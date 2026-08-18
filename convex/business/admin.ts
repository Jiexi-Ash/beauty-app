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
import { BUSINESS_DAYS, VERIFICATION_THRESHOLD } from "../../constants";
import { slugify } from "../../lib/utils";

const ALLOWED_TAGS = [
  "Hair Styling", "Nails", "Barbershop", "Massage",
  "Lashes", "Makeup", "Luxury Spa", "Skincare",
] as const;

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
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

export const updateBusinessDescription = mutation({
  args: {
    description: v.string(),
  },
  handler: async (ctx, { description }) => {
    const user = await getCurrentUserOrThrow(ctx)

    const business = await ctx.db.query("business").withIndex("by_owner", q => q.eq("ownerId", user._id)).unique()

    if (!business) throw new ConvexError("You need to have a business to perform this action.")

    const trimmed = description.trim()

    if (trimmed.length < 10)
      throw new ConvexError("Business description must have at least 10 characters.")
    if (trimmed.length > 250)
      throw new ConvexError("Business description cannot exceed 250 characters.")

    await ctx.db.patch(business._id, {
      description: trimmed,
    })
  }
})

export const toggleBusinessVisibilty = mutation({
  args: {
    visibility: v.union(v.literal("visible"), v.literal("offline")),
  },
  handler: async (ctx, { visibility }) => {
    const user = await getCurrentUserOrThrow(ctx)

    const business = await ctx.db.query("business").withIndex("by_owner", q => q.eq("ownerId", user._id)).unique()

    if (!business) throw new ConvexError("You need to have a business to perform this action.")

    if (visibility === "visible") {
      const hasVisibleService = await ctx.db
        .query("service")
        .withIndex("by_business_visibility", q => q.eq("businessId", business._id).eq("visibility", "visible"))
        .first()

      if (!hasVisibleService)
        throw new ConvexError("Add at least one service before going live.")
    }

    await ctx.db.patch(business._id, {
      visibility,
    })


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
    businessDays: v.array(businessDayValidator),
    placesId: v.string(),
    tags: v.array(v.string()),
    paystackBusinessName: v.string(),
    paystackBank: v.string(),
    paystackAccountNumber: v.string(),
    paystackEmail: v.string(),
    paystackPhone: v.string(),
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
      paystackBusinessName,
      paystackBank,
      paystackAccountNumber,
      paystackEmail,
      paystackPhone,
    },
  ) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError("User is unauthenticated");
    }

    const alreadyHasBusiness = await ctx.runQuery(internal.business.admin.checkUserHasBusiness);
    if (alreadyHasBusiness) {
      throw new ConvexError("You already have a business registered.");
    }

    const freeTier = await ctx.runQuery(internal.business.admin.getFreeTier);

    const subAccount = await ctx.runAction(internal.paystack.actions.createSubAccount, {
      businessName: paystackBusinessName,
      settlementBank: paystackBank,
      accountNumber: paystackAccountNumber,
      percentageCharge: freeTier.commission,
      primaryContactEmail: paystackEmail,
      primaryContactPhone: paystackPhone,
    });

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
        name,
        tags,
        subscriptionTierId: freeTier._id,
      },
    );

    await ctx.runMutation(internal.business.admin.saveBusinessBanking, {
      businessId,
      businessName: paystackBusinessName,
      settlementBank: paystackBank,
      settlementBankName: subAccount.settlementBankName,
      accountNumber: paystackAccountNumber,
      businessEmail: paystackEmail,
      phone: paystackPhone,
      subAccountCode: subAccount.subAccountCode,
      paystackId: subAccount.paystackId,
    });

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
    businessDays: v.array(businessDayValidator),
    latitude: v.float64(),
    longitude: v.float64(),
    tags: v.array(v.string()),
    subscriptionTierId: v.id("subscriptionTiers"),
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
      city,
      subscriptionTierId,
    },
  ) => {
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const fileMeta = await ctx.storage.getMetadata(coverImageStorageId);
    if (!fileMeta) throw new ConvexError("Cover image upload not found.");
    if (!fileMeta.contentType || !ALLOWED_IMAGE_TYPES.includes(fileMeta.contentType)) {
      await ctx.storage.delete(coverImageStorageId);
      throw new ConvexError("Cover image must be a JPEG, PNG, or WebP file.");
    }

    const businessSlug = slugify(name);

    if (businessDays.length === 0)
      throw new ConvexError("At least one business day is required.");

    for (const day of businessDays) {
      const isValidDay = BUSINESS_DAYS.some(
        (d) => d.shortName === day.shortName && d.fullName === day.fullName,
      );
      if (!isValidDay)
        throw new ConvexError(`Invalid business day: ${day.shortName}`);

      if (!TIME_REGEX.test(day.openTime) || !TIME_REGEX.test(day.closeTime))
        throw new ConvexError(
          `Invalid time format for ${day.fullName}. Expected HH:MM.`,
        );

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

    if (tags.length > 3)
      throw new ConvexError("You can only select a maximum of 3 tags.");

    const invalidTag = tags.find(
      (tag) => !ALLOWED_TAGS.includes(tag as typeof ALLOWED_TAGS[number]),
    );
    if (invalidTag)
      throw new ConvexError(`Invalid tag: "${invalidTag}"`);

    const formattedTags = tags.map((tag) => tag.toLowerCase());

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
      subscriptionTierId,
      timezone: "Africa/Johannesburg",
      visibility: "offline",
      platformStatus: "active",
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

export const saveBusinessBanking = internalMutation({
  args: {
    businessId: v.id("business"),
    businessName: v.string(),
    settlementBank: v.string(),
    settlementBankName: v.optional(v.string()),
    accountNumber: v.string(),
    businessEmail: v.string(),
    phone: v.string(),
    subAccountCode: v.optional(v.string()),
    paystackId: v.optional(v.number()),
  },
  handler: async (ctx, { businessId, businessName, settlementBank, settlementBankName, accountNumber, businessEmail, phone, subAccountCode, paystackId }) => {
    await ctx.db.insert("businessBanking", {
      businessId,
      businessName,
      settlementBank,
      settlementBankName,
      accountNumber,
      businessEmail,
      phone,
      isActive: true,
      subAccountCode,
      paystackId,
    });
  },
});

// Completed bookings only count toward verification if a real payment
// cleared for them — a "completed" booking with no completed payment isn't
// a trust signal. Shared by the settings-page progress bar and the
// verifyEligibleBusinesses cron so they can never disagree on the count.
export async function countVerifiableCompletedBookings(
  ctx: QueryCtx,
  businessId: Id<"business">,
) {
  const completedBookings = await ctx.db
    .query("booking")
    .withIndex("by_business_and_status", (q) =>
      q.eq("businessId", businessId).eq("status", "completed"),
    )
    .collect();

  let verifiableCount = 0;
  for (const booking of completedBookings) {
    if (!booking.bookingPaymentId) continue;
    const payment = await ctx.db.get(booking.bookingPaymentId);
    if (payment?.status === "completed") verifiableCount++;
  }
  return verifiableCount;
}

// Runs daily (see crons.ts). Verification is intentionally decoupled from
// the booking-completion paths (the sweep cron and the manual completeBooking
// mutation) so neither has to know verification exists, and any future
// completion path is covered automatically without needing to be wired in.
export const verifyEligibleBusinesses = internalMutation({
  handler: async (ctx) => {
    const verifiedRecords = await ctx.db.query("businessVerified").collect();
    const verifiedIds = new Set(verifiedRecords.map((v) => v.businessId));

    const allBusinesses = await ctx.db.query("business").collect();

    for (const business of allBusinesses) {
      if (verifiedIds.has(business._id)) continue;

      const verifiableCount = await countVerifiableCompletedBookings(ctx, business._id);
      if (verifiableCount >= VERIFICATION_THRESHOLD) {
        await ctx.db.insert("businessVerified", {
          businessId: business._id,
          verifiedDate: Date.now(),
        });
      }
    }
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

    const [settings, hours, completedBookingsCount, verification] = await Promise.all([
      ctx.db.query("businessSettings").withIndex("by_business", q => q.eq("businessId", business._id)).unique(),
      ctx.db.query("businessHours").withIndex("by_businessId", q => q.eq("businessId", business._id)).collect(),
      countVerifiableCompletedBookings(ctx, business._id),
      ctx.db.query("businessVerified").withIndex("by_business", q => q.eq("businessId", business._id)).unique(),
    ])

    return {
      ...business,
      settings,
      businessHours: hours,
      coverImageUrl,
      completedBookingsCount,
      verifiedDate: verification?.verifiedDate ?? null,
      verificationThreshold: VERIFICATION_THRESHOLD,
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

export const checkUserHasBusiness = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    const business = await getBusinessByUserId(ctx, user._id);
    return !!business;
  },
});

export const getFreeTier = internalQuery({
  args: {},
  returns: v.object({ commission: v.number(), _id: v.id("subscriptionTiers") }),
  handler: async (ctx) => {
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_tier", (q) => q.eq("tier", "free"))
      .unique();
    if (!tier) throw new ConvexError("Subscription tier configuration missing.");
    return { commission: tier.commission, _id: tier._id };
  },
});

export const getBusinessByUserId = (ctx: QueryCtx, userId: Id<"users">) => {
  return ctx.db
    .query("business")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .unique();
};

export const getDashboardAnalytics = query({
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
      ).filter((q) => q.or(q.eq(q.field("status"), "in_progress"), q.eq(q.field("status"), "upcoming"), q.eq(q.field("status"), "completed"), q.eq(q.field("status"), "no_show")))
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

    const revenueCents = payments.reduce(
      (sum, payment) => sum + (payment.merchantAmount ?? 0),
      0,
    )

    const revenueRands = revenueCents / 100

    // lifetime review stats, not scoped to this month
    const businessReviews = await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .collect();

    const averageReviews =
      businessReviews.length > 0
        ? businessReviews.reduce((sum, r) => sum + r.rating, 0) /
        businessReviews.length
        : 0;

    return {
      revenue: revenueRands,
      reviews: { averageReviews, count: businessReviews.length },
      totalBookings: totalBookings.length,
      uniqueClients: uniqueClientCount,


    }
  },

})

export const getUpcomingBookings = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, { limit }) => {
    const take = limit ?? 5
    const user = await getCurrentUser(ctx)

    if (!user) return []
    const now = Date.now();

    const business = await ctx.db.query("business").withIndex("by_owner", q => q.eq("ownerId", user._id)).unique()

    if (!business) return []

    const bookings = await ctx.db.query("booking").withIndex("by_business_and_status_and_date", q => q.eq("businessId", business._id).eq("status", "upcoming").gte("bookingStartDate", now)).order("asc").take(take)

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const client = await ctx.db.get(booking.userId);
        const service = await ctx.db.get(booking.serviceId);
        const payment = booking.bookingPaymentId ? await ctx.db.get(booking.bookingPaymentId) : null;

        return {
          ...booking,
          client: { name: client?.fullname, avatar: client?.image, email: client?.email },
          service: { _id: service?._id, name: service?.name, duration: service?.duration },
          payment: payment ? { amount: payment.amount, status: payment.status, type: payment.paymentType, balanceCollected: payment.balanceCollected ?? false } : null,
          business: { timezone: business.timezone }
        };
      })
    );

    return bookingsWithDetails
  }
})


// types
export type BookingWithDetails = Doc<"booking"> & {
  client: { name?: string; avatar?: string, email?: string };
  service: { _id?: Id<"service">; name?: string, duration?: number };
  payment: { amount: number; status: "pending" | "completed" | "failed" | "refunded" | "cancelled", type: "deposit" | "full-payment", balanceCollected: boolean } | null;
  business: { timezone: string }
};

export type UserBusinessResult = {
  settings: Doc<"businessSettings"> | null;
  businessHours: Doc<"businessHours">[]
  coverImageUrl: string | null;
} & Doc<"business"> | null

export const getAllBookings = query({
  handler: async (ctx): Promise<BookingWithDetails[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) return [];

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_business_and_date", (q) =>
        q.eq("businessId", business._id),
      )
      .order("desc")
      .collect();

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const client = await ctx.db.get(booking.userId);
        const service = await ctx.db.get(booking.serviceId);
        const payment = booking.bookingPaymentId
          ? await ctx.db.get(booking.bookingPaymentId)
          : null;

        return {
          ...booking,
          client: { name: client?.fullname, avatar: client?.image, email: client?.email },
          service: { _id: service?._id, name: service?.name, duration: service?.duration },
          payment: payment ? { amount: payment.amount, status: payment.status, type: payment.paymentType, balanceCollected: payment.balanceCollected ?? false } : null,
          business: { timezone: business.timezone },
        };
      }),
    );

    return bookingsWithDetails;
  },
});

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
          q.eq(q.field("status"), "no_show"),
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
        b.status === "completed" ||
        b.status === "no_show";
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
      if (agg) agg.revenue += (p.merchantAmount ?? 0) / 100;
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
