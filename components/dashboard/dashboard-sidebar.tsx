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
            <Link href="/dashboard" className="font-medium">
              The <span className="text-primary">Beauty</span> App
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
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
      <SidebarMenuButton>
        <Link
          href={href}
          className={cn(
            "flex items-center gap-3",
            isActive ? "text-primary" : "text-foreground",
          )}
        >
          <Icon className="size-4" />
          <span className="capitalize">{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
