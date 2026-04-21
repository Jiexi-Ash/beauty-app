"use node";
import { PlacesClient } from "@googlemaps/places";
import { Client, AddressType } from "@googlemaps/google-maps-services-js";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const placesClient = new PlacesClient({
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
});

const client = new Client({});

export const searchAddress = internalAction({
  args: {
    input: v.string(),
  },
  handler: async (_, { input }) => {
    if (input.length < 3) return [];

    const [{ suggestions }] = await placesClient.autocompletePlaces({
      input,
      includedRegionCodes: ["ZA"],
      includeQueryPredictions: false,
    });

    const results = await Promise.all(
      (suggestions ?? []).map(async (suggestion) => {
        const placeId = suggestion.placePrediction?.placeId;
        const text = suggestion.placePrediction?.text?.text;

        if (!placeId) return null;

        return {
          placeId,
          description: text,
        };
      }),
    );

    return results;
  },
});

export const getBusinessCoordinates = internalAction({
  args: {
    placesId: v.string(),
  },
  handler: async (_, { placesId }) => {
    const result = await client.geocode({
      params: {
        place_id: placesId,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    if (result.data.results.length < 1) return null;

    const { lat, lng } = result.data.results[0].geometry.location;

    return { latitude: lat, longitude: lng };
  },
});

export const getCityFromCoordinates = internalAction({
  args: {
    latitude: v.float64(),
    longitude: v.float64(),
  },
  handler: async (_, { latitude, longitude }) => {
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat: latitude, lng: longitude },
        // Use enum values to satisfy TypeScript and refine results
        result_type: [
          AddressType.neighborhood,
          AddressType.sublocality,
          AddressType.locality,
          AddressType.administrative_area_level_2,
        ],
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    const results = response.data.results;
    if (!results || results.length === 0) return null;

    // We look at the most specific result's components (usually results[0])
    const components = results[0].address_components;

    // 1. Find Suburb (e.g., Sandton)
    const suburb = components.find(
      (c) =>
        c.types.includes(AddressType.neighborhood) ||
        c.types.includes(AddressType.sublocality_level_1) ||
        c.types.includes(AddressType.sublocality),
    )?.long_name;

    // 2. Find City (e.g., Johannesburg)
    const city = components.find(
      (c) =>
        c.types.includes(AddressType.locality) ||
        c.types.includes(AddressType.administrative_area_level_2),
    )?.long_name;

    // Format output: "Suburb, City"
    if (suburb && city && suburb !== city) {
      return `${suburb}, ${city}`;
    }

    // Fallback if one name is missing or if they are identical
    return suburb || city || results[0].formatted_address;
  },
});
