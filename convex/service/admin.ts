import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUser, getCurrentUserOrThrow } from "../users";
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

export const updateService = mutation({
    args: {
        serviceId: v.id("service"),
        name: v.string(),
        description: v.string(),
        price: v.number(),
        categoryName: v.string(),
        duration: v.number(),
        primaryImageStorageId: v.optional(v.id("_storage")),
        galleryImageIds: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, { serviceId, categoryName, description, duration, name, price, primaryImageStorageId, galleryImageIds }) => {
        const user = await getCurrentUserOrThrow(ctx)

        const business = await getBusinessByUserId(ctx, user._id)

        if (!business) throw new ConvexError("You need to have a business to perform this action.")

        const [service, category] = await Promise.all([
            ctx.db.get(serviceId),
            ctx.db.query("categories").withIndex("by_name", q => q.eq("name", categoryName)).first()
        ])

        if (!service) throw new ConvexError("Service not found.")
        if (service.businessId !== business._id) throw new ConvexError("You do not have permission to update this service.")
        if (!category) throw new ConvexError("Invalid category selected.")

        if (primaryImageStorageId && service.primaryImageStorageId !== primaryImageStorageId) {
            await ctx.storage.delete(service.primaryImageStorageId)
        }

        await ctx.db.patch(serviceId, {
            name: name.toLowerCase().trim(),
            price: Number(price) * 100,
            description,
            categoryId: category._id,
            duration,
            updatedAt: Date.now(),
            ...(primaryImageStorageId && { primaryImageStorageId }),
        })

        if (galleryImageIds && galleryImageIds.length > 0) {
            const existingGallery = await ctx.db
                .query("serviceImages")
                .withIndex("by_service", q => q.eq("serviceId", serviceId))
                .collect()

            const existingIds = new Set(existingGallery.map((img) => img.imageStorageId))
            const incomingIds = new Set(galleryImageIds)

            const toDelete = existingGallery.filter((img) => !incomingIds.has(img.imageStorageId))
            const toInsert = galleryImageIds.filter((id) => !existingIds.has(id))

            await Promise.all([
                ...toDelete.map((img) => ctx.db.delete(img._id)),
                ...toDelete.map((img) => ctx.storage.delete(img.imageStorageId)),
                ...toInsert.map((imageStorageId) =>
                    ctx.db.insert("serviceImages", { serviceId, imageStorageId })
                ),
            ])
        }

        return serviceId
    }
})

export const deleteService = mutation({
    args: {
        serviceId: v.id("service")
    },
    handler: async (ctx, { serviceId }) => {
        const user = await getCurrentUserOrThrow(ctx)

        const business = await ctx.db.query("business").withIndex("by_owner", q => q.eq("ownerId", user._id)).unique()

        if (!business) throw new ConvexError("Business not found.")

        const service = await ctx.db.get(serviceId)

        if (!service) throw new ConvexError("Service not found with the provided ID.")

        if (service.businessId !== business._id) {
            throw new ConvexError("You do not have permission to update this service.")
        }

        await Promise.all([
            ctx.storage.delete(service.primaryImageStorageId),
            ctx.db.delete(serviceId),
        ])
    }
})

export const toggleVisibility = mutation({
    args: {
        serviceId: v.id("service"),
        visibility: v.union(v.literal("hidden"), v.literal("visible")),
    },
    handler: async (ctx, { serviceId, visibility }) => {
        const user = await getCurrentUserOrThrow(ctx)

        const business = await ctx.db.query("business").withIndex("by_owner", q => q.eq("ownerId", user._id)).unique()

        if (!business) throw new ConvexError("Business not found. Please create a business before deleting services.");

        const service = await ctx.db.get(serviceId)

        if (!service) throw new ConvexError("Service not found with the provided ID.")

        if (service.businessId !== business._id) {
            throw new ConvexError("You do not have permission to delete this service.")
        }

        await ctx.db.patch(serviceId, { visibility })
    }
})

export const getBusinessServices = query({
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx)

        if (!user) return []

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

export const getServiceById = query({
    args: {
        id: v.id("service")
    },
    handler: async (ctx, { id }) => {
        const user = await getCurrentUser(ctx)

        if (!user) return null

        const business = await getBusinessByUserId(ctx, user._id)

        if (!business) return null

        const service = await ctx.db.get(id)


        if (!service) return null

        if (service.businessId !== business._id) return null

        const serviceWithPrimaryImage = await ctx.storage.getUrl(service.primaryImageStorageId)
        const serviceImages = await ctx.db.query("serviceImages").withIndex("by_service", q => q.eq("serviceId", service._id)).collect()

        const galleryImagesWithIds = await Promise.all(
            serviceImages.map(async (image) => ({
                storageId: image.imageStorageId,
                url: await ctx.storage.getUrl(image.imageStorageId)
            }))
        )

        return {
            ...service,
            image: serviceWithPrimaryImage,
            galleryImages: galleryImagesWithIds.filter((img) => img.url !== null)
        }
    }
})
