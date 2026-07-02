"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { CalendarX, DotsThreeVertical, Eye, NotePencil } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { cn, formatBookingDateTime, formatBookingTime, formatDuration } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { BookingWithDetails } from "@/convex/business/admin";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "../ui/skeleton";

function UpcomingBookings() {
  const { data, isLoading } = useQuery({
    ...convexQuery(api.business.admin.getUpcomingBookings),
  });
  return (
    <div className="mb-6">
      <BookingsMobile bookings={data} isLoading={isLoading} />
      <BookingsDesktop bookings={data} isLoading={isLoading} />
    </div>
  );
}

export default UpcomingBookings;

const BookingsDesktop = ({
  bookings,
  isLoading,
}: {
  bookings: BookingWithDetails[] | undefined;
  isLoading: boolean;
}) => {
  return (
    <Card className="hidden sm:block">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-bold">Upcoming appointments</CardTitle>
            <CardDescription>
              Your schedule for today and tomorrow
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full grid grid-cols-5 bg-muted py-3 px-2 rounded">
          <div className="uppercase text-muted-foreground  text-xs font-semibold">
            Client
          </div>
          <div className="uppercase text-muted-foreground  text-xs font-semibold">
            Service
          </div>
          <div className="uppercase text-muted-foreground  text-xs font-semibold">
            Date & Time
          </div>
          <div className="uppercase text-muted-foreground  text-xs font-semibold">
            Payment
          </div>
          <div className="uppercase text-muted-foreground  text-xs font-semibold">
            Actions
          </div>
        </div>

        {isLoading ? (
          <DesktopRowsSkeleton />
        ) : !bookings || bookings.length === 0 ? (
          <EmptyBookings />
        ) : (
          bookings.map((a) => (
          <div key={a._id} className="w-full grid grid-cols-5 items-center">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarImage
                  src={a.client.avatar}
                  alt={a.client.name ?? "Client"}
                />
                <AvatarFallback>{getInitials(a.client.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 ">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs">{a.client.name}</span>
                  {a.notes && (
                    <NotePencil
                      className="size-3 text-muted-foreground shrink-0"
                      aria-label="Has a note"
                    >
                      <title>This appointment has a note</title>
                    </NotePencil>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {a.client.email}
                </span>
              </div>
            </div>

            <div className="text-muted-foreground text-sm capitalize">{a.service.name}</div>
            <div className="flex flex-col gap-0.5 ">
              <span className="font-bold text-xs">{formatBookingDateTime(a.bookingStartDate, a.business.timezone)}</span>
              <span className="text-muted-foreground text-xs">
                Duration: {formatDuration(a.service.duration)}
              </span>
            </div>

            <div className="flex items-center">
              <PaymentBadge status={a.payment?.status} type={a.payment?.type} />
            </div>

            <BookingActions bookingId={a._id} />
          </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

const BookingsMobile = ({
  bookings,
  isLoading,
}: {
  bookings: BookingWithDetails[] | undefined;
  isLoading: boolean;
}) => {
  return (
    <Card className="block sm:hidden rounded-lg mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-bold">Upcoming appointments</CardTitle>
            <CardDescription>
              Your schedule for today and tomorrow
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <MobileRowsSkeleton />
        ) : !bookings || bookings.length === 0 ? (
          <EmptyBookings />
        ) : (
          bookings.map((a) => (
          <div key={a._id} className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3 mt-4">
              <Avatar size="lg">
                <AvatarImage
                  src={a.client.avatar}
                  alt={a.client.name ?? "Client"}
                />
                <AvatarFallback>{getInitials(a.client.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <span className="font-bold text-xs">{a.client.name}</span>
                  <span className="mx-1.5 text-muted-foreground" aria-hidden>·</span>
                  <div className="text-muted-foreground text-xs capitalize">
                    <span>{a.service.name}</span>
                  </div>
                  {a.notes && (
                    <NotePencil
                      className="size-3 text-muted-foreground shrink-0 ml-1"
                      aria-label="Has a note"
                    >
                      <title>This appointment has a note</title>
                    </NotePencil>
                  )}
                </div>

                <span className="text-xs text-muted-foreground">{formatBookingTime(a.bookingStartDate, a.business.timezone)}</span>

                <div className="flex items-center text-xs">
                  <PaymentBadge status={a.payment?.status} type={a.payment?.type} />
                </div>
              </div>
            </div>

            <BookingActions bookingId={a._id} />
          </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

const EmptyBookings = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <CalendarX className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">No upcoming appointments</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Your schedule is clear. New appointments will appear here as soon as clients
        reserve a spot.
      </p>
    </div>
  );
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const DesktopRowsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-full grid grid-cols-5 items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-3 w-24" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      ))}
    </>
  );
};

const MobileRowsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="size-8 rounded-md" />
        </div>
      ))}
    </>
  );
};

const PaymentBadge = ({
  status,
  type,
}: {
  status?: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  type?: "deposit" | "full-payment";
}) => {
  if (status !== "completed") {
    return (
      <Badge className="font-medium text-xs bg-muted text-muted-foreground">
        Awaiting payment
      </Badge>
    );
  }

  const isDeposit = type === "deposit";
  return (
    <Badge
      className={cn(
        "font-medium text-xs",
        isDeposit
          ? "bg-amber-400/20 text-amber-600"
          : "bg-primary/10 text-primary",
      )}
    >
      {isDeposit ? "Deposit · balance due" : "Paid in full"}
    </Badge>
  );
};

const BookingActions = ({ bookingId }: { bookingId: Id<"booking"> }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Actions" />}
      >
        <DotsThreeVertical className="size-6 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
         
        >
          <Link href={`/dashboard/bookings/${bookingId}`} className="flex items-center gap-2">
            <Eye className="size-4" />
          View
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
