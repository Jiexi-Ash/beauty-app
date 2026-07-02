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

const navlinks = [
  { href: "/dashboard", label: "overview", icon: SquaresFour },
  { href: "/dashboard/bookings", label: "booking", icon: CalendarDots },
  { href: "/dashboard/services", label: "services", icon: Scissors },
  { href: "/dashboard/clients", label: "clients", icon: UsersThree },
  { href: "/dashboard/settings", label: "settings", icon: GearSix },
];

function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

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
