import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occurred", { status: 400 });
    }

    switch (event.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      default:
        break;
    }

    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/api/payfast/notify",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const pfIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("cf-connecting-ip") ??
      null;

    try {
      await ctx.runAction(internal.payfast.handleITN, { body, pfIp });
    } catch (e) {
      console.error("ITN handler failed:", e);
    }

    return new Response(null, { status: 200 }); // always 200
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;
