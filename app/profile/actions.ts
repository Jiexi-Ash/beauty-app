"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { fetchMutation } from "convex/nextjs"
import { ConvexError } from "convex/values"
import { api } from "@/convex/_generated/api"
import { getAuthToken } from "@/auth"

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "You must be signed in." }

  try {
    const token = await getAuthToken()
    await fetchMutation(api.users.anonymizeCurrentUser, {}, { token })

    const client = await clerkClient()
    await client.users.deleteUser(userId)

    return { success: true }
  } catch (error) {
    if (error instanceof ConvexError) {
      return { success: false, error: String(error.data) }
    }
    console.error("deleteAccount failed:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}
