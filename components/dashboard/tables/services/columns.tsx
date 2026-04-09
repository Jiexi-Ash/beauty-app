"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Id } from "@/convex/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Actions from "./actions";
import { cn } from "@/lib/utils";

export type Service = {
  image: string | null;
  category: string;
  _id: Id<"service">;
  _creationTime: number;
  updatedAt?: number | undefined;
  name: string;
  description: string;
  visibility: "hidden" | "visible";
  businessId: Id<"business">;
  price: number;
  categoryId: Id<"categories">;
  duration: number;
  primaryImageStorageId: Id<"_storage">;
  totalBookings: number;
};

const toggleVisibility = (visibility: "hidden" | "visible") => {
  if (visibility === "hidden") {
    return;
  }
};

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: "name",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">
        SERVICE NAME
      </div>
    ),
    cell: ({ row }) => {
      const service = row.original;

      return (
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12 rounded-full">
            <Image
              src={service.image ?? ""}
              fill
              className={cn(
                "object-cover rounded-full",
                service.visibility === "hidden" && "grayscale-100",
              )}
              alt={`${service.name} image`}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold capitalize">{service.name}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">
        CATEGORY
      </div>
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as string;

      return (
        <Badge className="capitalize bg-muted-foreground">{category}</Badge>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">PRICE</div>
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatedPrice = (price / 100).toFixed(2);

      return <div className="font-semibold">R{formatedPrice}</div>;
    },
  },
  {
    accessorKey: "duration",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">
        DURATION
      </div>
    ),
    cell: ({ row }) => {
      const duration = parseInt(row.getValue("duration"));

      return <div className="text-muted-foreground">{duration} mins</div>;
    },
  },
  {
    accessorKey: "visibility",
    header: () => (
      <div className="text-muted-foreground text-xs font-semibold">
        VISIBILITY
      </div>
    ),
    cell: ({ row }) => {
      const visibility = row.getValue("visibility") as "hidden" | "visible";

      return (
        <Switch
          checked={visibility === "visible" ? true : false}
          id={`toggle-visibility-${row.original._id}`}
          onCheckedChange={() => toggleVisibility(visibility)}
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <Actions id={row.original._id} />;
    },
  },
];
