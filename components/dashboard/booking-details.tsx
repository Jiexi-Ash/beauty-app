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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  CalendarCheck,
  CalendarDots,
  CaretRight,
  CheckCircle,
  Clock,
  ClockCounterClockwise,
  EnvelopeSimple,
  PlayCircle,
  Phone,
  Prohibit,
  Scissors,
  NotePencil,
  Wallet,
} from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import {
  cn,
  formatBookingDate,
  formatBookingTime,
  formatDuration,
  formatZar,
  getBookingStatusBadge,
  getInitials,
} from "@/lib/utils";
import { NO_SHOW_CORRECTION_WINDOW_HOURS } from "@/constants";

function BookingDetails({
  preloadedBooking,
}: {
  preloadedBooking: Preloaded<typeof api.booking.queries.getBookingDetails>;
}) {
  const data = usePreloadedQuery(preloadedBooking);

  const startBooking = useMutation(api.booking.admin.startBooking);
  const completeBooking = useMutation(api.booking.admin.completeBooking);
  const cancelBookingByBusiness = useMutation(
    api.booking.admin.cancelBookingByBusiness,
  );
  const markNoShowAsCompleted = useMutation(
    api.booking.admin.markNoShowAsCompleted,
  );
  const [pendingAction, setPendingAction] = useState<
    "start" | "complete" | "cancel" | "update-no-show" | null
  >(null);
  const [now] = useState(() => Date.now());

  if (!data) notFound();

  const { booking, client, service, payment, financials, history, business } =
    data;

  const handleStart = async () => {
    try {
      setPendingAction("start");
      await startBooking({ bookingId: booking._id });
      toast.success("Appointment started");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start the appointment.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleComplete = async () => {
    try {
      setPendingAction("complete");
      await completeBooking({ bookingId: booking._id });
      toast.success("Appointment completed");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not complete the appointment.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleCancel = async () => {
    try {
      setPendingAction("cancel");
      await cancelBookingByBusiness({ bookingId: booking._id });
      toast.success("Appointment cancelled");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not cancel the appointment.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleUpdateNoShow = async () => {
    try {
      setPendingAction("update-no-show");
      await markNoShowAsCompleted({ bookingId: booking._id });
      toast.success("Appointment marked as completed");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not update this booking.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const isUpcoming = booking.status === "upcoming";
  const isInProgress = booking.status === "in_progress";
  const isNoShow = booking.status === "no_show";
  const canCancel = isUpcoming && booking.bookingStartDate > now;
  const canUpdateNoShow =
    isNoShow &&
    now <= booking.bookingEndDate + NO_SHOW_CORRECTION_WINDOW_HOURS * 60 * 60 * 1000;
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

  const statusBadge = getBookingStatusBadge(booking.status);

  return (
    <div className="w-full px-6 py-6 2xl:max-w-[1600px] 2xl:mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/dashboard/bookings" className="hover:text-primary">
              Bookings
            </Link>
            <CaretRight className="size-3" />
            <span className="text-primary font-medium">Booking Details</span>
          </div>
          <h1 className="mt-1 text-2xl font-headline font-bold">Review Appointment</h1>
        </div>

        {isUpcoming && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-3",
              !canCancel && "w-full lg:w-auto",
            )}
          >
            {canCancel && (
              <>
                <Button variant="secondary" size="lg" className="h-10">
                  Reschedule
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="destructive"
                        size="lg"
                        className="h-10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                      />
                    }
                  >
                    Cancel Appointment
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia className="bg-destructive/10">
                        <Prohibit className="text-destructive" weight="fill" />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {client.name} will be notified by WhatsApp that {service.name} on{" "}
                        {formatBookingDate(booking.bookingStartDate, business.timezone)} has
                        been cancelled. The deposit is non-refundable and this can&apos;t be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={pendingAction === "cancel"}>
                        Keep appointment
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={pendingAction === "cancel"}
                        onClick={handleCancel}
                      >
                        {pendingAction === "cancel" ? "Cancelling..." : "Cancel appointment"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    size="lg"
                    className={cn(
                      "h-10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]",
                      !canCancel && "w-full",
                    )}
                  />
                }
              >
                Start Appointment
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-primary/10">
                    <PlayCircle className="text-primary" weight="fill" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Start this appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This marks {client.name}&apos;s {service.name} as in progress. Only
                    start it once the client has arrived.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pendingAction === "start"}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={pendingAction === "start"}
                    onClick={handleStart}
                  >
                    {pendingAction === "start" ? "Starting..." : "Start appointment"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {isInProgress && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  size="lg"
                  className="h-10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                />
              }
            >
              Mark as Completed
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-primary/10">
                  <CheckCircle className="text-primary" weight="fill" />
                </AlertDialogMedia>
                <AlertDialogTitle>Mark as completed?</AlertDialogTitle>
                <AlertDialogDescription>
                  This finalizes {client.name}&apos;s {service.name} appointment as
                  completed. Only do this once the service has actually finished.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pendingAction === "complete"}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={pendingAction === "complete"}
                  onClick={handleComplete}
                >
                  {pendingAction === "complete" ? "Completing..." : "Mark as completed"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canUpdateNoShow && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                />
              }
            >
              <ClockCounterClockwise className="size-4" />
              Update to Completed
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-primary/10">
                  <CheckCircle className="text-primary" weight="fill" />
                </AlertDialogMedia>
                <AlertDialogTitle>Update to completed?</AlertDialogTitle>
                <AlertDialogDescription>
                  This was automatically marked as a no-show because it was never
                  started. If {client.name} actually attended and you forgot to start
                  the appointment, you can update it to completed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pendingAction === "update-no-show"}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={pendingAction === "update-no-show"}
                  onClick={handleUpdateNoShow}
                >
                  {pendingAction === "update-no-show"
                    ? "Updating..."
                    : "Mark as completed"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Body: 3 columns */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        {/* Column 1: client, appointment, financials, notes */}
        <div className="space-y-4">
          {/* Client */}
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
              <Avatar size="xl" className="size-20">
                <AvatarImage src={client.image ?? undefined} alt={client.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-1 flex-col gap-3">
                <h2 className="text-xl font-headline font-bold">{client.name}</h2>

                <div className="flex flex-wrap gap-2">
                  {client.phone && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium">
                      <Phone className="size-3.5 text-primary" />
                      {client.phone}
                    </span>
                  )}
                  {client.email && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium">
                      <EnvelopeSimple className="size-3.5 text-primary" />
                      {client.email}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment */}
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Appointment
                </span>
                <CalendarDots className="size-5 text-primary" />
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
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  Duration: {formatDuration(service.duration)}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <CalendarCheck className="size-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
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
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
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
                  <p className="text-xs text-muted-foreground">Total booking fee</p>
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

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isFullySettled ? "bg-primary" : "bg-amber-500",
                  )}
                  style={{ width: `${paidRatio * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Paid: {formatZar(financials.paid)}</span>
                <span>Remaining: {formatZar(financials.remaining)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Client Notes */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-headline font-bold">
                <NotePencil className="size-4 text-primary" />
                Client Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.notes ? (
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
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
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
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
              <h3 className="text-lg font-headline font-bold capitalize">{service.name}</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Listed price
                  </p>
                  <p className="text-base font-bold">
                    {formatZar(service.price)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Duration
                  </p>
                  <p className="text-base font-bold">
                    {formatDuration(service.duration)}
                  </p>
                </div>
              </div>

              {service.description && (
                <div>
                  <p className="mb-1 text-[10px] uppercase text-muted-foreground">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: booking history */}
        <div>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-headline font-bold">
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
                      <p className="text-xs text-muted-foreground">
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
