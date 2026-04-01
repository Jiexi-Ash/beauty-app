"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Bell, PlusIcon, Search } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import AnalyticCards from "./analytics-cards";
import Revenue from "./revenue";
import UpcomingAppointments from "./upcoming-appointments";
import ServiceHighlight from "./service-highlight";

interface DashboardContentProps {
  business: Doc<"business">;
  coverImageUrl: string | null;
}
function DashboardContent({ business, coverImageUrl }: DashboardContentProps) {
  return (
    <div className="min-h-screen w-full">
      <header className="flex w-full justify-between items-center top-0 sticky border-border shadow-sm px-6 z-50 bg-white">
        <div className="flex gap-3 items-center h-20">
          <div className="relative w-12 h-12 rounded-full">
            <Image
              src={coverImageUrl ?? "/salon-image-placeholder"}
              alt={`${business.name} cover image`}
              fill
              className="rounded-full object-cover"
            />
          </div>

          <h1 className="text-base text-primary font-bold">{business.name}</h1>
        </div>

        <div className="flex gap-4 items-center">
          <Bell className="size-6 text-gray-100" fill="#9CA3AF" />
        </div>
      </header>
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="font-bold text-lg">Welcome Back</h1>
          <p className="text-xs text-foreground">
            {"Here's what's been happening"}
          </p>
        </div>
      </div>
      <div className="hidden lg:flex justify-between items-center px-6 py-4">
        <div className="border w-full max-w-[250px] sm:max-w-[320px] flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search className="size-4 text-gray-400 shrink-0" />
          <Input
            placeholder="Search appointments, clients..."
            className="w-full text-sm border-0 shadow-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
        </div>
        <Button
          className="text-sm cursor-pointer hover:bg-primary/70"
          size="lg"
        >
          <PlusIcon className="size-4 text-white" />
          Add New Booking
        </Button>
      </div>
      <div className="w-full px-6 space-y-4 lg:space-y-3">
        <AnalyticCards />
        <div className="flex w-full flex-col gap-3 md:flex-row lg:h-[450px]">
          <Revenue />
          <ServiceHighlight />
        </div>
        <UpcomingAppointments />
      </div>
    </div>
  );
}

export default DashboardContent;
