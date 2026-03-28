import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "../ui/button";
import { EllipsisVertical } from "lucide-react";

const appointments = [
  {
    _id: 1,
    name: "Zanele Khumalo",
    service: "Wash and Blow",
    time: "Today, 14:00",
    status: "Confirmed",
  },
  {
    _id: 2,
    name: "Thabo Molefe",
    service: "Fade",
    time: "Today, 16:00",
    status: "Confirmed",
  },
];

function UpcomingAppointments() {
  return (
    <Card className="rounded mt-3 mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-bold">Upcoming appointments</CardTitle>
            <CardDescription>
              Your schedule for today and tomorrow
            </CardDescription>
          </div>
          <Link
            href="/dashboard/booking"
            className="uppercase text-primary text-xs font-medium"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((a) => (
          <div key={a._id} className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 bg-accent font-bold h-14 rounded-full border flex items-center justify-center">
                JK
              </div>
              <div className="flex flex-col gap-0.5 ">
                <span className="font-bold">{a.name}</span>
                <div className="text-muted-foreground">
                  <span>{a.service}</span> - <span>{a.time}</span>
                </div>
              </div>
            </div>

            <Button variant="ghost" size="icon">
              <EllipsisVertical className="size-6 text-gray-400" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default UpcomingAppointments;
