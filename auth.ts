import { auth } from "@clerk/nextjs/server";

export async function getAuthToken(): Promise<string | undefined> {
  const token = await (await auth()).getToken({ template: "convex" });
  return token ?? undefined;
} 