"use client";

import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import AnalyticCards from "./analytics-cards";
import Revenue from "./revenue";
import UpcomingAppointments from "./upcoming-appointments";
import ServiceHighlight from "./service-highlight";

function DashboardContent() {
  return (
    <div className="w-full">
      <div className="w-full 2xl:max-w-[1600px] 2xl:mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center px-6 py-4">
        <div className="flex flex-col gap-3 lg:gap-0 lg:items-center lg:flex-row lg:justify-between">
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-xl md:text-2xl">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              {"Here's what's been happening lately."}
            </p>
          </div>

        </div>
      </div>
      <div className="flex gap-3 justify-between items-center px-6 py-4">
        <div className="bg-muted flex-1 lg:flex-none lg:w-full lg:max-w-[350px] flex items-center gap-2 pl-3 pr-2 py-3 rounded-lg transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <MagnifyingGlass className="size-4 text-muted-foreground shrink-0" />
          <Input
            autoComplete="none"
            placeholder="Search appointments, clients..."
            className="w-full text-sm border-0 shadow-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground"
          />
        </div>
        <Button className="text-sm cursor-pointer h-10 shrink-0" size="lg">
          <Plus className="size-4" />
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
