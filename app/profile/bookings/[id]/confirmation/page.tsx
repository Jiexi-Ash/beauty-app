"use client";
import Image from "next/image";
import { CalendarBlank, Clock, MapPin, SealCheck } from "@phosphor-icons/react";
import Navbar from "@/components/navbar";
import { notFound, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatBookingTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/footer";
import { BookingConfirmationSkeleton } from "@/components/skeletons/booking-confirmation";
import { useAction } from "convex/react";
import { useEffect, useRef } from "react";

function BookingConfirmationPage() {
  const { id } = useParams();
  const bookingId = id as Id<"booking">;

  const { data, isLoading } = useQuery({
    ...convexQuery(api.booking.queries.getUserBookingById, {
      bookingId,
    }),
  });

  const verifyPayment = useAction(
    api.booking.actions.verifyAndSyncPaymentForBooking,
  );
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!data || hasVerified.current) return;
    if (data.status === "pending") {
      hasVerified.current = true;
      verifyPayment({ bookingId }).catch((err) => {
        console.error("Verify payment failed:", err);
        hasVerified.current = false; // allow retry if it errored, not just "not success"
      });
    }
  }, [data, bookingId, verifyPayment]);

  if (isLoading) return <BookingConfirmationSkeleton />;

  if (!data) return notFound();

  const price = ((data.paymentDetails.amountPaid ?? 0) / 100).toFixed(2);

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <Navbar />

      <div
        className="flex-1 flex flex-col items-center px-4 py-16"
        style={{ backgroundImage: "var(--background-image-gradient-rose)" }}
      >
        <div className="p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 mb-6">
          <div className="size-16 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
            <SealCheck weight="fill" className="size-8 text-primary" />
          </div>
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground text-center mb-3 tracking-tight">
          See you soon!
        </h1>
        <p className="text-muted-foreground text-center max-w-sm mb-10">
          Your appointment at
          <span className="text-primary font-medium mx-1">
            {data.business.name}
          </span>
          is confirmed.
        </p>

        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            {/* Status + amount */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-widest text-primary border border-primary/25 rounded-full px-3 py-1 uppercase">
                {data?.status}
              </span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Amount Paid (<span>{data.paymentDetails.paymentType}</span>)
                </p>
                <p className="text-xl font-bold text-primary">R{price}</p>
              </div>
            </div>

            {/* Service name */}
            <h2 className="font-headline text-2xl font-bold text-foreground mb-5 leading-tight uppercase">
              {data.service.name}
            </h2>

            {/* Date & Time */}
            <div className="flex gap-8 mb-6">
              <div className="flex items-center gap-2">
                <CalendarBlank className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-semibold text-foreground">
                    {data.startDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatBookingTime(data.time, data.business.timezone)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-black/5 mb-5" />

            {/* Action buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-primary text-white font-semibold py-3 rounded-full hover:bg-primary/90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                Add to Calendar
              </button>
              <button className="flex-1 border-2 border-primary text-primary font-semibold py-3 rounded-full hover:bg-primary/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                View Directions
              </button>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-3xl bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 overflow-hidden p-0">
          <CardContent className="p-0 flex flex-col">
            <div className="relative w-full h-48 md:h-56">
              <Image
                src={data.business.coverImage ?? ""}
                fill
                alt="business cover image"
                className="object-cover"
              />
            </div>

            <div className="p-6">
              <h3 className="font-headline text-xl font-bold text-foreground mb-1">
                {data.business.name}
              </h3>
              <div className="flex items-center gap-1">
                <MapPin className="text-muted-foreground size-4 shrink-0" />
                <p className="text-muted-foreground text-sm">
                  {data.business.location}
                </p>
              </div>
              {data.business.tags && data.business.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.business.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs border border-black/10 rounded-full px-3 py-1 text-muted-foreground capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}

export default BookingConfirmationPage;
