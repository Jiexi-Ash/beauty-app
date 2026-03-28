"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis } from "recharts";
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
import { useState } from "react";

const chartData = [
  { month: "January", revenue: 8400 },
  { month: "February", revenue: 7600 },
  { month: "March", revenue: 11200 },
  { month: "April", revenue: 13500 },
  { month: "May", revenue: 9800 },
  { month: "June", revenue: 15000 },
  { month: "July", revenue: 15000 },
  { month: "August", revenue: 9000 },
  { month: "September", revenue: 7000 },
  { month: "October", revenue: 10000 },
  { month: "Novermber", revenue: 20000 },
  { month: "December", revenue: 5000 },
];

type Period = "Week" | "Month" | "Year";
const chartConfig = {
  revenue: {
    label: "Revenue",
  },
} satisfies ChartConfig;

function Revenue() {
  const [selectedPeriod, setPeriod] = useState<Period>("Month");
  return (
    <div className="flex-1 h-full">
      <Card className="rounded-lg h-full">
        <CardHeader>
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Last 7 days performance</CardDescription>
            </div>
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setPeriod(value as Period)}
            >
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectGroup>
                  <SelectItem className="capitalize" value="Week">
                    Week
                  </SelectItem>
                  <SelectItem className="capitalize" value="Month">
                    Month
                  </SelectItem>
                  <SelectItem className="capitalize" value="Year">
                    Year
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={chartData}>
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `R${Number(value).toFixed(2)}`}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--primary)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default Revenue;
