import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { paystackChargeEventValidator } from "./types";
import { createNotification } from "../notifications/admin";
import { internal } from "../_generated/api";
import { computeSplitFallback } from "./split";


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

                if (payment.amount !== event.data.amount) {
                    console.error(
                        `Amount mismatch for ${event.data.reference}: expected ${payment.amount}, got ${event.data.amount}`,
                    );
                    return null;
                }

                const booking = await ctx.db.get(payment.bookingId);
                if (!booking || booking.status !== "pending") {
                    console.warn(
                        `Booking for ${event.data.reference} is not pending (status: ${booking?.status}); skipping completion.`,
                    );
                    return null;
                }

                // Use Paystack's actual split breakdown (fees_split) when present.
                // Falls back to a capped commission estimate if fees_split is
                // absent (e.g. subaccount not used) — see computeSplitFallback.
                // fees_split.integration = platform net after Paystack deducts its fee
                // fees_split.subaccount  = merchant net
                // fees_split.paystack    = Paystack processing fee
                const { paystackFee, platformAmount, merchantAmount, amountNet } =
                    computeSplitFallback(payment.amount, payment.commission, event.data.fees_split);

                await ctx.db.patch(payment._id, { status: "completed", merchantAmount, paymentDate: Date.now() });
                await ctx.db.patch(booking._id, { status: "upcoming" });

                await ctx.db.insert("paymentSplits", {
                    bookingPaymentId: payment._id,
                    amountGross: payment.amount,
                    amountFee: paystackFee,
                    amountNet,
                    platformAmount,
                    merchantAmount,
                    commission: payment.commission,
                });

                const [service, customer] = await Promise.all([
                    ctx.db.get(booking.serviceId),
                    ctx.db.get(booking.userId),
                ]);

                await createNotification(ctx, {
                    businessId: booking.businessId,
                    type: "booking_created",
                    message: `New booking: ${service?.name ?? "a service"} with ${customer?.fullname ?? "a customer"}.`,
                    bookingId: booking._id,
                });

                await ctx.scheduler.runAfter(
                    0,
                    internal.notifications.messages.SendWhatsAppBookingConfirmedMessage,
                    { bookingId: booking._id },
                );
                break;
            }

            default:
                break;
        }
        return null;
    },
});