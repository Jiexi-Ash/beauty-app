import { CalendarX2 } from "lucide-react";
import Link from "next/link";

export default function BookingNotFound() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-gray-50">
        <CalendarX2 className="size-7 text-gray-400" />
      </div>
      <h1 className="text-lg font-bold">Booking not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This booking doesn&apos;t exist or doesn&apos;t belong to your business.
      </p>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-primary hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
