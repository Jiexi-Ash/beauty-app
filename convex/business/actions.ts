"use node"
import { PlacesClient } from "@googlemaps/places";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const placesClient = new PlacesClient({
    apiKey:process.env.GOOGLE_MAPS_API_KEY,
})

export const searchAddress = internalAction({
    args: {
        input:v.string()
    },
    handler: async (_, {input}) => {
        if (input.length < 3) return []

        const [{suggestions}] = await placesClient.autocompletePlaces({
            input,
            includedRegionCodes: ["ZA"],
            includeQueryPredictions:false,
            
        })

        const results = await Promise.all((suggestions ?? []).map(async (suggestion) => {
            const placeId = suggestion.placePrediction?.placeId
            const text = suggestion.placePrediction?.text

            if (!placeId) return null

            return {
                placeId,
                description:text
            }
        }))

       return results

        
    }
})