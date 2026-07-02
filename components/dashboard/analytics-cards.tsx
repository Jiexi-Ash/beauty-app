"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Money, Star, UserPlus } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { ReactNode } from "react";

function AnalyticCards() {
  const { data, isLoading } = useQuery({
    ...convexQuery(api.business.admin.getDashboardAnalytics, {}),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const revenue = data?.revenue ?? 0;
  const totalBookings = data?.totalBookings ?? 0;
  const uniqueClients = data?.uniqueClients ?? 0;
  const averageRating = data?.reviews.averageReviews ?? 0;
  const reviewCount = data?.reviews.count ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Money className="text-primary" />}
        label="Total Revenue"
        value={`R${revenue.toLocaleString("en-ZA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        caption="This month"
      />
      <StatCard
        icon={<CalendarCheck className="text-primary" />}
        label="Total Bookings"
        value={totalBookings.toString()}
        caption="This month"
      />
      <StatCard
        icon={<UserPlus className="text-primary" />}
        label="Unique Clients"
        value={uniqueClients.toString()}
        caption="This month"
      />
      <StatCard
        icon={<Star className="text-amber-500" weight="fill" />}
        label="Average Rating"
        value={averageRating.toFixed(1)}
        caption={`${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`}
      />
    </div>
  );
}

export default AnalyticCards;

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  caption: string;
}

const StatCard = ({ icon, label, value, caption }: StatCardProps) => {
  return (
    <Card className="w-full flex flex-col px-4 rounded-lg">
      <CardTitle>
        <div className="flex justify-between items-center">{icon}</div>
      </CardTitle>
      <CardContent className="p-0">
        <h2 className="text-xs text-muted-foreground font-bold">{label}</h2>
        <h3 className="text-lg font-bold">{value}</h3>
        <span className="text-[8px] text-muted-foreground uppercase">{caption}</span>
      </CardContent>
    </Card>
  );
};

const StatCardSkeleton = () => {
  return (
    <Card className="w-full flex flex-col px-4 rounded-lg">
      <CardTitle>
        <div className="flex justify-between items-center">
          <Skeleton className="size-6 rounded-md" />
        </div>
      </CardTitle>
      <CardContent className="p-0 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-2 w-12" />
      </CardContent>
    </Card>
  );
};
