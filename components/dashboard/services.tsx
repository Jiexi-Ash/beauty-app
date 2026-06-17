"use client";
import { api } from "@/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import {
  CalendarCheck,
  Clock,
  EllipsisVertical,
  PlusIcon,
  Scissors,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { DataTable } from "./tables/services/data-table";
import { columns, Service } from "./tables/services/columns";
import Link from "next/link";
import VisibilityToggle from "./tables/services/visibility-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { formatDuration } from "@/lib/utils";

interface ServicesProps {
  preloadedServices: Preloaded<typeof api.service.admin.getBusinessServices>;
}
function Services({ preloadedServices }: ServicesProps) {
  const services = usePreloadedQuery(preloadedServices);

  const activeServices = services.filter(
    (service) => service.visibility === "visible",
  );

  const totalRevenue = services.reduce((acc, s) => acc + s.price, 0) / 100;
  const avgPrice = services.length > 0 ? totalRevenue / services.length : 0;
  const totalBookings = services.reduce((acc, s) => acc + s.totalBookings, 0);
  const topCategory =
    services.length > 0
      ? Object.entries(
          services.reduce(
            (acc, s) => {
              acc[s.category] = (acc[s.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        ).sort((a, b) => b[1] - a[1])[0][0]
      : "N/A";

  const hiddenServices = services.filter(
    (service) => service.visibility === "hidden",
  );

  if (services.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center ">
          <Image
            src="/no_data.svg"
            width={200}
            height={200}
            className="opacity-80"
            alt="no services"
          />
          <div className="flex flex-col items-center text-center gap-4 mt-6">
            <div className="space-y-1">
              <p className="text-lg font-bold">No services yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first service to get started.
              </p>
            </div>

            <Button
              className="text-sm cursor-pointer hover:bg-primary/70 h-10 px-6 "
              size="lg"
            >
              <Link
                href="/dashboard/services/create-service"
                className="flex items-center gap-2"
              >
                <PlusIcon className="size-4 text-white" />
                New Service
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="px-6 flex flex-col space-y-4 mt-6">
        <div className="flex flex-col gap-3 lg:gap-0 lg:items-center lg:flex-row lg:justify-between">
          <div className="flex flex-col">
            <h2 className="font-bold text-xl md:text-2xl">Services</h2>
            <p className="text-sm text-gray-400">
              Create and manage your service list, pricing, duration, and
              visibility.
            </p>
          </div>

          <Button
            className="text-sm cursor-pointer hover:bg-primary/70 h-10 px-6"
            size="lg"
          >
            <Link
              href="/dashboard/services/create-service"
              className="flex items-center gap-2"
            >
              <PlusIcon className="size-4 text-white" />
              New Service
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className=" border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Scissors className="text-primary size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Active
                </p>
                <p className="font-bold text-lg leading-tight">
                  {activeServices.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hiddenServices.length} hidden
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className=" border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <TrendingUp className="text-green-600 size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Average Price
                </p>
                <p className="font-bold text-lg leading-tight">
                  R{avgPrice.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">per service</p>
              </div>
            </CardContent>
          </Card>

          <Card className=" border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <CalendarCheck className="text-blue-600 size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Bookings
                </p>
                <p className="font-bold text-lg leading-tight">
                  {totalBookings}
                </p>
                <p className="text-xs text-muted-foreground">all time</p>
              </div>
            </CardContent>
          </Card>

          <Card className=" border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                <Tag className="text-purple-600 size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  Top Category
                </p>
                <p className="font-bold text-lg leading-tight capitalize">
                  {topCategory}
                </p>
                <p className="text-xs text-muted-foreground">most services</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 block lg:hidden">
          <h3 className="text-base md:text-lg font-semibold">All Services</h3>
          <div className="flex flex-col gap-3 ">
            {services.map((service) => (
              <ServiceCard
                key={service._id}
                _id={service._id}
                category={service.category}
                duration={service.duration}
                image={service.image ?? ""}
                name={service.name}
                price={service.price}
                visibility={service.visibility}
              />
            ))}
          </div>
        </div>

        <ServicesDesktop services={services} />
      </div>
    </div>
  );
}

export default Services;

type ServiceCardProps = {
  _id: Id<"service">;
  name: string;
  image: string;
  price: number;
  category: string;
  duration: number;
  visibility: "hidden" | "visible";
};
const ServiceCard = ({
  _id,
  category,
  duration,
  image,
  name,
  price,
  visibility,
}: ServiceCardProps) => {
  const { mutate: deleteService } = useMutation({
    mutationFn: useConvexMutation(api.service.admin.deleteService),
    onSuccess: () => {
      toast.success("Service deleted Successfully");
    },
    onError: (error) => {
      if (error instanceof ConvexError) {
        toast.error(
          error.data || "An unknown error occurred while deleting service.",
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred while deleting service.");
      }
    },
  });

  const formatedPrice = price / 100;

  const handleDelete = () => {
    deleteService({ serviceId: _id });
  };

  return (
    <Link href={`/dashboard/services/${_id}`}>
      <Card key={_id} className="w-full border-none border-0">
        <CardContent className="border-none border-0 flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20 rounded-full">
              <Image
                src={image ?? ""}
                fill
                className="object-cover rounded-full"
                alt={`${name} image`}
              />
            </div>

            <div className="flex flex-col">
              <span className="text-primary text-xs uppercase font-semibold">
                {category}
              </span>
              <span className="capitalize font-bold text-sm">{name}</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-primary font-bold">
                  R{formatedPrice.toFixed(2)}
                </span>

                <div className="flex items-center gap-1">
                  <Clock className="size-4 text-muted-foreground overflow-hidden" />
                  <span className="text-xs">{formatDuration(duration)}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-3"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <VisibilityToggle id={_id} visibility={visibility} />
            <DropdownMenu>
              <DropdownMenuTrigger>
                <EllipsisVertical className="size-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive border p-2"
                  onClick={() => handleDelete()}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

interface ServicesDesktopProps {
  services: Service[];
}
const ServicesDesktop = ({ services }: ServicesDesktopProps) => {
  return (
    <Card className="hidden lg:block border border-border bg-white shadow-lg ring-1 ring-black/5">
      <CardContent className="p-0">
        <DataTable columns={columns} data={services} />
      </CardContent>
    </Card>
  );
};
