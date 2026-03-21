import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        email: v.string(),
        fullname: v.string(),
        image: v.string(),
        phone: v.optional(v.string()),
      })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"]),

        business: defineTable({
          name: v.string(),
          slug: v.string(),
          location: v.string(),
          latitude: v.float64(),
          longitude: v.float64(),
          description: v.optional(v.string()),
          coverImageStorageId: v.id("_storage"),
          ownerId: v.id("users"),
          openingTime: v.number(),
          closingTime: v.number(),
          subscriptionTierId: v.id("subscriptionTiers"),
          likes: v.number(),
          timezone: v.literal("Africa/Johannesburg"),
          visibility: v.union(
            v.literal("hidden"),
            v.literal("visible"),
            v.literal("offline")
          ),
          LastVerified: v.number(),// This represents Date
          businessDays: v.array(
              v.union(
                  v.literal("monday"), v.literal("tuesday"), v.literal("wednesday"),
                  v.literal("thursday"), v.literal("friday"), v.literal("saturday"), v.literal("sunday")
              )
          ),
      }).index("by_owner", ["ownerId"])
      .searchIndex("search_index", {
        searchField: "name",
      }),

      businessVerified: defineTable({
        verifiedDate:v.number(),
        businessId: v.id("business")
      }).index("by_business", ["businessId"]),

      businessSettings: defineTable({
        allowBookingBeyondCloseTime: v.boolean(),
        bufferTimeMinutes: v.float64(),
        businessId: v.id("business"),
        enableBusinessBufferTime: v.boolean(),
      }).index("by_business", ["businessId"]),

      subscriptionTiers: defineTable({
        tier: v.union(v.literal("free")),
        price:v.number()
      }).index("by_tier", ["tier"])
})

