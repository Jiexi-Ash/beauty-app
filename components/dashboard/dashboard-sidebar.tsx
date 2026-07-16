"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import {
  Broadcast,
  CalendarDots,
  GearSix,
  type Icon,
  Scissors,
  SignOut,
  SquaresFour,
  UsersThree,
} from "@phosphor-icons/react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

const navlinks = [
  { href: "/dashboard", label: "overview", icon: SquaresFour },
  { href: "/dashboard/appointments", label: "appointments", icon: CalendarDots },
  { href: "/dashboard/services", label: "services", icon: Scissors },
  { href: "/dashboard/clients", label: "clients", icon: UsersThree },
  { href: "/dashboard/settings", label: "settings", icon: GearSix },
];

function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { data: business } = useQuery({
    ...convexQuery(api.business.admin.getUserBusiness, {}),
  });

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
    <Sidebar className="border-border/60">
      <SidebarHeader>
        <SidebarMenu className="pl-2 py-3">
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="flex items-center gap-0.5 text-xl font-bold tracking-tight select-none px-2"
            >
              <span className="text-foreground">The</span>
              <span className="text-primary">Beauty</span>
              <span className="text-foreground">App</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-3 gap-1">
          {navlinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <MenuItem
                key={link.label}
                Icon={link.icon}
                href={link.href}
                label={link.label}
                isActive={isActive}
              />
            );
          })}
        </SidebarMenu>

        {business && business.visibility === "offline" && (
          <div className="px-3 mt-2">
            <button
              type="button"
              onClick={() => goLive({ visibility: "visible" })}
              disabled={isGoingLive}
              className="flex w-full items-center gap-2.5 rounded-full bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              <Broadcast className="size-5" weight="fill" />
              {isGoingLive ? "Going live…" : "Go Live"}
            </button>
            <p className="px-3 pt-1.5 text-xs text-muted-foreground">
              You&apos;re not visible to clients yet.
            </p>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2.5 rounded-xl p-2">
            <Link
              href="/dashboard/settings"
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <Avatar size="sm">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
                <AvatarFallback>
                  {getInitials(user?.fullName ?? "")}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium text-foreground">
                {user?.fullName ?? "Your account"}
              </span>
            </Link>
            <SignOutButton>
              <button
                aria-label="Sign out"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <SignOut className="size-4" />
              </button>
            </SignOutButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default DashboardSidebar;

const MenuItem = ({
  label,
  Icon: LinkIcon,
  href,
  isActive,
}: {
  label: string;
  href: string;
  Icon: Icon;
  isActive: boolean;
}) => {
  return (
    <SidebarMenuItem key={label}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors duration-200 text-sm",
          isActive
            ? "bg-primary/8 text-primary font-semibold"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <LinkIcon className="size-5" weight={isActive ? "fill" : "regular"} />
        <span className="capitalize">{label}</span>
      </Link>
    </SidebarMenuItem>
  );
};
