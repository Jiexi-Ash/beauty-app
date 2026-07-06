import { ConvexError, v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getCurrentUser } from "../users";
import { getBusinessByUserId } from "../business/admin";

// Plain helper (not a Convex mutation) so callers already inside a mutation
// transaction can write a notification without a nested runMutation.
export async function createNotification(
  ctx: MutationCtx,
  args: {
    businessId: Id<"business">;
    type:
      | "booking_created"
      | "booking_auto_completed"
      | "booking_rescheduled"
      | "booking_cancelled"
      | "booking_no_show";
    message: string;
    bookingId?: Id<"booking">;
  },
) {
  await ctx.db.insert("notifications", {
    businessId: args.businessId,
    type: args.type,
    message: args.message,
    bookingId: args.bookingId,
    read: false,
  });
}

async function getOwnedBusinessOrThrow(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new ConvexError("You must be signed in.");

  const business = await getBusinessByUserId(ctx, user._id);
  if (!business) throw new ConvexError("No business found for this user.");

  return business;
}

export const getNotificationsForBusiness = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const business = await getBusinessByUserId(ctx, user._id);
    if (!business) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .order("desc")
      .take(30);
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const business = await getOwnedBusinessOrThrow(ctx);

    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.businessId !== business._id)
      throw new ConvexError("Notification not found.");

    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllNotificationsRead = mutation({
  handler: async (ctx) => {
    const business = await getOwnedBusinessOrThrow(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_business_and_read", (q) =>
        q.eq("businessId", business._id).eq("read", false),
      )
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { read: true })),
    );
  },
});
