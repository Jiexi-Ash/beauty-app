"use client";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  LayoutGrid,
  type LucideIcon,
  Scissors,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navlinks = [
  { href: "/dashboard", label: "OVERVIEW", icon: LayoutGrid },
  { href: "/dashboard/bookings", label: "BOOKING", icon: CalendarDays },
  { href: "/dashboard/services", label: "SERVICES", icon: Scissors },
  { href: "/dashboard/clients", label: "CLIENTS", icon: Users },
];
function DashboardFooter() {
  const pathname = usePathname();
  return (
    <footer className="sticky bottom-0 lg:hidden bg-white z-50  border-t border-b border-border grid grid-cols-4 gap-4 px-6">
      {navlinks.map((link) => (
        <Navlink
          key={link.label}
          Icon={link.icon}
          label={link.label}
          href={link.href}
          isActive={pathname.includes(link.href)}
        />
      ))}
    </footer>
  );
}

export default DashboardFooter;

const Navlink = ({
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
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-1 py-4 px-4  items-center",
        isActive ? "text-primary " : "text-gray-500",
      )}
    >
      <Icon className="size-6" strokeWidth={1.5} />
      <span className="text-[10px] md:text-sm font-semibold">{label}</span>
    </Link>
  );
};
