import { v } from "convex/values";
import { query } from "../_generated/server";

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
