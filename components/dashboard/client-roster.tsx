"use client";

import { useState } from "react";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DotsThreeVertical, FunnelSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { getInitials } from "@/lib/utils";

const PAGE_SIZE = 8;

const formatRevenue = (rands: number) =>
  `R ${Math.round(rands).toLocaleString("en-ZA")}`;

function ClientRoster({
  preloadedClients,
}: {
  preloadedClients: Preloaded<typeof api.business.admin.getClients>;
}) {
  const clients = usePreloadedQuery(preloadedClients);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? clients.filter((c) =>
        [c.name, c.email, c.phone]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(term)),
      )
    : clients;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <div className="w-full px-6 py-6 2xl:mx-auto 2xl:max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold md:text-3xl">Client Roster</h1>
          <p className="text-sm text-muted-foreground">
            Manage your community and track relationships.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="group flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2 sm:w-[280px] focus-within:ring-1 focus-within:ring-primary">
            <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search clients..."
              className="h-auto w-full border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button variant="secondary" size="lg" className="h-10 gap-2">
            <FunnelSimple className="size-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-6 flex flex-col gap-3 lg:hidden">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
            {clients.length === 0
              ? "No clients yet. They'll appear here once they book."
              : "No clients match your search."}
          </p>
        ) : (
          visible.map((client) => (
            <div
              key={client._id}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={client.image ?? undefined} alt={client.name} />
                  <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{client.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {client.email ?? "No email"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Client actions"
                  className="shrink-0"
                >
                  <DotsThreeVertical className="size-5 text-muted-foreground" />
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Bookings</p>
                  <p className="text-sm font-semibold">{client.totalBookings}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Revenue</p>
                  <p className="text-sm font-semibold">{formatRevenue(client.revenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Last visit</p>
                  <p className="text-sm font-semibold">
                    {client.lastVisit
                      ? formatDistanceToNow(client.lastVisit, { addSuffix: true })
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table */}
      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border lg:block">
        <Table className="border-collapse">
          <TableHeader className="bg-muted [&_tr]:border-0">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                NAME &amp; PROFILE
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                EMAIL
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                PHONE
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                TOTAL BOOKINGS
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                TOTAL REVENUE
              </TableHead>
              <TableHead className="h-auto bg-muted px-6 py-4 text-xs font-semibold text-muted-foreground">
                LAST VISIT
              </TableHead>
              <TableHead className="h-auto w-12 bg-muted px-6 py-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {clients.length === 0
                    ? "No clients yet. They'll appear here once they book."
                    : "No clients match your search."}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((client) => (
                <TableRow
                  key={client._id}
                  className="group border-b border-border hover:bg-transparent last:border-b-0"
                >
                  <TableCell className="p-6">
                    <div className="flex items-center gap-3">
                      <Avatar size="lg">
                        <AvatarImage
                          src={client.image ?? undefined}
                          alt={client.name}
                        />
                        <AvatarFallback>
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold">{client.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate p-6 text-sm text-muted-foreground">
                    {client.email ?? "—"}
                  </TableCell>
                  <TableCell className="p-6 text-sm text-muted-foreground">
                    {client.phone ?? "—"}
                  </TableCell>
                  <TableCell className="p-6 text-sm font-semibold">
                    {client.totalBookings}
                  </TableCell>
                  <TableCell className="p-6 text-sm font-semibold">
                    {formatRevenue(client.revenue)}
                  </TableCell>
                  <TableCell className="p-6 text-sm text-muted-foreground">
                    {client.lastVisit
                      ? formatDistanceToNow(client.lastVisit, {
                          addSuffix: true,
                        })
                      : "No visits yet"}
                  </TableCell>
                  <TableCell className="p-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Client actions"
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <DotsThreeVertical className="size-5 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "No clients"
            : `Showing ${start + 1} to ${start + visible.length} of ${filtered.length} clients`}
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

export default ClientRoster;
