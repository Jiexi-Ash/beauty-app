import { auth } from "@clerk/nextjs/server";

export async function getAuthToken(): Promise<string | undefined> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const token = await (await auth()).getToken({ template: "convex" });
      return token ?? undefined;
    } catch (err) {
      // Clerk's API call can fail transiently (e.g. right after sign-in).
      // Retry with a short backoff before giving up.
      if (attempt === 2) throw err;
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
}
