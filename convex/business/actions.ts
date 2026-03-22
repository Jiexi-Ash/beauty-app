"use node"
import { PlacesClient } from "@googlemaps/places";
import { Client } from "@googlemaps/google-maps-services-js";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const placesClient = new PlacesClient({
    apiKey:process.env.GOOGLE_MAPS_API_KEY,
})

const client = new Client({})

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
            const text = suggestion.placePrediction?.text?.text

            if (!placeId) return null

            return {
                placeId,
                description:text
            }
        }))

       return results

        
    }
})

export const getBusinessCoordinates = internalAction({
    args: {
        placesId:v.string()
    },
    handler: async (_, {placesId}) => {
        const result = await client.geocode({
            params: {
                place_id:placesId,
                key:process.env.GOOGLE_MAPS_API_KEY!
            },
        })

        if (result.data.results.length < 1) return null

        const {lat, lng} = result.data.results[0].geometry.location

        return { latitude: lat, longitude: lng }
    }
})