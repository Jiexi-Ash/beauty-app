"use node"

import crypto from "crypto";
import { v } from "convex/values"
import { action, internalAction } from "../_generated/server"
import { ConvexError } from "convex/values"


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

export const getBankList = action({
    args: {},
    returns: v.array(v.object({
        id: v.number(),
        name: v.string(),
        code: v.string(),
    })),
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthenticated");

        const url = new URL(`${process.env.PAYSTACK_URL}/bank`);
        url.searchParams.set("perPage", "100");
        url.searchParams.set("country", "south africa");
        url.searchParams.set("enabled_for_verification", "true");

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const result = await response.json();

        if (!result.status || !Array.isArray(result.data)) {
            console.error("[getBankList] failed:", result.message);
            return [];
        }

        return result.data.map((bank: { id: number; name: string; code: string }) => ({
            id: bank.id,
            name: bank.name,
            code: bank.code,
        }));
    },
});

export const createSubAccount = internalAction({
    args: {
        businessName: v.string(),
        settlementBank: v.string(),
        accountNumber: v.string(),
        percentageCharge: v.number(),
        primaryContactEmail: v.optional(v.string()),
        primaryContactPhone: v.optional(v.string()),
    },
    returns: v.object({
        subAccountCode: v.string(),
        paystackId: v.number(),
        settlementBankName: v.string(),
    }),
    handler: async (_ctx, { businessName, settlementBank, accountNumber, percentageCharge, primaryContactEmail, primaryContactPhone }) => {
        const response = await fetch(`${process.env.PAYSTACK_URL}/subaccount`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                business_name: businessName,
                settlement_bank: settlementBank,
                account_number: accountNumber,
                percentage_charge: percentageCharge,
                ...(primaryContactEmail && { primary_contact_email: primaryContactEmail }),
                ...(primaryContactPhone && { primary_contact_phone: primaryContactPhone }),
            }),
        });

        const result = await response.json();

        if (!result.status) {
            throw new ConvexError(
                result.message ?? "Failed to create payment account. Please check your banking details and try again."
            );
        }

        return {
            subAccountCode: result.data.subaccount_code as string,
            paystackId: result.data.id as number,
            settlementBankName: result.data.settlement_bank as string,
        };
    },
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