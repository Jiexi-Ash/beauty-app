"use client";

import { PlusIcon, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import AnalyticCards from "./analytics-cards";
import Revenue from "./revenue";
import UpcomingAppointments from "./upcoming-appointments";
import ServiceHighlight from "./service-highlight";

function DashboardContent() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full 2xl:max-w-[1600px] 2xl:mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center px-6 py-4">
        <div className="flex flex-col gap-3 lg:gap-0 lg:items-center lg:flex-row lg:justify-between">
          <div className="flex flex-col">
            <h1 className="font-bold text-xl md:text-2xl">Welcome Back</h1>
            <p className="text-sm text-gray-400">
              {"Here's what's been happening lately."}
            </p>
          </div>

        </div>
      </div>
      <div className="flex gap-3 justify-between items-center px-6 py-4">
        <div className="bg-gray-100 flex-1 lg:flex-none lg:w-full lg:max-w-[350px] flex items-center gap-2 pl-3 pr-2 py-3 rounded-lg transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search className="size-4 text-gray-400 shrink-0" />
          <Input
            autoComplete="none"
            placeholder="Search appointments, clients..."
            className="w-full text-sm border-0 shadow-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-gray-500"
          />
        </div>
        <Button
          className="text-sm cursor-pointer hover:bg-primary/70 h-10 shrink-0"
          size="lg"
        >
          <PlusIcon className="size-4 text-white" />
          <span className="hidden lg:inline">Add New Booking</span>
          <span className="sr-only lg:hidden">Add new booking</span>
        </Button>
      </div>
      <div className="w-full px-6 space-y-4 lg:space-y-4">
        <AnalyticCards />
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:h-[450px]">
          <Revenue />
          <ServiceHighlight />
        </div>
        <UpcomingAppointments />
      </div>
      </div>
    </div>
  );
}

export default DashboardContent;
