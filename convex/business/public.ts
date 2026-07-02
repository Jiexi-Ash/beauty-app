import { v } from "convex/values";
import { query, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { startOfDay, endOfDay, format, isSameDay } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { filter } from "convex-helpers/server/filter";
import { getCurrentUser } from "../users";

async function getBusinessRatingSummary(
  ctx: QueryCtx,
  businessId: Id<"business">,
) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_business", (q) => q.eq("businessId", businessId))
    .collect();

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return { averageRating, reviewCount: reviews.length };
}

export const getBusinesses = query({
  args: {
    limit: v.optional(v.number()),
    sortByRating: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;
    // When ranking by rating, pull a wider pool first so the top N by rating
    // isn't just the first N businesses in arbitrary storage order.
    const fetchLimit = args.sortByRating ? 50 : limit;
    const businesses = await ctx.db
      .query("business")
      .withIndex("by_visibility", (q) => q.eq("visibility", "visible"))
      .take(fetchLimit);

    const withRatings = await Promise.all(
      businesses.map(async (business) => {
        const { averageRating, reviewCount } = await getBusinessRatingSummary(
          ctx,
          business._id,
        );
        return {
          _id: business._id,
          name: business.name,
          location: business.location,
          city: business.city,
          tags: business.tags,
          slug: business.slug,
          coverImageUrl:
            (await ctx.storage.getUrl(business.coverImageStorageId)) ?? null,
          averageRating,
          reviewCount,
        };
      }),
    );

    if (!args.sortByRating) return withRatings;

    return withRatings
      .sort(
        (a, b) =>
          b.averageRating - a.averageRating || b.reviewCount - a.reviewCount,
      )
      .slice(0, limit);
  },
});

export const getBusinessBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, { slug }) => {
    const user = await getCurrentUser(ctx)
    const business = await ctx.db
      .query("business")
      .withIndex("by_slug_visibility", (q) =>
        q.eq("slug", slug).eq("visibility", "visible"),
      )
      .unique();

    if (!business) return null;

    const businessCoverImage = await ctx.storage.getUrl(
      business.coverImageStorageId,
    );

    const businessServices = await ctx.db
      .query("service")
      .withIndex("by_business_visibility", (q) =>
        q.eq("businessId", business._id).eq("visibility", "visible"),
      )
      .collect();

    const services = await Promise.all(
      businessServices.map(async (service) => {
        const primaryImage = await ctx.storage.getUrl(
          service.primaryImageStorageId,
        );
        const imageGallery = await ctx.db
          .query("serviceImages")
          .withIndex("by_service", (q) => q.eq("serviceId", service._id))
          .collect();

        const galleryWithUrls = await Promise.all(
          imageGallery.map(async (img) => ({
            _id: img._id,
            url: await ctx.storage.getUrl(img.imageStorageId),
          })),
        );
        return { ...service, primaryImage, imageGallery: galleryWithUrls };
      }),
    );

    const isFavorite = user ? await ctx.db.query("favorites").withIndex("by_user_and_business", q => q.eq("userId", user._id).eq("businessId", business._id)).unique() : null

    const businessReviews = await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .order("desc")
      .take(50);

    const reviews = await Promise.all(
      businessReviews.map(async (review) => {
        const reviewer = await ctx.db.get(review.userId);
        return {
          _id: review._id,
          _creationTime: review._creationTime,
          rating: review.rating,
          comment: review.comment,
          reviewerName: reviewer?.fullname ?? "Anonymous",
          reviewerImage: reviewer?.image ?? null,
        };
      }),
    );

    const averageRating =
      businessReviews.length > 0
        ? businessReviews.reduce((sum, r) => sum + r.rating, 0) /
          businessReviews.length
        : 0;

    return {
      ...business,
      businessCoverImage,
      services,
      isFavorite: !!isFavorite,
      reviews,
      averageRating,
      reviewCount: businessReviews.length,
    };
  },
});

export const searchBusinessByQuery = query({
  args: {
    query: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, { query, city }) => {
    const searchTerm = [query, city].filter(Boolean).join(" ").trim();

    if (searchTerm.length >= 2) {
      const businesses = await ctx.db
        .query("business")
        .withSearchIndex("search_all", (q) =>
          q.search("searchText", searchTerm).eq("visibility", "visible"),
        )
        .take(20);

      return Promise.all(
        businesses.map(async (business) => {
          const { averageRating, reviewCount } = await getBusinessRatingSummary(
            ctx,
            business._id,
          );
          return {
            ...business,
            coverImageUrl: business.coverImageStorageId
              ? await ctx.storage.getUrl(business.coverImageStorageId)
              : null,
            averageRating,
            reviewCount,
          };
        }),
      );
    }

    return [];
  },
});
export const getBusinessServiceById = query({
  args: {
    businessSlug: v.string(),
    serviceId: v.id("service"),
  },
  handler: async (ctx, { serviceId, businessSlug }) => {
    const business = await ctx.db
      .query("business")
      .withIndex("by_slug", (q) => q.eq("slug", businessSlug))
      .first();

    if (!business) return null;
    const service = await ctx.db.get(serviceId);

    if (!service) return null;
    if (service.businessId !== business._id) return null;

    const [primaryImage, serviceGalleryImages] = await Promise.all([
      ctx.storage.getUrl(service.primaryImageStorageId),
      ctx.db
        .query("serviceImages")
        .withIndex("by_service", (q) => q.eq("serviceId", service._id))
        .collect(),
    ]);

    const imageGallery = await Promise.all(
      serviceGalleryImages.map(async (image) => ({
        _id: image._id,
        url: await ctx.storage.getUrl(image.imageStorageId),
      })),
    );

    return {
      ...service,
      business: { name: business.name },
      primaryImage,
      imageGallery,
    };
  },
});

export const getBusinessServiceBySlug = query({
  args: {
    businessSlug: v.string(),
    serviceSlug: v.string(),
  },
  handler: async (ctx, { serviceSlug, businessSlug }) => {
    const business = await ctx.db
      .query("business")
      .withIndex("by_slug", (q) => q.eq("slug", businessSlug))
      .first();

    if (!business) return null;
    const service = await ctx.db
      .query("service")
      .withIndex("by_business_and_slug", (q) =>
        q.eq("businessId", business._id).eq("slug", serviceSlug),
      )
      .first();

    if (!service) return null;

    const [primaryImage, serviceGalleryImages] = await Promise.all([
      ctx.storage.getUrl(service.primaryImageStorageId),
      ctx.db
        .query("serviceImages")
        .withIndex("by_service", (q) => q.eq("serviceId", service._id))
        .collect(),
    ]);

    const imageGallery = await Promise.all(
      serviceGalleryImages.map(async (image) => ({
        _id: image._id,
        url: await ctx.storage.getUrl(image.imageStorageId),
      })),
    );

    return {
      ...service,
      business: { name: business.name },
      primaryImage,
      imageGallery,
    };
  },
});

export const getBlockedSlots = query({
  args: {
    businessSlug: v.string(),
    serviceId: v.id("service"),
    date: v.number(),
  },
  handler: async (ctx, { serviceId, businessSlug, date }) => {
    const business = await ctx.db
      .query("business")
      .withIndex("by_slug", (q) => q.eq("slug", businessSlug))
      .first();

    if (!business) return null;
    const service = await ctx.db.get(serviceId);
    if (!service || service.businessId !== business._id) return null;

    const tz = business.timezone;
    const tzDate = new TZDate(date, tz);
    const dayStart = startOfDay(tzDate).getTime();
    const dayEnd = endOfDay(tzDate).getTime();
    const dayName = format(tzDate, "EEEE");

    const [businessHours, businessSettings, serviceBookings] =
      await Promise.all([
        ctx.db
          .query("businessHours")
          .withIndex("by_businessId", (q) => q.eq("businessId", business._id))
          .collect()
          .then((hours) => hours.find((h) => h.fullName === dayName)),
        ctx.db
          .query("businessSettings")
          .withIndex("by_business", (q) => q.eq("businessId", business._id))
          .first(),
        ctx.db
          .query("booking")
          .withIndex("by_service_status_date", (q) =>
            q
              .eq("serviceId", service._id)
              .eq("status", "upcoming")
              .gte("bookingStartDate", dayStart)
              .lte("bookingStartDate", dayEnd),
          )
          .collect(),
      ]);

    return {
      businessHours: businessHours ?? null,
      maxConcurrent: businessSettings?.maxConcurrentBookings ?? 1,
      allowBeyondClose: businessSettings?.allowBookingBeyondCloseTime ?? false,
      bufferMinutes: businessSettings?.enableBusinessBufferTime
        ? businessSettings.bufferTimeMinutes
        : 0,
      bookedSlots: serviceBookings.map((b) => ({
        start: b.bookingStartDate,
        end: b.bookingEndDate,
      })),
    };
  },
});
