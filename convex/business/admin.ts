import {  action, internalMutation, mutation, query, QueryCtx } from "../_generated/server";
import { GeospatialIndex } from "@convex-dev/geospatial";
import { components, internal } from "../_generated/api";
import { getCurrentUser, getCurrentUserOrThrow } from "../users";
import { Id } from "../_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { businessDayValidator } from "../schema";
import { BUSINESS_DAYS } from "../../constants";
import {PlacesClient} from "@googlemaps/places"


const geospatial = new GeospatialIndex(components.geospatial)


export const createBusiness = action({
    args:{
        name:v.string(),
        description:v.string(),
        address:v.string(),
        coverImageStorageId:v.id("_storage"),
        merchantId:v.int64(),
        businessDays:v.array(businessDayValidator),
        placesId:v.string()
    },
    handler: async (ctx, { name,address,coverImageStorageId,description, placesId, businessDays, merchantId }) => {
        const identity = await ctx.auth.getUserIdentity()

        if (identity === null) {
            throw new ConvexError("User is unauthenticated")
        }

        const coordinates = await ctx.runAction(internal.business.actions.getBusinessCoordinates, {
            placesId:placesId
        })

        if (!coordinates) throw new ConvexError("Could not get coordinates");

       const businessId:Id<"business"> =  await ctx.runMutation(internal.business.admin.saveBusiness, {
            address,
            businessDays,
            coverImageStorageId,
            description,
            latitude:coordinates.latitude,
            longitude:coordinates.longitude,
            merchantId,
            name,
        });

        return businessId
        
        
    }
})

export const saveBusiness = internalMutation({
    args:{
        name:v.string(),
        description:v.string(),
        address:v.string(),
        coverImageStorageId:v.id("_storage"),
        merchantId:v.int64(),
        businessDays:v.array(businessDayValidator),
        latitude:v.number(),
        longitude:v.number(),
    },
    handler: async (ctx, {name,address,coverImageStorageId,description, latitude, longitude, businessDays, merchantId }) => {

        const businessSlug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")

            for (const day of businessDays) {
                const isValidDay = BUSINESS_DAYS.some(
                    d => d.shortName === day.shortName && d.fullName === day.fullName
                )
                if (!isValidDay) throw new ConvexError(`Invalid business day: ${day.shortName}`)
                

                if (day.openTime >= day.closeTime) {
                    throw new ConvexError(`Opening time must be before closing time for ${day.fullName}`)
                }
            }

        const user = await getCurrentUserOrThrow(ctx)
        const userBusiness = await getBusinessByUserId(ctx,user._id)

        if (userBusiness) throw new ConvexError("User already has a business.")

        const businessBySlug = await ctx.db.query("business").withIndex("by_slug", q => q.eq("slug",businessSlug)).first()

        if (businessBySlug) throw new ConvexError("A business with that name already exists.")
        
        const subscription = await ctx.db.query("subscriptionTiers").withIndex("by_tier", q=> q.eq("tier", "free")).unique()

        if (!subscription) throw new ConvexError("Error pulling the subscription tiers, please try again later.")

        const businessId = await ctx.db.insert("business", {
            ownerId:user._id,
            name,
            description,
            location:address,
            coverImageStorageId,
            latitude,
            longitude,
            slug:businessSlug,
            merchantId,
            subscriptionTierId: subscription._id,
            timezone: "Africa/Johannesburg",
            visibility: "hidden",
        })

        await geospatial.insert(
            ctx,
            businessId,
            {
                latitude:latitude,
                longitude:longitude
            },
            {slug:businessSlug}
        )

        await ctx.db.insert("businessSettings", {
            businessId,
            allowBookingBeyondCloseTime:false,
            bufferTimeMinutes: 0,
            enableBusinessBufferTime:false
        })

        await Promise.all(
            businessDays.map(day => ctx.db.insert("businessHours", {
                businessId,
                closeTime: day.closeTime,
                fullName: day.fullName,
                openTime: day.openTime,
                shortName: day.shortName,
            }))
        )

        return businessId
        
        
    }
})
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


 