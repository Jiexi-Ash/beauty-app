"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";

function ServiceHighlight() {
  const { data, isLoading } = useQuery({
    ...convexQuery(api.business.admin.getServiceHighlights, {}),
  });

  const services = data?.services ?? [];
  const topService = services[0];

  return (
    <Card className="rounded-lg lg:w-[300px] bg-primary">
      <CardHeader>
        <CardTitle className="text-primary-foreground font-bold">
          Service Highlight
        </CardTitle>
        <CardDescription className="text-muted text-xs">
          {isLoading ? (
            <Skeleton className="h-3 w-48 bg-white/25" />
          ) : topService ? (
            `${topService.name} is your top performing service this month with ${topService.count} ${topService.count === 1 ? "booking" : "bookings"}`
          ) : (
            "No bookings yet this month. Your top services will show up here."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        <div className="flex-1 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/25 flex items-center justify-between p-2 rounded-lg"
              >
                <Skeleton className="h-4 w-24 bg-white/40" />
                <Skeleton className="h-5 w-20 rounded-full bg-white/40" />
              </div>
            ))
          ) : services.length === 0 ? (
            <div className="flex h-full min-h-[120px] items-center justify-center">
              <p className="text-muted text-xs text-center">
                No services have been booked this month yet.
              </p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.serviceId}
                className="bg-white/25 flex items-center justify-between p-2 rounded-lg"
              >
                <span className="text-muted font-medium capitalize">
                  {service.name}
                </span>
                <Badge className="bg-primary">
                  {service.count} {service.count === 1 ? "Booking" : "Bookings"}
                </Badge>
              </div>
            ))
          )}
        </div>

        <div className="mt-4">
          <Button
         
            className="bg-primary-foreground text-primary w-full cursor-pointer"
            size="lg"
          >
            <Link href="/dashboard/services">
            Manage services
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ServiceHighlight;
