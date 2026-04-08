"use client";
import { api } from "@/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Bell, Clock, ListFilter, Scissors } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Switch } from "../ui/switch";
import { Id } from "@/convex/_generated/dataModel";

interface ServicesProps {
  preloadedServices: Preloaded<typeof api.service.admin.getBusinessServices>;
}
function Services({ preloadedServices }: ServicesProps) {
  const services = usePreloadedQuery(preloadedServices);

  const activeServices = services.filter(
    (service) => service.visibility === "visible",
  );

  const hiddenServices = services.filter(
    (service) => service.visibility === "hidden",
  );

  if (services.length === 0) {
    return <div></div>;
  }

  return (
    <div className="min-h-screen w-full">
      <header className="flex w-full justify-between items-center top-0 sticky lg:border-b border-border shadow-sm px-6 z-50 bg-white">
        <div className="flex gap-3 items-center h-20">
          <div className="relative w-12 h-12 rounded-full">
            <Image
              src={"/salon-image-placeholder.jpg"}
              alt={`${"Katlego nail's bar"} cover image`}
              fill
              className="rounded-full object-cover"
            />
          </div>

          <h1 className="text-base text-primary font-bold">
            {"Katlego's nail Bar"}
          </h1>
        </div>

        <div className="flex gap-4 items-center">
          <Bell className="size-6 text-gray-100" fill="#9CA3AF" />
        </div>
      </header>

      <div className="px-6 flex flex-col space-y-6">
        <div className="bg-gray-50 w-full  p-4 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
              <Scissors className="text-primary size-6" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="uppercase text-xs text-muted-foreground font-bold">
                Services
              </span>
              <span className="font-bold text-lg">
                {activeServices.length} Active
              </span>
            </div>
          </div>

          <Badge className="bg-primary/40">
            {hiddenServices.length} hidden
          </Badge>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">All Services</h2>

          <Button variant="ghost" className="text-primary">
            Filter <ListFilter className="text-primary" />
          </Button>
        </div>

        <div className="flex flex-col gap-3">
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
  const [serviceVisibility, setVisibility] = useState<"hidden" | "visible">(
    visibility,
  );

  const toggleVisibility = (visibility: "hidden" | "visible") => {
    if (visibility === "hidden") {
      setVisibility("visible");
      return;
    }

    setVisibility("hidden");
  };

  const formatedPrice = price / 100;
  return (
    <Card key={_id} className="w-full border-none border-0">
      <CardContent className="border-none border-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20 rounded-full">
            <Image
              src={image ?? ""}
              fill
              className="object-cover rounded-full"
              alt={`${name} image`}
            />
          </div>

          <div className="flex flex-col gap-0.5">
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
                <span className="text-xs">{duration}m</span>
              </div>
            </div>
          </div>
        </div>

        <Switch
          checked={serviceVisibility === "visible" ? true : false}
          id="toggle-visibility"
          onCheckedChange={() => toggleVisibility(serviceVisibility)}
        />
      </CardContent>
    </Card>
  );
};
