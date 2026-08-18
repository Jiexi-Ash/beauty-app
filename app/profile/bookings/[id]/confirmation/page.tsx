"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowClockwise, CalendarBlank, Clock, MapPin, SealCheck, Warning } from "@phosphor-icons/react";
import Navbar from "@/components/navbar";
import { notFound, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn, formatBookingTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import { BookingConfirmationSkeleton } from "@/components/skeletons/booking-confirmation";
import { useAction } from "convex/react";
import { useEffect, useRef, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  upcoming: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled_by_user: "Cancelled",
  cancelled_by_business: "Cancelled by business",
  cancelled_by_payment_failed: "Payment failed",
  no_show: "No show",
};

function humanizeStatus(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

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
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [isRetryingVerify, setIsRetryingVerify] = useState(false);

  useEffect(() => {
    if (!data || hasVerified.current) return;
    if (data.status === "pending") {
      hasVerified.current = true;
      verifyPayment({ bookingId }).catch((err) => {
        console.error("Verify payment failed:", err);
        hasVerified.current = false; // allow retry if it errored, not just "not success"
        setVerifyFailed(true);
      });
    }
  }, [data, bookingId, verifyPayment]);

  const handleRetryVerify = () => {
    hasVerified.current = true;
    setVerifyFailed(false);
    setIsRetryingVerify(true);
    verifyPayment({ bookingId })
      .catch((err) => {
        console.error("Verify payment failed:", err);
        hasVerified.current = false;
        setVerifyFailed(true);
      })
      .finally(() => setIsRetryingVerify(false));
  };

  if (isLoading) return <BookingConfirmationSkeleton />;

  if (!data) return notFound();

  const isSuccess = ["upcoming", "in_progress", "completed"].includes(data.status);
  const isPendingVerification = data.status === "pending";
  const isFailed = !isSuccess && !isPendingVerification;

  const price = ((data.paymentDetails.amountPaid ?? 0) / 100).toFixed(2);

  const toGCalDate = (ms: number) =>
    new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, "");

  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `${data.service.name ?? "Appointment"} at ${data.business.name}`,
  )}&dates=${toGCalDate(data.time)}/${toGCalDate(data.endTime)}&details=${encodeURIComponent(
    `Appointment at ${data.business.name}`,
  )}&location=${encodeURIComponent(data.business.location ?? data.business.name)}`;

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    data.business.location ?? data.business.name,
  )}`;

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center px-4 py-16">
        <div className="p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 mb-6">
          <div className="size-16 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
            {isSuccess && <SealCheck weight="fill" className="size-8 text-primary" />}
            {isPendingVerification && <Clock weight="fill" className="size-8 text-amber-500" />}
            {isFailed && <Warning weight="fill" className="size-8 text-destructive" />}
          </div>
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground text-center mb-3 tracking-tight">
          {isSuccess && "See you soon!"}
          {isPendingVerification && "Confirming your payment…"}
          {isFailed && "Payment didn't go through"}
        </h1>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          {isSuccess && (
            <>
              Your appointment at
              <span className="text-primary font-medium mx-1">
                {data.business.name}
              </span>
              is confirmed.
            </>
          )}
          {isPendingVerification && (
            <>
              We&apos;re verifying your payment for
              <span className="text-primary font-medium mx-1">
                {data.business.name}
              </span>
              — this usually only takes a few seconds.
            </>
          )}
          {isFailed && (
            <>
              Your booking at
              <span className="text-primary font-medium mx-1">
                {data.business.name}
              </span>
              wasn&apos;t completed. Head back to My Bookings to try paying again.
            </>
          )}
        </p>
        {isPendingVerification && verifyFailed && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary mb-4 -mt-2"
            disabled={isRetryingVerify}
            onClick={handleRetryVerify}
          >
            <ArrowClockwise className={cn("size-4", isRetryingVerify && "animate-spin")} />
            {isRetryingVerify ? "Checking…" : "Couldn't confirm — check again"}
          </Button>
        )}

        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            {/* Status + amount */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={cn(
                  "text-xs font-semibold tracking-widest border rounded-full px-3 py-1 uppercase",
                  isSuccess && "text-primary border-primary/25",
                  isPendingVerification && "text-amber-600 border-amber-500/30",
                  isFailed && "text-destructive border-destructive/30",
                )}
              >
                {humanizeStatus(data.status)}
              </span>
              {isSuccess && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Amount Paid (<span>{data.paymentDetails.paymentType}</span>)
                  </p>
                  <p className="text-xl font-bold text-primary">R{price}</p>
                  {data.paymentDetails.remaining > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      R{(data.paymentDetails.remaining / 100).toFixed(2)} due at your appointment
                    </p>
                  )}
                </div>
              )}
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
            {isSuccess && (
              <div className="flex gap-3">
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-primary text-white font-semibold py-3 rounded-full hover:bg-primary/90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                >
                  Add to Calendar
                </a>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center border-2 border-primary text-primary font-semibold py-3 rounded-full hover:bg-primary/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                >
                  View Directions
                </a>
              </div>
            )}
            {isPendingVerification && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center border-2 border-primary text-primary font-semibold py-3 rounded-full hover:bg-primary/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                View Directions
              </a>
            )}
            {isFailed && (
              <Link
                href="/profile/bookings"
                className="block text-center bg-primary text-white font-semibold py-3 rounded-full hover:bg-primary/90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                Go to My Bookings
              </Link>
            )}
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
