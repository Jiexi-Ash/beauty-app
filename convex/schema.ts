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
    city: v.string(),
    latitude: v.float64(),
    longitude: v.float64(),
    description: v.optional(v.string()),
    coverImageStorageId: v.id("_storage"),
    ownerId: v.id("users"),
    subscriptionTierId: v.id("subscriptionTiers"),
    timezone: v.literal("Africa/Johannesburg"),
    merchantId: v.number(),
    visibility: v.union(
      v.literal("hidden"),
      v.literal("visible"),
      v.literal("offline"),
    ),
    LastVerified: v.optional(v.number()),
    tags: v.array(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_visibility", ["visibility"])
    .index("by_slug_visibility", ["slug", "visibility"])
    .index("by_slug", ["slug"])
    .searchIndex("search_index", {
      searchField: "name",
    }),

  businessVerified: defineTable({
    verifiedDate: v.number(),
    businessId: v.id("business"),
  }).index("by_business", ["businessId"]),

  businessSettings: defineTable({
    allowBookingBeyondCloseTime: v.boolean(),
    bufferTimeMinutes: v.float64(),
    businessId: v.id("business"),
    enableBusinessBufferTime: v.boolean(),
    maxConcurrentBookings: v.number(),
  }).index("by_business", ["businessId"]),

  businessHours: defineTable({
    businessId: v.id("business"),
    fullName: v.string(),
    shortName: v.string(),
    openTime: v.string(),
    closeTime: v.string(),
  }).index("by_businessId", ["businessId"]),

  subscriptionTiers: defineTable({
    tier: v.union(v.literal("free")),
    price: v.number(),
  }).index("by_tier", ["tier"]),

  service: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    businessId: v.id("business"),
    duration: v.number(),
    primaryImageStorageId: v.id("_storage"),
    totalBookings: v.number(),
    visibility: v.union(v.literal("hidden"), v.literal("visible")),
    updatedAt: v.optional(v.number()),
  })
    .index("by_name_and_business", ["name", "businessId"])
    .index("by_business_and_slug", ["businessId","slug"])
    .index("by_business_visibility", ["businessId", "visibility"])
    .index("by_name_business_visiblity", ["name", "businessId", "visibility"])
    .index("by_business", ["businessId"])
    .index("by_business_and_category", ["businessId", "categoryId"]),

  serviceImages: defineTable({
    serviceId: v.id("service"),
    imageStorageId: v.id("_storage"),
  }).index("by_service", ["serviceId"]),

  categories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  booking: defineTable({
    businessId: v.id("business"),
    serviceId: v.id("service"),
    userId: v.id("users"),
    bookingStartDate: v.number(), // time and date
    bookingEndDate: v.number(), // time and date
    notes: v.optional(v.string()),
    bookingPaymentId: v.optional(v.id("bookingPayment")),
    status: v.union(
      v.literal("pending"),
      v.literal("failed"),
      v.literal("confirmed"),
    ),
  })
    .index("by_business", ["businessId"])
    .index("by_business_service", ["businessId", "serviceId"])
    .index("by_service_status", ["serviceId", "status"])
    .index("by_service_status_date", [
      "serviceId",
      "status",
      "bookingStartDate",
    ])
    .index("by_status", ["status"])
    .index("by_business_and_date", ["businessId", "bookingStartDate"])
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "bookingStartDate"]),

  bookingPayment: defineTable({
    bookingId: v.id("booking"),
    paymentType: v.union(v.literal("deposit"), v.literal("full-payment")),
    amount: v.number(),
    paymentDate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    paymentReference: v.optional(v.string()),
  })
    .index("by_booking", ["bookingId"])
    .index("by_booking_and_date", ["bookingId", "paymentDate"]),
});

export const businessDayValidator = v.object({
  fullName: v.string(),
  shortName: v.string(),
  openTime: v.string(),
  closeTime: v.string(),
});
