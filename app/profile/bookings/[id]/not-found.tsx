"use client";

import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { CalendarX } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

function BookingNotFound() {
  return (
    <div className="w-full min-h-screen relative">
      <Navbar />

      <div className="absolute inset-0 z-0">
        <Image
          src="/salon-image-placeholder.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-12">
        <h1 className="text-5xl font-bold text-gray-900 text-center mb-3">
          Booking not found.
        </h1>
        <p className="text-gray-600 text-center max-w-sm mb-10">
         {" This booking doesn't exist or you don't have access to it."}
        </p>

        <Card className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-white/60 w-full max-w-sm text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <CalendarX className="size-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            The link may be incorrect or the booking may have been removed.
            Head to your bookings to see your appointments.
          </p>
          <Button
            className="w-full rounded-sm font-semibold py-3 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Link href="profile/bookings">View My Bookings</Link>
          </Button>
        </Card>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export default BookingNotFound;