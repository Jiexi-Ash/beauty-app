import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUserOrThrow } from "../users";
import { getBusinessByUserId } from "../business/admin";

export const createService = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        price: v.number(),
        categoryId: v.id("categories"),
        duration: v.number(),
        primaryImageStorageId: v.id("_storage"),

    },
    handler: async (ctx, { categoryId, description, duration, name, price, primaryImageStorageId }) => {
        const user = await getCurrentUserOrThrow(ctx)

        const business = await getBusinessByUserId(ctx, user._id)

        if (!business) throw new ConvexError("You need to have a business to perform this action.")

        const [isExisting, category] = await Promise.all([
            ctx.db.query("service").withIndex("by_name_and_business", q => q.eq("name", name.toLowerCase().trim()).eq("businessId", business._id)).first(),
            ctx.db.get(categoryId)
        ])

        if (isExisting) throw new ConvexError(`A service with the name ${name} already exists.`)

        if (!category) throw new ConvexError("Invalid category selected")
        const priceInDecimal = price * 100 // cents
        const serviceId = await ctx.db.insert("service", {
            name: name.toLowerCase().trim(),
            businessId: business._id,
            primaryImageStorageId,
            price: priceInDecimal,
            description,
            categoryId,
            duration,
        })

        return serviceId
    }
})