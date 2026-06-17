"use client";

import { Bell } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "../ui/skeleton";

function DashboardHeader() {
  const { data: business, isLoading } = useQuery({
    ...convexQuery(api.business.admin.getUserBusiness, {}),
  });

  return (
    <header className="top-0 sticky lg:border-b border-border shadow-sm px-6 z-50 bg-white">
      <div className="flex w-full justify-between items-center 2xl:max-w-[1600px] 2xl:mx-auto">
        <div className="flex gap-3 items-center h-20">
          {isLoading ? (
            <>
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : business ? (
            <>
              <div className="relative w-12 h-12 rounded-full">
                <Image
                  src={business.coverImageUrl ?? "/salon-image-placeholder.jpg"}
                  alt={`${business.name} cover image`}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <h1 className="text-base text-primary font-bold">
                {business.name}
              </h1>
            </>
          ) : null}
        </div>

        <div className="flex gap-4 items-center">
          <Bell className="size-6 text-gray-100" fill="#9CA3AF" />
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
