import { internalMutation, query, QueryCtx } from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { ConvexError, v, Validator } from "convex/values";






export const upsertFromClerk = internalMutation({
    args: {
        data:v.any() as Validator<UserJSON>
    },
    handler: async (ctx, {data}) => {
        const userData = {
            fullname: `${data.first_name} ${data.last_name}`,
            clerkId:data.id,
            email:data.email_addresses[0].email_address,
            image:data.image_url,
            phone: (data.phone_numbers && data.phone_numbers.length > 0 && data.phone_numbers[0]?.phone_number) || undefined
        }
      

        const user = await getUserByClerkId(ctx, userData.clerkId)

        if (!user || user === null) {
            await ctx.db.insert("users", userData)
            
        } else {

            await ctx.db.patch(user._id, userData)
        }

    }
})

const getUserByClerkId = async (ctx:QueryCtx, clerkId:string) => {
    return await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", clerkId)).unique()
}

export const getCurrentUserOrThrow = async (ctx:QueryCtx) => {
    const user =  await getCurrentUser(ctx)

    if (!user) throw new ConvexError("User not found")

    return user
}

export const getCurrentUser = async (ctx:QueryCtx) => {
    const identity = await ctx.auth.getUserIdentity()

    if (identity === null) {
        return null
    }

    return await getUserByClerkId(ctx, identity.subject)
}