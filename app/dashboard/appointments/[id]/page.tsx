import { getAuthToken } from "@/auth";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { preloadQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import BookingDetails from "@/components/dashboard/booking-details";

interface BookingDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params;
  if (!id) notFound();

  const token = await getAuthToken();

  const preloadedBooking = await preloadQuery(
    api.booking.queries.getBookingDetails,
    { bookingId: id as Id<"booking"> },
    { token },
  );

  return <BookingDetails preloadedBooking={preloadedBooking} />;
}

export default BookingDetailsPage;
