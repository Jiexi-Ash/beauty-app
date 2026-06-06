import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";



const crons = cronJobs()

crons.interval(
    "cancel stale pending bookings", {
        minutes: 15,
    },
    internal.booking.admin.cancelStalePendingBookings
)

crons.interval(
  "mark completed bookings",
  { minutes: 15 },
  internal.booking.admin.updateCompletedBookings
);

export default crons