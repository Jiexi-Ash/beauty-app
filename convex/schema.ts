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
        .index("by_email", ["email"])
})