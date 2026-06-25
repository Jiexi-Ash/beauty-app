import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { paystackChargeEventValidator } from "./types";


export const handlePaystackEvent = internalMutation({
    args: { event: paystackChargeEventValidator },
    returns: v.null(),
    handler: async (ctx, { event }) => {
        switch (event.event) {
            case "charge.success": {
                if (event.data.status !== "success") {
                    console.error(
                        `Unexpected: charge.success event with data.status="${event.data.status}" for reference ${event.data.reference}. Skipping — investigate.`,
                    );
                    return null;
                }


                const payment = await ctx.db
                    .query("bookingPayment")
                    .withIndex("by_reference", (q) => q.eq("paymentReference", event.data.reference))
                    .unique();

                if (!payment) {
                    console.error("No bookingPayment found for reference:", event.data.reference);
                    return null;
                }

                if (event.data.status !== "success") {
                    console.error("Unexpected status on charge.success event:", event.data.status);
                    return null;
                }

                if (payment.amount !== event.data.amount) {
                    console.error(
                        `Amount mismatch for ${event.data.reference}: expected ${payment.amount}, got ${event.data.amount}`,
                    );
                    return null;
                }

                const booking = await ctx.db.get(payment.bookingId);
                // No retry once cancelled: if the booking is no longer pending (e.g.
                // cancelled after the retry window), don't revive it from the webhook.
                if (!booking || booking.status !== "pending") {
                    console.warn(
                        `Booking for ${event.data.reference} is not pending (status: ${booking?.status}); skipping completion.`,
                    );
                    return null;
                }

                await ctx.db.patch(payment._id, { status: "completed" });
                await ctx.db.patch(booking._id, { status: "upcoming" });
                break;
            }

            default:
                break;
        }
        return null;
    },
});