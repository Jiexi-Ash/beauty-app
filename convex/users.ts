import {
  internalMutation,
  internalQuery,
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

export const addAppointmentReview = mutation({
  args: {
    bookingId: v.id("booking"),
    rating: v.number(),
    comment: v.optional(v.string())
  },
  handler: async (ctx, { bookingId, rating, comment }) => {
    const user = await getCurrentUserOrThrow(ctx)


    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ConvexError("Rating must be a whole number between 1 and 5.");

    if (comment && comment.length > 300) throw new ConvexError("Only a maximum of 300 characters allow on a review")


    const booking = await ctx.db.get(bookingId)

    if (!booking) throw new ConvexError("Review could not be created. Appointment not found.")

    if (booking.userId !== user._id) throw new ConvexError("You can only review your own appointments.");


    if (booking.status !== "completed") throw new ConvexError("You can only add a review to a completed appointment.")

    const existingReview = await ctx.db.query("reviews").withIndex("by_booking", q => q.eq("bookingId", bookingId)).unique()

    if (existingReview) throw new ConvexError("Only one review per booking can be created.")


    await ctx.db.insert("reviews", {
      businessId: booking.businessId,
      serviceId: booking.serviceId,
      userId: user._id,
      bookingId,
      rating,
      comment

    })
  }
})

export const toggleFavorites = mutation({
  args: {
    businessId: v.id("business"),
  },
  handler: async (ctx, { businessId }) => {
    const user = await getCurrentUserOrThrow(ctx);

    const business = await ctx.db.get(businessId);

    if (!business) throw new ConvexError("Business not found.");

    const exists = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_business", (q) =>
        q.eq("userId", user._id).eq("businessId", business._id),
      )
      .unique();

    if (exists) {
      await ctx.db.delete(exists._id);
      return;
    }

    await ctx.db.insert("favorites", {
      userId: user._id,
      businessId: business._id,
    });
  },
});

export const queryUserById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
});

export const queryUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

