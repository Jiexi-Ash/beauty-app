"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";

type Period = "week" | "month" | "year";

const PERIOD_DESCRIPTION: Record<Period, string> = {
  week: "This week's daily performance",
  month: "This month's weekly performance",
  year: "This year's monthly performance",
};

const chartConfig = {
  revenue: {
    label: "Revenue",
  },
} satisfies ChartConfig;

function Revenue() {
  const [selectedPeriod, setPeriod] = useState<Period>("month");

  const { data, isLoading } = useQuery({
    ...convexQuery(api.booking.admin.getRevenueData, {
      period: selectedPeriod,
    }),
  });

  const chartData = data ?? [];

  return (
    <div className="flex-1 h-full">
      <Card className="rounded-lg h-full">
        <CardHeader>
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Revenue</CardTitle>
              <CardDescription>
                {PERIOD_DESCRIPTION[selectedPeriod]}
              </CardDescription>
            </div>
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setPeriod(value as Period)}
            >
              <SelectTrigger className="bg-muted capitalize">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectGroup>
                  <SelectItem className="capitalize" value="week">
                    Week
                  </SelectItem>
                  <SelectItem className="capitalize" value="month">
                    Month
                  </SelectItem>
                  <SelectItem className="capitalize" value="year">
                    Year
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4">
          {isLoading ? (
            <Skeleton className="h-full w-full min-h-[200px]" />
          ) : chartData.every((d) => d.revenue === 0) ? (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No revenue for this period yet.
              </p>
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="h-full w-full min-h-[260px]"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 24 }}
              >
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value: string) =>
                    selectedPeriod === "month" ? value : value.slice(0, 3)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      cursor={false}
                      formatter={(value) => `R${Number(value).toFixed(2)}`}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={10}>
                  <LabelList
                    dataKey="revenue"
                    position="top"
                    offset={8}
                    className="fill-foreground"
                    fontSize={10}
                    formatter={(value) =>
                      typeof value === "number" && value > 0 ? `R${value.toFixed(0)}` : ""
                    }
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Revenue;
