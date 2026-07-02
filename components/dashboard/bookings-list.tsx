"use client";

import { useState } from "react";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CalendarX, Eye, FunnelSimple, MagnifyingGlass } from "@phosphor-icons/react";
import {
  cn,
  formatBookingDateTime,
  getBookingStatusBadge,
  getInitials,
} from "@/lib/utils";

const PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const PaymentBadge = ({
  status,
  type,
}: {
  status?: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  type?: "deposit" | "full-payment";
}) => {
  if (!status) {
    return (
      <Badge className="bg-muted text-muted-foreground font-medium">
        No payment
      </Badge>
    );
  }

  const isDeposit = type === "deposit";
  const isSettled = status === "completed" && !isDeposit;

  return (
    <Badge
      className={cn(
        "font-medium",
        isSettled
          ? "bg-primary/10 text-primary"
          : status === "completed" && isDeposit
            ? "bg-amber-400/20 text-amber-600"
            : "bg-muted text-muted-foreground",
      )}
    >
      {isSettled
        ? "Paid in full"
        : status === "completed" && isDeposit
          ? "Deposit · balance due"
          : status === "failed"
            ? "Payment failed"
            : "Awaiting payment"}
    </Badge>
  );
};

function BookingsList({
  preloadedBookings,
}: {
  preloadedBookings: Preloaded<typeof api.business.admin.getAllBookings>;
}) {
  const bookings = usePreloadedQuery(preloadedBookings);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [page, setPage] = useState(0);

  const term = search.trim().toLowerCase();

  const filtered = bookings.filter((b) => {
    const matchesStatus =
      status === "all"
        ? true
        : status === "cancelled"
          ? b.status.startsWith("cancelled")
          : b.status === status;

    if (!matchesStatus) return false;
    if (!term) return true;

    return [b.client.name, b.service.name]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(term));
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const onStatusChange = (value: string | null) => {
    if (!value) return;
    setStatus(value as (typeof STATUS_FILTERS)[number]["value"]);
    setPage(0);
  };

  return (
    <div className="w-full px-6 py-6 2xl:mx-auto 2xl:max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold md:text-3xl">
            Bookings
          </h1>
          <p className="text-sm text-muted-foreground">
            Every booking made with your business, past and upcoming.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2 sm:w-[280px] focus-within:ring-1 focus-within:ring-primary">
            <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search client or service..."
              className="h-auto w-full border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 w-full bg-muted sm:w-[170px]">
              <FunnelSimple className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 flex flex-col gap-3 lg:hidden">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <CalendarX className="size-6 text-muted-foreground" />
            </div>
            {bookings.length === 0
              ? "No bookings yet. They'll appear here once clients book."
              : "No bookings match your filters."}
          </div>
        ) : (
          visible.map((booking) => {
            const statusBadge = getBookingStatusBadge(booking.status);
            return (
              <Link
                key={booking._id}
                href={`/dashboard/bookings/${booking._id}`}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage
                      src={booking.client.avatar}
                      alt={booking.client.name ?? "Client"}
                    />
                    <AvatarFallback>
                      {getInitials(booking.client.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{booking.client.name}</p>
                    <p className="truncate text-xs capitalize text-muted-foreground">
                      {booking.service.name}
                    </p>
                  </div>
                  <Eye className="size-5 shrink-0 text-muted-foreground" />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs font-semibold">
                    {formatBookingDateTime(
                      booking.bookingStartDate,
                      booking.business.timezone,
                    )}
                  </span>
                  <Badge className={cn("font-medium", statusBadge.className)}>
                    {statusBadge.label}
                  </Badge>
                </div>

                <div className="mt-2">
                  <PaymentBadge
                    status={booking.payment?.status}
                    type={booking.payment?.type}
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Table */}
      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border lg:block">
        <Table className="border-collapse">
          <TableHeader className="bg-muted [&_tr]:border-0">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                CLIENT
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                SERVICE
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                DATE &amp; TIME
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                PAYMENT
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                STATUS
              </TableHead>
              <TableHead className="h-auto w-12 bg-muted px-6 py-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <CalendarX className="size-6 text-muted-foreground" />
                    </div>
                    {bookings.length === 0
                      ? "No bookings yet. They'll appear here once clients book."
                      : "No bookings match your filters."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((booking) => {
                const statusBadge = getBookingStatusBadge(booking.status);
                return (
                  <TableRow
                    key={booking._id}
                    className="group border-b border-border hover:bg-transparent last:border-b-0"
                  >
                    <TableCell className="p-6">
                      <div className="flex items-center gap-3">
                        <Avatar size="lg">
                          <AvatarImage
                            src={booking.client.avatar}
                            alt={booking.client.name ?? "Client"}
                          />
                          <AvatarFallback>
                            {getInitials(booking.client.name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold">{booking.client.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {booking.client.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6 text-sm capitalize text-muted-foreground">
                      {booking.service.name}
                    </TableCell>
                    <TableCell className="p-6 text-sm font-semibold">
                      {formatBookingDateTime(
                        booking.bookingStartDate,
                        booking.business.timezone,
                      )}
                    </TableCell>
                    <TableCell className="p-6">
                      <PaymentBadge
                        status={booking.payment?.status}
                        type={booking.payment?.type}
                      />
                    </TableCell>
                    <TableCell className="p-6">
                      <Badge className={cn("font-medium", statusBadge.className)}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6">
                      <Link href={`/dashboard/bookings/${booking._id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View booking"
                          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Eye className="size-5 text-muted-foreground" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "No bookings"
            : `Showing ${start + 1} to ${start + visible.length} of ${filtered.length} bookings`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookingsList;
