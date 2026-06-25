"use node"

import crypto from "crypto";
import { v } from "convex/values"
import { internalAction } from "../_generated/server"


export const verifySignature = internalAction({
    args: {
        rawBody: v.string(),
        signature: v.string()
    },
    returns: v.boolean(),
    handler: async (ctx, { rawBody, signature }) => {
        const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
            .update(rawBody).digest("hex")

        const hashBuffer = Buffer.from(hash, "hex");
        const signatureBuffer = Buffer.from(signature, "hex");


        if (hashBuffer.length !== signatureBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
    }
})

export const verifyPaystackTransaction = internalAction({
    args: { reference: v.string() },
    returns: v.object({
        status: v.string(), // "success" | "failed" | "abandoned"
        amount: v.optional(v.number()),
    }),
    handler: async (_ctx, { reference }) => {
        const response = await fetch(
            `${process.env.PAYSTACK_URL}/transaction/verify/${encodeURIComponent(reference)}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            },
        );

        const result = await response.json();

        if (!result.status) {
            console.error("Paystack verify failed:", result.message);
            return { status: "unknown" };
        }

        return {
            status: result.data.status, // Paystack's own status string
            amount: result.data.amount,
        };
    },
});