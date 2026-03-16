import { internalMutation, query, QueryCtx } from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";






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