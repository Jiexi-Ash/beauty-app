"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { ConvexError } from "convex/values";
import { CircleNotch, PencilSimple, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";

interface ActionProps {
  id: Id<"service">;
}
function Actions({ id }: ActionProps) {
  const { mutate: deleteService, isPending } = useMutation({
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

  const handleDeleteService = () => {
    deleteService({ serviceId: id });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-lg"
        className="rounded-lg cursor-pointer"
        disabled={isPending}
        aria-label="Edit service"
      >
        <Link href={`/dashboard/services/${id}`}>
          <PencilSimple className="size-4 text-primary" />
        </Link>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="rounded-lg cursor-pointer"
              disabled={isPending}
              aria-label="Delete service"
            />
          }
        >
          {isPending ? (
            <CircleNotch className="animate-spin size-4" />
          ) : (
            <Trash className="size-4 text-destructive" />
          )}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash className="text-destructive" weight="fill" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your service list permanently. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Keep service
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={handleDeleteService}
            >
              {isPending ? "Deleting..." : "Delete service"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Actions;
