import { v } from "convex/values";
import { query } from "../_generated/server";
import { startOfDay, endOfDay, format, isSameDay } from "date-fns";
import { TZDate } from "@date-fns/tz";

export const getBusinesses = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;
    const businesses = await ctx.db
      .query("business")
      .withIndex("by_visibility", (q) => q.eq("visibility", "visible"))
      .take(limit);

    return Promise.all(
      businesses.map(async (business) => ({
        id: business._id,
        name: business.name,
        location: business.location,
        city: business.city,
        tags: business.tags,
        slug: business.slug,
        coverImage:
          (await ctx.storage.getUrl(business.coverImageStorageId)) ?? null,
      })),
    );
  },
});

export const getBusinessBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, { slug }) => {
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

    return { ...business, businessCoverImage, services };
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
