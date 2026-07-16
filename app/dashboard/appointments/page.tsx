import { getAuthToken } from "@/auth";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import BookingsList from "@/components/dashboard/bookings-list";

async function BookingsPage() {
  const token = await getAuthToken();

  const preloadedBookings = await preloadQuery(
    api.business.admin.getAllBookings,
    {},
    { token },
  );

  return <BookingsList preloadedBookings={preloadedBookings} />;
}

export default BookingsPage;
