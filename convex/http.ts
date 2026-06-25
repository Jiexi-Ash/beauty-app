import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import { isValidPaystackIP } from "./paystack/utils";


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
  path: "/api/paystack/notify",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() ?? null;

    if (!isValidPaystackIP(clientIp)) {
      console.warn("Paystack webhook from unrecognized IP:", clientIp);
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    const isValid = await ctx.runAction(internal.paystack.actions.verifySignature, {
      rawBody,
      signature,
    });

    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (!event?.event) {
      console.warn("Webhook missing event field");
      return new Response(null, { status: 200 });
    }

    switch (event.event) {
      case "charge.success": {
        if (!event.data) {
          console.warn("charge.success missing data field");
          break;
        }

        await ctx.runMutation(internal.paystack.mutations.handlePaystackEvent, {
          event: {
            event: event.event,
            data: {
              reference: event.data.reference,
              status: event.data.status,
              amount: event.data.amount,
              paid_at: event.data.paid_at,
              channel: event.data.channel,
              currency: event.data.currency,
              metadata: event.data.metadata,
            },
          },
        });
        break;
      }

      default: {
        console.log("Ignoring unhandled event type:", event.event);
        break;
      }
    }
    return new Response(null, { status: 200 });
  })
})

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
