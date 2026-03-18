import {  query, QueryCtx } from "../_generated/server";
import { getCurrentUser } from "../users";
import { Id } from "../_generated/dataModel";



export const getUserBusiness = query({
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx)

        if (!user) return null

        const business = await getBusinessByUserId(ctx, user._id)

        return business
    }
})

export const verifyUserBusiness =  query({
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx)

        if (!user) return false

        const business = await getBusinessByUserId(ctx,user._id)

        return !!business
    }
})


export const getBusinessByUserId = (ctx:QueryCtx, userId:Id<"users">) => {
        return ctx.db.query("business").withIndex("by_owner", q => q.eq("ownerId", userId)).unique()
    }
