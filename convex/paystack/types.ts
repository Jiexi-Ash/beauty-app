import { v } from "convex/values";

export const paystackChargeEventValidator = v.object({
    event: v.string(),
    data: v.object({
        reference: v.string(),
        status: v.string(), // "success" | "failed" etc.
        amount: v.number(),
        paid_at: v.union(v.string(), v.null()),
        channel: v.string(),
        currency: v.string(),
        metadata: v.optional(v.any())
    }),
});