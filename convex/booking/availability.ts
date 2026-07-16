import { ConvexError } from "convex/values";
import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ACTIVE_BOOKING_STATUSES } from "../../constants";

/**
 * Throws if the business already has `maxConcurrentBookings` active bookings
 * overlapping [newStartMs, newEndMs). `excludeBookingId` is omitted when
 * creating a brand-new booking, and set to the booking being rescheduled so
 * its own current slot doesn't count against itself. Shared by the client-
 * initiated and business-initiated reschedule mutations so the conflict
 * rule can't drift between them.
 */
export async function assertSlotAvailable(
  ctx: QueryCtx,
  args: {
    businessId: Id<"business">;
    excludeBookingId?: Id<"booking">;
    newStartMs: number;
    newEndMs: number;
  },
): Promise<void> {
  const settings = await ctx.db
    .query("businessSettings")
    .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
    .unique();

  const maxConcurrent = settings?.maxConcurrentBookings ?? 1;

  const overlapping = await ctx.db
    .query("booking")
    .withIndex("by_business_and_date", (q) =>
      q
        .eq("businessId", args.businessId)
        .gte("bookingStartDate", args.newStartMs - 24 * 60 * 60 * 1000)
        .lte("bookingStartDate", args.newEndMs),
    )
    .filter((q) =>
      q.and(
        ...(args.excludeBookingId
          ? [q.neq(q.field("_id"), args.excludeBookingId)]
          : []),
        q.or(
          ...ACTIVE_BOOKING_STATUSES.map((status) =>
            q.eq(q.field("status"), status),
          ),
        ),
        q.lt(q.field("bookingStartDate"), args.newEndMs),
        q.gt(q.field("bookingEndDate"), args.newStartMs),
      ),
    )
    .collect();

  if (overlapping.length >= maxConcurrent) {
    throw new ConvexError("This time slot is fully booked.");
  }
}
