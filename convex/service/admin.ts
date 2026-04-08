import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserOrThrow } from "../users";
import { getBusinessByUserId } from "../business/admin";

export const createService = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        price: v.number(),
        categoryName: v.string(),
        duration: v.number(),
        primaryImageStorageId: v.id("_storage"),

    },
    handler: async (ctx, { categoryName, description, duration, name, price, primaryImageStorageId }) => {
        const user = await getCurrentUserOrThrow(ctx)

        const business = await getBusinessByUserId(ctx, user._id)

        if (!business) throw new ConvexError("You need to have a business to perform this action.")

        const [isExisting, category] = await Promise.all([
            ctx.db.query("service").withIndex("by_name_and_business", q => q.eq("name", name.toLowerCase().trim()).eq("businessId", business._id)).first(),
            ctx.db.query("categories").withIndex("by_name", q => q.eq("name", categoryName)).first()
        ])

        if (isExisting) throw new ConvexError(`A service with the name ${name} already exists.`)

        if (!category) throw new ConvexError("Invalid category selected")
        const priceInDecimal = Number(price) * 100 // cents
        const serviceId = await ctx.db.insert("service", {
            name: name.toLowerCase().trim(),
            businessId: business._id,
            primaryImageStorageId,
            price: priceInDecimal,
            totalBookings: 0,
            visibility: "hidden",
            description,
            categoryId: category._id,
            duration,
        })

        return serviceId
    }
})

export const getBusinessServices = query({
    handler: async (ctx) => {
        const user = await getCurrentUserOrThrow(ctx)

        const business = await getBusinessByUserId(ctx, user._id)

        if (!business) return []

        const services = await ctx.db.query("service").withIndex("by_business", q => q.eq("businessId", business._id)).collect()

        const servicesWithResources = await Promise.all(
            services.map(async (service) => {
                const image = await ctx.storage.getUrl(service.primaryImageStorageId)
                const category = await ctx.db.get(service.categoryId)

                return { ...service, image: image ?? null, category: category?.name ?? "Other" }
            })
        )

        return servicesWithResources
    }
})
