"use node";
import twilio from "twilio";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

function toE164ZA(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27")) return `+${digits}`;
  if (digits.startsWith("0")) return `+27${digits.slice(1)}`;
  return `+27${digits}`;
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const SendWhatsAppBookingConfirmedMessage = internalAction({
  args: {
    bookingId: v.id("booking"),
  },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.runQuery(internal.booking.admin.getBookingById, {
      bookingId,
    });

    if (!booking) {
      console.error(
        `SendWhatsAppBookingConfirmedMessage: booking not found for id ${bookingId}`,
      );
      return;
    }

    const [service, business, user] = await Promise.all([
      ctx.runQuery(internal.service.admin.queryServiceById, {
        serviceId: booking.serviceId,
      }),
      ctx.runQuery(internal.business.admin.queryBusinessById, {
        businessId: booking.businessId,
      }),
      ctx.runQuery(internal.users.queryUserById, { userId: booking.userId }),
    ]);

    const phone = booking.phoneNumber || user?.phone;

    if (!service || !business || !user || !phone) {
      console.error(
        `SendWhatsAppBookingConfirmedMessage: missing data for booking ${bookingId}`,
        {
          service: !!service,
          business: !!business,
          user: !!user,
          phone: !!phone,
        },
      );
      return;
    }

    const startDate = new Date(booking.bookingStartDate);

    const formattedDate = startDate.toLocaleDateString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = startDate.toLocaleTimeString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
    });
    const serviceName = service.name.replace(/\b\w/g, (c) => c.toUpperCase());
    const businessName = business.name.replace(/\b\w/g, (c) => c.toUpperCase());

    await client.messages.create({
      body: `Hi ${user.fullname}! \n\nYour booking is confirmed!\n\n Service: ${serviceName}\n Business: ${businessName}\n Date: ${formattedDate}\n Time: ${formattedTime}\n Location: ${business.location}, ${business.city}\n\nSee you soon!`,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${toE164ZA(phone)}`,
    });
  },
});

export const SendWhatsAppBookingReminderMessage = internalAction({
  args: {
    bookingId: v.id("booking"),
  },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.runQuery(internal.booking.admin.getBookingById, {
      bookingId,
    });

    if (!booking) {
      console.error(
        `SendWhatsAppBookingReminderMessage: booking not found for id ${bookingId}`,
      );
      return;
    }

    const [service, business, user] = await Promise.all([
      ctx.runQuery(internal.service.admin.queryServiceById, {
        serviceId: booking.serviceId,
      }),
      ctx.runQuery(internal.business.admin.queryBusinessById, {
        businessId: booking.businessId,
      }),
      ctx.runQuery(internal.users.queryUserById, { userId: booking.userId }),
    ]);

    const phone = booking.phoneNumber || user?.phone;

    if (!service || !business || !user || !phone) {
      console.error(
        `SendWhatsAppBookingReminderMessage: missing data for booking ${bookingId}`,
        {
          service: !!service,
          business: !!business,
          user: !!user,
          phone: !!phone,
        },
      );
      return;
    }

    const startDate = new Date(booking.bookingStartDate);

    const formattedDate = startDate.toLocaleDateString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = startDate.toLocaleTimeString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
    });
    const serviceName = service.name.replace(/\b\w/g, (c) => c.toUpperCase());
    const businessName = business.name.replace(/\b\w/g, (c) => c.toUpperCase());

    await client.messages.create({
      body: `Hi ${user.fullname}! \n\nJust a reminder — your appointment is coming up!\n\n Service: ${serviceName}\n Business: ${businessName}\n Date: ${formattedDate}\n Time: ${formattedTime}\n Location: ${business.location}, ${business.city}\n\nSee you soon!`,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${toE164ZA(phone)}`,
    });

    await ctx.runMutation(internal.booking.admin.markReminderSent, { bookingId });
  },
});

export const SendWhatsAppBookingCancelledMessage = internalAction({
  args: {
    bookingId: v.id("booking"),
  },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.runQuery(internal.booking.admin.getBookingById, {
      bookingId,
    });

    if (!booking) {
      console.error(
        `SendWhatsAppBookingCancelledMessage: booking not found for id ${bookingId}`,
      );
      return;
    }

    const [service, business, user] = await Promise.all([
      ctx.runQuery(internal.service.admin.queryServiceById, {
        serviceId: booking.serviceId,
      }),
      ctx.runQuery(internal.business.admin.queryBusinessById, {
        businessId: booking.businessId,
      }),
      ctx.runQuery(internal.users.queryUserById, { userId: booking.userId }),
    ]);

    const phone = booking.phoneNumber || user?.phone;

    if (!service || !business || !user || !phone) {
      console.error(
        `SendWhatsAppBookingCancelledMessage: missing data for booking ${bookingId}`,
        {
          service: !!service,
          business: !!business,
          user: !!user,
          phone: !!phone,
        },
      );
      return;
    }

    const startDate = new Date(booking.bookingStartDate);

    const formattedDate = startDate.toLocaleDateString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = startDate.toLocaleTimeString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
    });
    const serviceName = service.name.replace(/\b\w/g, (c) => c.toUpperCase());
    const businessName = business.name.replace(/\b\w/g, (c) => c.toUpperCase());

    await client.messages.create({
      body: `Hi ${user.fullname}. \n\nUnfortunately your booking has been cancelled by the business.\n\n Service: ${serviceName}\n Business: ${businessName}\n Date: ${formattedDate}\n Time: ${formattedTime}\n\nWe're sorry for the inconvenience. Please reach out to ${businessName} directly if you have any questions.`,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${toE164ZA(phone)}`,
    });
  },
});

export const sweepBookingReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const dueBookings = await ctx.runQuery(
      internal.booking.admin.getBookingsDueForReminder,
      {},
    );

    await Promise.all(
      dueBookings.map((booking) =>
        ctx.runAction(internal.notifications.messages.SendWhatsAppBookingReminderMessage, {
          bookingId: booking._id,
        }),
      ),
    );
  },
});
