"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Banknote, CalendarCheck, Star, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";

function AnalyticCards() {
  const {
        data,
        isLoading,
        error,
        refetch,
      } = useQuery({
        ...convexQuery(api.business.admin.getDashboardAnalytics),
      });
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card className="w-full flex flex-col bg-white px-4 rounded-lg">
        <CardTitle>
          <div className="flex justify-between items-center">
            <Banknote className="text-primary" />
            {/* <Badge className="text-[10px] bg-green-400/25 text-green-400 font-bold">
              +12.5%
            </Badge> */}
          </div>
        </CardTitle>
        <CardContent className="p-0">
          <h2 className="text-xs text-gray-400 font-bold">Total Revenue</h2>
          <h3 className="text-lg font-bold">R{data?.revenue.toFixed(2) ?? 0}</h3>
          <span className="text-[8px] text-gray-400 uppercase">This month</span>
        </CardContent>
      </Card>
      <Card className="w-full flex flex-col bg-white px-4 rounded-lg">
        <CardTitle>
          <div className="flex justify-between items-center">
            <CalendarCheck className="text-primary" />
            {/* <Badge className="text-[10px] bg-green-400/25 text-green-400 font-bold">
              +8
            </Badge> */}
          </div>
        </CardTitle>
        <CardContent className="p-0">
          <h2 className="text-xs text-gray-400 font-bold">Total Bookings</h2>
          <h3 className="text-lg font-bold">{data?.totalBookings ?? 0}</h3>
          <span className="text-[8px] text-gray-400 uppercase">This month</span>
        </CardContent>
      </Card>
      <Card className="w-full flex flex-col bg-white px-4 rounded-lg">
        <CardTitle>
          <div className="flex justify-between items-center">
            <UserPlus className="text-primary" />
            {/* <Badge className="text-[10px] bg-green-400/25 text-green-400 font-bold">
              +5
            </Badge> */}
          </div>
        </CardTitle>
        <CardContent className="p-0">
          <h2 className="text-xs text-gray-400 font-bold">Client Growth</h2>
          <h3 className="text-lg font-bold">{data?.uniqueClients ?? 0}</h3>
          <span className="text-[8px] text-gray-400 uppercase">This Month</span>
        </CardContent>
      </Card>
      <Card className="w-full flex flex-col bg-white px-4 rounded-lg">
        <CardTitle>
          <div className="flex justify-between items-center">
            <Star className="text-yellow-400" fill="#FFC107" />
          </div>
        </CardTitle>
        <CardContent className="p-0">
          <h2 className="text-xs text-gray-400 font-bold">Average Rating</h2>
          <h3 className="text-lg font-bold">{data?.reviews.averageReviews ?? 0}</h3>
          <span className="text-[8px] text-gray-400 uppercase">{data?.reviews.count ?? 0} reviews</span>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticCards;
