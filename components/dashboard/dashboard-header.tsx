"use client";

import { Broadcast, SignOut } from "@phosphor-icons/react";
import Image from "next/image";
import NotificationBell from "./notification-bell";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

function DashboardHeader() {
  const { data: business, isLoading } = useQuery({
    ...convexQuery(api.business.admin.getUserBusiness, {}),
  });
  const { user } = useUser();

  const { mutate: goLive, isPending: isGoingLive } = useMutation({
    mutationFn: useConvexMutation(api.business.admin.toggleBusinessVisibilty),
    onSuccess: () => {
      toast.success("You're live!", {
        description: "Clients can now find and book your salon.",
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof ConvexError && typeof error.data === "string"
          ? error.data
          : "Could not go live. Try again.",
      );
    },
  });

  return (
    <header className="top-0 sticky border-b border-border shadow-sm px-4 md:px-6 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex w-full justify-between items-center 2xl:max-w-[1600px] 2xl:mx-auto">
        <div className="flex gap-3 items-center h-20">
          {isLoading ? (
            <>
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : business ? (
            <>
              <div className="relative w-12 h-12 rounded-full">
                <Image
                  src={business.coverImageUrl ?? "/salon-image-placeholder.jpg"}
                  alt={`${business.name} cover image`}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <h1 className="text-base text-foreground font-bold">
                {business.name}
              </h1>
            </>
          ) : null}
        </div>

        <div className="flex gap-2 items-center">
          {business && business.visibility === "offline" && (
            <button
              type="button"
              onClick={() => goLive({ visibility: "visible" })}
              disabled={isGoingLive}
              aria-label="Go live"
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer lg:hidden"
            >
              <Broadcast className="size-3.5" weight="fill" />
              {isGoingLive ? "Going live…" : "Go Live"}
            </button>
          )}

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="flex size-9 items-center justify-center rounded-full transition-colors duration-200 hover:ring-2 hover:ring-muted cursor-pointer lg:hidden"
            >
              <Avatar size="sm">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
                <AvatarFallback>
                  {getInitials(user?.fullName ?? "")}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate">
                  {user?.fullName ?? "Your account"}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                Settings
              </DropdownMenuItem>
              <SignOutButton>
                <DropdownMenuItem variant="destructive">
                  <SignOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </SignOutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
