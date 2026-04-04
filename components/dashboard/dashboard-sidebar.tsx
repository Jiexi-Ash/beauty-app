"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  LayoutGrid,
  LucideIcon,
  Plus,
  Scissors,
  User2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navlinks = [
  { href: "/dashboard", label: "overview", icon: LayoutGrid },
  { href: "/dashboard/bookings", label: "booking", icon: CalendarDays },
  { href: "/dashboard/services", label: "services", icon: Scissors },
  { href: "/dashboard/clients", label: "clients", icon: Users },
];
function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className="pl-3 py-3">
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="font-extrabold text-2xl select-none"
            >
              The <span className="text-primary">Beauty</span> App
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-4 gap-1">
          {navlinks.map((link) => (
            <MenuItem
              key={link.label}
              Icon={link.icon}
              href={link.href}
              label={link.label}
              isActive={pathname.includes(link.href)}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User2 /> Username
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default DashboardSidebar;

const MenuItem = ({
  label,
  Icon,
  href,
  isActive,
}: {
  label: string;
  href: string;
  Icon: LucideIcon;
  isActive: boolean;
}) => {
  return (
    <SidebarMenuItem key={label}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary duration-200 ease-in-out text-sm",
          isActive ? "text-primary font-semibold" : "text-foreground  ",
        )}
      >
        <Icon className="size-5" />
        <span className="capitalize">{label}</span>
      </Link>
    </SidebarMenuItem>
  );
};
