import { v } from "convex/values";

export const feesSplitValidator = v.object({
    paystack: v.number(),
    integration: v.number(),
    subaccount: v.number(),
    params: v.optional(v.any()),
});

export const paystackChargeEventValidator = v.object({
    event: v.string(),
    data: v.object({
        reference: v.string(),
        status: v.string(), // "success" | "failed" etc.
        amount: v.number(),
        paid_at: v.union(v.string(), v.null()),
        channel: v.string(),
        currency: v.string(),
        metadata: v.optional(v.any()),
        fees_split: v.optional(feesSplitValidator),
    }),
});