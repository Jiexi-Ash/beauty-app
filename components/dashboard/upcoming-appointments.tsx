import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "../ui/button";
import { DotIcon, EllipsisVertical } from "lucide-react";
import { Avatar } from "../ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

const appointments = [
  {
    _id: 1,
    name: "Zanele Khumalo",
    cellNumber: "081 332 6756",
    service: "Wash and Blow",
    paymentType: "Deposit",
    duration: "2 hrs",
    time: "Today, 14:00",
    status: "Confirmed",
  },
  {
    _id: 2,
    name: "Thabo Molefe",
    cellNumber: "081 553 6756",
    service: "Fade",
    paymentType: "Full",
    duration: "1 hr",
    time: "Today, 16:00",
    status: "Confirmed",
  },
  {
    _id: 3,
    name: "Thembi Mbatha",
    cellNumber: "073 555 3490",
    service: "box Braids",
    paymentType: "Deposit",
    duration: "4 hrs",
    time: "Today, 12:00",
    status: "Confirmed",
  },
];

function UpcomingAppointments() {
  return (
    <div className="mb-6">
      <AppointmentsMobile />
      <AppointmentsDesktop />
    </div>
  );
}

export default UpcomingAppointments;

const AppointmentsDesktop = () => {
  return (
    <Card className="hidden sm:block">
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
        <div className="w-full grid grid-cols-6 bg-gray-50 py-3 px-2 rounded">
          <div className="uppercase text-gray-400  text-xs font-semibold">
            Client
          </div>
          <div className="uppercase text-gray-400  text-xs font-semibold">
            Service
          </div>
          <div className="uppercase text-gray-400  text-xs font-semibold">
            Date & Time
          </div>
          <div className="uppercase text-gray-400  text-xs font-semibold">
            Status
          </div>
          <div className="uppercase text-gray-400  text-xs font-semibold">
            Payment
          </div>
          <div className="uppercase text-gray-400  text-xs font-semibold">
            Actions
          </div>
        </div>

        {appointments.map((a) => (
          <div key={a._id} className="w-full grid grid-cols-6">
            <div className="flex items-center gap-3">
              <Avatar
                size="lg"
                className={cn("flex items-center justify-center text-center")}
              >
                JK
              </Avatar>
              <div className="flex flex-col gap-0.5 ">
                <span className="font-bold text-xs">{a.name}</span>
                <span className="text-muted-foreground text-xs">
                  {a.cellNumber}
                </span>
              </div>
            </div>

            <div className="text-muted-foreground text-sm">{a.service}</div>
            <div className="flex flex-col gap-0.5 ">
              <span className="font-bold text-xs">{a.time}</span>
              <span className="text-muted-foreground text-xs">
                Duration: {a.duration}
              </span>
            </div>

            <Badge className="bg-green-400/25 text-green-400 font-medium text-xs">
              {a.status}
            </Badge>

            <Badge
              className={cn(
                "font-medium text-xs",
                a.paymentType === "Deposit"
                  ? "bg-gray-50 text-gray-400"
                  : "bg-primary/10 text-primary",
              )}
            >
              {a.paymentType}
            </Badge>

            <Button variant="ghost" size="icon">
              <EllipsisVertical className="size-6 text-gray-400" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const AppointmentsMobile = () => {
  return (
    <Card className="block sm:hidden rounded-lg mb-6">
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
            <div className="flex items-center gap-3 mt-4">
              <Avatar
                size="lg"
                className={cn("flex items-center justify-center text-center")}
              >
                JK
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <span className="font-bold text-xs">{a.name}</span>
                  <DotIcon className="size-4 text-gray-400" />
                  <div className="text-muted-foreground text-xs">
                    <span>{a.service}</span>
                  </div>
                </div>

                <span className="text-xs text-gray-400">{a.time}</span>

                <div className="flex items-center text-xs">
                  <Badge
                    className={cn(
                      a.status === "Confirmed"
                        ? "bg-green-400/25 text-green-400"
                        : "",
                    )}
                  >
                    {a.status}
                  </Badge>
                  <DotIcon className="size-4 text-gray-400" />
                  <span>{a.paymentType}</span>
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
};
