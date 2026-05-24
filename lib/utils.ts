import { TZDate } from "@date-fns/tz";
import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const slugify = (name: string) => {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const formatBookingShortDate = (
  timestamp: number,
  timezone?: string,
) => {
  const zonedDate = timezone
    ? new TZDate(timestamp, timezone)
    : new Date(timestamp);
  return format(zonedDate, "MMM d, p");
};

export const formatBookingDate = (timestamp: number, timezone?: string) => {
  const zonedDate = timezone
    ? new TZDate(timestamp, timezone)
    : new Date(timestamp);
  return format(zonedDate, "MMM d, yyyy");
};

export const formatBookingTime = (timestamp: number, timezone?: string) => {
  const zonedDate = timezone
    ? new TZDate(timestamp, timezone)
    : new Date(timestamp);
  return format(zonedDate, "p"); // e.g. "2:30 PM"
};

export const getInitials = (fullName: string): string => {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
