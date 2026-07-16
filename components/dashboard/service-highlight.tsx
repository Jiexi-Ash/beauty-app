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
import { WidgetError } from "./widget-error";

function ServiceHighlight() {
  const { data, isLoading, isError, refetch } = useQuery({
    ...convexQuery(api.business.admin.getServiceHighlights, {}),
  });

  const services = data?.services ?? [];
  const topService = services[0];

  return (
    <Card className="lg:w-[300px]">
      <CardHeader>
        <CardTitle className="font-bold">Service Highlight</CardTitle>
        <CardDescription className="text-xs">
          {isError ? (
            "Couldn't load your service highlights."
          ) : isLoading ? (
            <Skeleton className="h-3 w-48" />
          ) : topService ? (
            `${topService.name} is your top performing service this month with ${topService.count} ${topService.count === 1 ? "appointment" : "appointments"}`
          ) : (
            "No appointments yet this month. Your top services will show up here."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        <div className="flex-1 space-y-2">
          {isError ? (
            <WidgetError
              message="Couldn't load service highlights."
              onRetry={() => refetch()}
              className="min-h-[120px] py-0"
            />
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted flex items-center justify-between p-2 rounded-lg"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))
          ) : services.length === 0 ? (
            <div className="flex h-full min-h-[120px] items-center justify-center">
              <p className="text-muted-foreground text-xs text-center">
                No services have been booked this month yet.
              </p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.serviceId}
                className="bg-muted flex items-center justify-between p-2 rounded-lg"
              >
                <span className="font-medium capitalize">
                  {service.name}
                </span>
                <Badge className="bg-primary/10 text-primary">
                  {service.count} {service.count === 1 ? "Appointment" : "Appointments"}
                </Badge>
              </div>
            ))
          )}
        </div>

        <div className="mt-4">
          <Button className="w-full cursor-pointer" size="lg">
            <Link href="/dashboard/services">Manage services</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ServiceHighlight;
