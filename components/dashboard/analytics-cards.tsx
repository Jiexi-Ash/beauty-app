"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Money, Star, UserPlus } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { cn, formatZarFromRands } from "@/lib/utils";
import { ReactNode } from "react";
import { WidgetError } from "./widget-error";

function AnalyticCards() {
  const { data, isLoading, isError, refetch } = useQuery({
    ...convexQuery(api.business.admin.getDashboardAnalytics, {}),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} emphasize={i === 0} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <WidgetError
          message="Couldn't load your stats."
          onRetry={() => refetch()}
        />
      </Card>
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
        icon={<Money className="text-primary-foreground" />}
        label="Processed Revenue"
        value={formatZarFromRands(revenue)}
        caption="This month"
        emphasize
      />
      <StatCard
        icon={<CalendarCheck className="text-muted-foreground" />}
        label="Total Appointments"
        value={totalBookings.toString()}
        caption="This month"
      />
      <StatCard
        icon={<UserPlus className="text-muted-foreground" />}
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
  emphasize?: boolean;
}

const StatCard = ({ icon, label, value, caption, emphasize }: StatCardProps) => {
  return (
    <Card className={cn("w-full flex flex-col px-4", emphasize && "bg-primary")}>
      <CardTitle>
        <div className="flex justify-between items-center">{icon}</div>
      </CardTitle>
      <CardContent className="p-0">
        <h2
          className={cn(
            "text-xs font-bold",
            emphasize ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {label}
        </h2>
        <h3
          className={cn(
            "text-lg font-bold",
            emphasize ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {value}
        </h3>
        <span
          className={cn(
            "text-xs uppercase",
            emphasize ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {caption}
        </span>
      </CardContent>
    </Card>
  );
};

const StatCardSkeleton = ({ emphasize }: { emphasize?: boolean }) => {
  return (
    <Card className={cn("w-full flex flex-col px-4", emphasize && "bg-primary")}>
      <CardTitle>
        <div className="flex justify-between items-center">
          <Skeleton className={cn("size-6 rounded-md", emphasize && "bg-primary-foreground/20")} />
        </div>
      </CardTitle>
      <CardContent className="p-0 space-y-2">
        <Skeleton className={cn("h-3 w-20", emphasize && "bg-primary-foreground/20")} />
        <Skeleton className={cn("h-5 w-16", emphasize && "bg-primary-foreground/20")} />
        <Skeleton className={cn("h-2 w-12", emphasize && "bg-primary-foreground/20")} />
      </CardContent>
    </Card>
  );
};
