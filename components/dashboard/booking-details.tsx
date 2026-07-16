"use client";

import { useMemo, useState } from "react";
import { Preloaded, usePreloadedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { format, isSameDay } from "date-fns";
import { TZDate } from "@date-fns/tz";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import {
  CalendarCheck,
  CalendarDots,
  CaretLeft,
  CaretRight,
  Check,
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
  const markBalanceCollected = useMutation(
    api.booking.admin.markBalanceCollected,
  );
  const [pendingAction, setPendingAction] = useState<
    "start" | "complete" | "cancel" | "update-no-show" | "collect-balance" | null
  >(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleOpenedAt, setRescheduleOpenedAt] = useState(() => Date.now());
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [balanceCollectedChecked, setBalanceCollectedChecked] = useState(false);
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
      await completeBooking({
        bookingId: booking._id,
        balanceCollected: balanceCollectedChecked,
      });
      toast.success("Appointment completed");
      setCompleteDialogOpen(false);
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

  const handleMarkBalanceCollected = async () => {
    try {
      setPendingAction("collect-balance");
      await markBalanceCollected({ bookingId: booking._id });
      toast.success("Balance marked as collected");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not mark this balance as collected.",
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
          : "Could not update this appointment.",
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

  const isFullySettled =
    payment?.status === "completed" &&
    (payment.type === "full-payment" || payment.balanceCollected);

  const displayedPaidRatio = isFullySettled ? 1 : paidRatio;

  const paymentLabel =
    payment?.status === "completed"
      ? payment.type === "full-payment"
        ? "Full payment received"
        : payment.balanceCollected
          ? "Paid"
          : "Deposit received"
      : "Awaiting payment";

  const hasOutstandingBalance =
    payment?.status === "completed" &&
    payment.type === "deposit" &&
    !payment.balanceCollected &&
    financials.remaining > 0;

  const showBalanceCollectedAction =
    booking.status === "completed" && hasOutstandingBalance;

  const statusBadge = getBookingStatusBadge(booking.status);

  return (
    <div className="w-full px-6 py-6 2xl:max-w-[1600px] 2xl:mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/dashboard/appointments" className="hover:text-primary">
              Appointments
            </Link>
            <CaretRight className="size-3" />
            <span className="text-primary font-medium">Appointment Details</span>
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
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-10"
                  onClick={() => {
                    setRescheduleOpenedAt(Date.now());
                    setRescheduleOpen(true);
                  }}
                >
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
          <AlertDialog
            open={completeDialogOpen}
            onOpenChange={(open) => {
              setCompleteDialogOpen(open);
              if (!open) setBalanceCollectedChecked(false);
            }}
          >
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

              {hasOutstandingBalance && (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Balance of {formatZar(financials.remaining)} outstanding
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Collected in person from {client.name}?
                    </p>
                  </div>
                  <Switch
                    checked={balanceCollectedChecked}
                    onCheckedChange={setBalanceCollectedChecked}
                    disabled={pendingAction === "complete"}
                  />
                </div>
              )}

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
          <Card>
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
          <Card>
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
          <Card>
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
                  <p className="text-xs text-muted-foreground">Total appointment fee</p>
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
                  style={{ width: `${displayedPaidRatio * 100}%` }}
                />
              </div>

              {payment?.balanceCollected ? (
                <p className="text-xs text-muted-foreground">
                  {formatZar(financials.remaining)} collected in person
                </p>
              ) : (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Paid: {formatZar(financials.paid)}</span>
                  <span>Remaining: {formatZar(financials.remaining)}</span>
                </div>
              )}

              {showBalanceCollectedAction && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={pendingAction === "collect-balance"}
                  onClick={handleMarkBalanceCollected}
                >
                  {pendingAction === "collect-balance"
                    ? "Marking as collected..."
                    : `Mark ${formatZar(financials.remaining)} balance as collected`}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Client Notes */}
          <Card>
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
                  No notes were added for this appointment.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: service details */}
        <div>
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-headline font-bold">
                Appointment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This is the client&apos;s first appointment with you.
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

      {canCancel && (
        <RescheduleDialog
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          now={rescheduleOpenedAt}
          booking={booking}
          service={service}
          business={business}
        />
      )}
    </div>
  );
}

export default BookingDetails;

type RescheduleSlot = {
  start: string;
  end: string;
  startTimestamp: number;
  endTimestamp: number;
};

// Returns a UTC-noon marker for d's calendar date in `timezone`, so day picker and slot query agree regardless of the admin's local timezone.
const toNoonUTC = (d: Date, timezone: string) => {
  const zoned = new TZDate(d, timezone);
  return new Date(
    Date.UTC(zoned.getFullYear(), zoned.getMonth(), zoned.getDate(), 12, 0, 0),
  );
};

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  now: number;
  booking: {
    _id: Id<"booking">;
    bookingStartDate: number;
    bookingEndDate: number;
  };
  service: {
    _id: Id<"service">;
    name: string;
    duration?: number;
  };
  business: {
    slug: string;
    timezone: string;
  };
}

function RescheduleDialog({
  open,
  onOpenChange,
  now,
  booking,
  service,
  business,
}: RescheduleDialogProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    toNoonUTC(new Date(booking.bookingStartDate), business.timezone),
  );
  const [selectedSlot, setSelectedSlot] = useState<RescheduleSlot | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [lastNow, setLastNow] = useState(now);

  // Reset selection state on every dialog open (new `now` from parent) — this component stays mounted across opens, so state would otherwise carry over.
  if (now !== lastNow) {
    setLastNow(now);
    setWeekOffset(0);
    setSelectedDate(toNoonUTC(new Date(booking.bookingStartDate), business.timezone));
    setSelectedSlot(null);
  }

  const rescheduleBooking = useMutation(
    api.booking.admin.rescheduleBookingByBusiness,
  );

  const weekDays = useMemo(() => {
    const today = new TZDate(now, business.timezone);
    const base = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0,
    );
    return Array.from(
      { length: 7 },
      (_, i) => new Date(base + (weekOffset * 7 + i) * 86_400_000),
    );
  }, [weekOffset, now, business.timezone]);

  const blockedData = useQuery(
    api.business.public.getBlockedSlots,
    open
      ? {
          businessSlug: business.slug,
          serviceId: service._id,
          date: selectedDate.getTime(),
        }
      : "skip",
  );

  const slots = useMemo<RescheduleSlot[]>(() => {
    if (!blockedData?.businessHours || !service.duration) return [];

    const { businessHours, maxConcurrent, allowBeyondClose, bufferMinutes, bookedSlots } =
      blockedData;

    const [openH, openM] = businessHours.openTime.split(":").map(Number);
    const [closeH, closeM] = businessHours.closeTime.split(":").map(Number);

    // Re-anchor selectedDate's Y/M/D to the business's timezone so open/close times line up with server-computed `bookedSlots`.
    const year = selectedDate.getUTCFullYear();
    const month = selectedDate.getUTCMonth();
    const day = selectedDate.getUTCDate();

    const openTime = new TZDate(
      year,
      month,
      day,
      openH,
      openM,
      0,
      business.timezone,
    ).getTime();
    const closeTime = new TZDate(
      year,
      month,
      day,
      closeH,
      closeM,
      0,
      business.timezone,
    ).getTime();
    const durationMs = service.duration * 60_000;
    const bufferMs = bufferMinutes * 60_000;

    const available: RescheduleSlot[] = [];
    let slotStart = openTime;

    while (slotStart < closeTime) {
      const slotEnd = slotStart + durationMs;

      if (!allowBeyondClose && slotEnd > closeTime) break;
      if (allowBeyondClose && slotStart >= closeTime) break;

      if (slotStart > now) {
        // Exclude the current booking so its own slot doesn't show as unavailable.
        const overlapping = bookedSlots.filter(
          (b) =>
            b.start < slotEnd &&
            b.end > slotStart &&
            !(b.start === booking.bookingStartDate && b.end === booking.bookingEndDate),
        );

        if (overlapping.length < maxConcurrent) {
          available.push({
            start: format(new Date(slotStart), "HH:mm"),
            end: format(new Date(slotEnd), "HH:mm"),
            startTimestamp: slotStart,
            endTimestamp: slotEnd,
          });
        }
      }

      slotStart += durationMs + bufferMs;
    }

    return available;
  }, [blockedData, selectedDate, booking, service, now, business.timezone]);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const monthLabel =
    format(weekStart, "MMMM") === format(weekEnd, "MMMM")
      ? format(weekStart, "MMMM yyyy")
      : `${format(weekStart, "MMM")} – ${format(weekEnd, "MMM yyyy")}`;

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    try {
      setSubmitting(true);
      await rescheduleBooking({
        bookingId: booking._id,
        date: format(new Date(selectedSlot.startTimestamp), "yyyy-MM-dd"),
        time: format(new Date(selectedSlot.startTimestamp), "HH:mm"),
      });
      toast.success("Appointment rescheduled");
      onOpenChange(false);
      setSelectedSlot(null);
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as string) || "Could not reschedule this appointment.");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Could not reschedule this appointment.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-headline font-bold">
            Reschedule Appointment
          </DialogTitle>
          <DialogDescription>
            Pick a new date and time for{" "}
            <span className="font-bold capitalize">{service.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{monthLabel}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setWeekOffset((o) => Math.max(0, o - 1));
                  setSelectedSlot(null);
                }}
                disabled={weekOffset === 0}
                className="size-8 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
              >
                <CaretLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeekOffset((o) => o + 1);
                  setSelectedSlot(null);
                }}
                className="size-8 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <CaretRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(toNoonUTC(day, business.timezone));
                    setSelectedSlot(null);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl transition-all shrink-0 w-14 h-16",
                    isSelected
                      ? "bg-primary text-white shadow"
                      : "bg-muted hover:bg-muted/70",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] uppercase font-semibold tracking-wide",
                      isSelected ? "text-white/75" : "text-muted-foreground",
                    )}
                  >
                    {format(day, "EEE")}
                  </span>
                  <span className="text-lg font-bold mt-0.5">{format(day, "d")}</span>
                </button>
              );
            })}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {blockedData === undefined ? (
              <div className="grid grid-cols-3 gap-2" aria-busy="true" aria-label="Loading available slots">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : blockedData === null ? (
              <p className="text-sm text-muted-foreground">Not open on this day.</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available slots for this day.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.startTimestamp === slot.startTimestamp;
                  const isCurrent =
                    slot.startTimestamp === booking.bookingStartDate &&
                    slot.endTimestamp === booking.bookingEndDate;
                  return (
                    <Button
                      variant="outline"
                      type="button"
                      key={slot.startTimestamp}
                      onClick={() => !isCurrent && setSelectedSlot(slot)}
                      disabled={isCurrent}
                      className={cn(
                        "rounded-lg py-2 px-3 text-sm font-semibold transition-all",
                        isCurrent
                          ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                          : isSelected
                            ? "bg-primary text-white shadow"
                            : "bg-muted hover:bg-muted/70",
                      )}
                      title={isCurrent ? "Current appointment time" : undefined}
                    >
                      {slot.start}
                      {isSelected && !isCurrent && <Check className="inline ml-1 size-3.5" />}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedSlot || isSubmitting}
              size="lg"
            >
              {isSubmitting ? "Rescheduling..." : "Confirm new time"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
