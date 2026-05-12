import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { ConvexError, v, Validator } from "convex/values";

export const upsertFromClerk = internalMutation({
  args: {
    data: v.any() as Validator<UserJSON>,
  },
  handler: async (ctx, { data }) => {
    const userData = {
      fullname: `${data.first_name} ${data.last_name}`,
      clerkId: data.id,
      email: data.email_addresses[0].email_address,
      image: data.image_url,
      phone:
        (data.phone_numbers &&
          data.phone_numbers.length > 0 &&
          data.phone_numbers[0]?.phone_number) ||
        undefined,
    };

    const user = await getUserByClerkId(ctx, userData.clerkId);

    if (!user || user === null) {
      await ctx.db.insert("users", userData);
    } else {
      await ctx.db.patch(user._id, userData);
    }
  },
});

const getUserByClerkId = async (ctx: QueryCtx, clerkId: string) => {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .unique();
};

export const getCurrentUserOrThrow = async (ctx: QueryCtx) => {
  const user = await getCurrentUser(ctx);

  if (!user) throw new ConvexError("User not found");

  return user;
};

export const getCurrentUser = async (ctx: QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (identity === null) {
    return null;
  }

  return await getUserByClerkId(ctx, identity.subject);
};

export const getUserProfileDetails = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) return null;

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      user: user,
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b) => b.status === "completed")
        .length,
      upcomingBookings: bookings.filter((b) => b.status === "upcoming").length,
      cancelledBookings: bookings.filter(
        (b) => b.status === "cancelled_by_user",
      ).length,
    };
  },
});

export const updateUserPhoneNumber = mutation({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user)
      throw new ConvexError("You need to be logged in to perform this action.");

    await ctx.db.patch(user._id, {
      phone: args.phoneNumber,
    });
  },
});
