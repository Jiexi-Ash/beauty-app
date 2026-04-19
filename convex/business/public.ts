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
        coverImage:
          (await ctx.storage.getUrl(business.coverImageStorageId)) ?? null,
      })),
    );
  },
});
