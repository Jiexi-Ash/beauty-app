"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  ClockCounterClockwise,
  CheckCircle,
  type IconProps,
} from "@phosphor-icons/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Doc } from "@/convex/_generated/dataModel";
import type { ForwardRefExoticComponent } from "react";

const NOTIFICATION_ICON: Record<
  Doc<"notifications">["type"],
  ForwardRefExoticComponent<IconProps>
> = {
  booking_created: CalendarCheck,
  booking_auto_completed: CheckCircle,
  booking_rescheduled: ClockCounterClockwise,
  booking_cancelled: CalendarX,
};

function NotificationBell() {
  const { data: notifications } = useQuery({
    ...convexQuery(api.notifications.admin.getNotificationsForBusiness, {}),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: useConvexMutation(api.notifications.admin.markNotificationRead),
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: useConvexMutation(api.notifications.admin.markAllNotificationsRead),
  });

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;
  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const latest = notifications[0];

    // Skip the toast on first load; only fire for arrivals after mount.
    if (lastSeenIdRef.current === null) {
      lastSeenIdRef.current = latest._id;
      return;
    }

    if (latest._id !== lastSeenIdRef.current) {
      lastSeenIdRef.current = latest._id;
      const Icon = NOTIFICATION_ICON[latest.type];
      toast(latest.message, { icon: <Icon className="size-4" /> });
    }
  }, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground cursor-pointer"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
            Notifications
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead({})}
              className="cursor-pointer text-xs font-medium text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        {!notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Bell className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = NOTIFICATION_ICON[notification.type];
              return (
                <DropdownMenuItem
                  key={notification._id}
                  className={cn(
                    "flex items-start gap-2.5 rounded-none px-3 py-2.5",
                    !notification.read && "bg-primary/5",
                  )}
                  {...(notification.bookingId
                    ? { render: <Link href={`/dashboard/bookings/${notification.bookingId}`} /> }
                    : {})}
                  onClick={() => {
                    if (!notification.read)
                      markRead({ notificationId: notification._id });
                  }}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm leading-snug text-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notification._creationTime, { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
