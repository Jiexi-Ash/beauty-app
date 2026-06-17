"use client";

import { useState } from "react";
import { Preloaded, usePreloadedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  Scissors,
  StickyNote,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  cn,
  formatBookingDate,
  formatBookingTime,
  formatDuration,
  formatZar,
  getInitials,
} from "@/lib/utils";

function BookingDetails({
  preloadedBooking,
}: {
  preloadedBooking: Preloaded<typeof api.booking.queries.getBookingDetails>;
}) {
  const data = usePreloadedQuery(preloadedBooking);

  const startAppointment = useMutation(api.booking.admin.startAppointment);
  const completeAppointment = useMutation(api.booking.admin.completeAppointment);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!data) notFound();

  const { booking, client, service, payment, financials, history, business } =
    data;

  const handleStart = async () => {
    try {
      setIsUpdating(true);
      await startAppointment({ bookingId: booking._id });
      toast.success("Appointment started");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start the appointment.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsUpdating(true);
      await completeAppointment({ bookingId: booking._id });
      toast.success("Appointment completed");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not complete the appointment.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const isUpcoming = booking.status === "upcoming";
  const isInProgress = booking.status === "in_progress";
  const paidRatio =
    financials.totalFee > 0
      ? Math.min(financials.paid / financials.totalFee, 1)
      : 0;

  const paymentLabel =
    payment?.status === "completed"
      ? payment.type === "full-payment"
        ? "Full payment received"
        : "Deposit received"
      : "Awaiting payment";

  const isFullySettled =
    payment?.status === "completed" && payment.type === "full-payment";

  const statusBadge = getStatusBadge(booking.status);

  return (
    <div className="w-full px-6 py-6 2xl:max-w-[1600px] 2xl:mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Link href="/dashboard" className="hover:text-primary">
              Bookings
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-primary font-medium">Booking Details</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">Review Appointment</h1>
        </div>

        {isUpcoming && (
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="lg" className="h-10">
              Reschedule
            </Button>
            <Button
              size="lg"
              className="h-10"
              onClick={handleStart}
              disabled={isUpdating}
            >
              {isUpdating ? "Starting..." : "Start Appointment"}
            </Button>
          </div>
        )}

        {isInProgress && (
          <Button
            size="lg"
            className="h-10"
            onClick={handleComplete}
            disabled={isUpdating}
          >
            {isUpdating ? "Completing..." : "Mark as Completed"}
          </Button>
        )}
      </div>

      {/* Body: 3 columns */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        {/* Column 1: client, appointment, financials, notes */}
        <div className="space-y-4">
          {/* Client */}
          <Card className="rounded-lg">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
              <Avatar size="xl" className="size-20">
                <AvatarImage src={client.image ?? undefined} alt={client.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-1 flex-col gap-3">
                <h2 className="text-xl font-bold">{client.name}</h2>

                <div className="flex flex-wrap gap-2">
                  {client.phone && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium">
                      <Phone className="size-3.5 text-primary" />
                      {client.phone}
                    </span>
                  )}
                  {client.email && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium">
                      <Mail className="size-3.5 text-primary" />
                      {client.email}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment */}
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">
                  Appointment
                </span>
                <CalendarDays className="size-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold capitalize">{service.name}</h3>
                  <Badge
                    className={cn("text-[10px] font-medium", statusBadge.className)}
                  >
                    {statusBadge.label}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="size-3" />
                  Duration: {formatDuration(service.duration)}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <CalendarClock className="size-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-gray-400">
                    Scheduled for
                  </p>
                  <p className="text-sm font-bold">
                    {formatBookingDate(
                      booking.bookingStartDate,
                      business.timezone,
                    )}{" "}
                    •{" "}
                    {formatBookingTime(
                      booking.bookingStartDate,
                      business.timezone,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">
                  Financials
                </span>
                <Wallet className="size-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {formatZar(financials.totalFee)}
                  </p>
                  <p className="text-xs text-gray-400">Total booking fee</p>
                </div>
                <Badge
                  className={cn(
                    "text-[10px] font-bold",
                    isFullySettled
                      ? "bg-primary text-primary-foreground"
                      : "bg-amber-400/20 text-amber-600",
                  )}
                >
                  {paymentLabel}
                </Badge>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isFullySettled ? "bg-primary" : "bg-amber-500",
                  )}
                  style={{ width: `${paidRatio * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>Paid: {formatZar(financials.paid)}</span>
                <span>Remaining: {formatZar(financials.remaining)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Client Notes */}
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <StickyNote className="size-4 text-primary" />
                Client Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.notes ? (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  {booking.notes}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No notes were added for this booking.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: service details */}
        <div>
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-gray-400">
                  Service Details
                </span>
                <Scissors className="size-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.imageUrl && (
                <div className="relative h-40 w-full overflow-hidden rounded-lg">
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              )}
              <h3 className="text-lg font-bold capitalize">{service.name}</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] uppercase text-gray-400">
                    Listed price
                  </p>
                  <p className="text-base font-bold">
                    {formatZar(service.price)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[10px] uppercase text-gray-400">
                    Duration
                  </p>
                  <p className="text-base font-bold">
                    {formatDuration(service.duration)}
                  </p>
                </div>
              </div>

              {service.description && (
                <div>
                  <p className="mb-1 text-[10px] uppercase text-gray-400">
                    Description
                  </p>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: booking history */}
        <div>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Booking History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This is the client&apos;s first booking with you.
                </p>
              ) : (
                <ol className="relative space-y-5 border-l border-border pl-5">
                  {history.map((item) => (
                    <li key={item._id} className="relative">
                      <span className="absolute -left-[27px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <p className="text-sm font-semibold capitalize">
                        {item.serviceName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatBookingDate(item.date, business.timezone)} •{" "}
                        {item.price > 0 ? formatZar(item.price) : "Free"}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BookingDetails;

const getStatusBadge = (status: string): { label: string; className: string } => {
  switch (status) {
    case "upcoming":
      return { label: "Upcoming", className: "bg-blue-400/20 text-blue-600" };
    case "in_progress":
      return {
        label: "In progress",
        className: "bg-amber-400/20 text-amber-600",
      };
    case "completed":
      return { label: "Completed", className: "bg-green-400/25 text-green-600" };
    case "pending":
      return { label: "Pending", className: "bg-gray-100 text-gray-500" };
    case "cancelled_by_user":
    case "cancelled_by_business":
    case "cancelled_by_payment_failed":
      return {
        label: "Cancelled",
        className: "bg-destructive/10 text-destructive",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        className: "bg-gray-100 text-gray-500",
      };
  }
};
