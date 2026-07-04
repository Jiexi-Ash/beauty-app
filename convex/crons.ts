import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs()

// Verify-before-cancel: at the retry-window boundary, check each stale pending
// payment with Paystack. Paid -> complete; failed/abandoned -> cancel;
// unknown (transient) -> leave pending for the next run.
crons.interval(
  "sweep stale pending payments",
  { minutes: 5 },
  internal.booking.actions.sweepStalePendingPayments,
);

crons.interval(
  "mark completed bookings",
  { minutes: 15 },
  internal.booking.admin.updateCompletedBookings
);

// Promotes businesses to verified once they cross the completed-and-paid
// bookings threshold. Deliberately decoupled from the completion paths above
// — see convex/business/admin.ts for why.
crons.interval(
  "verify eligible businesses",
  { hours: 24 },
  internal.business.admin.verifyEligibleBusinesses,
);

export default crons
