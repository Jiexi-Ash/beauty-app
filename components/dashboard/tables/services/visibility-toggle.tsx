"use client";

import { Switch } from "@/components/ui/switch";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

export default function VisibilityToggle({
  id,
  visibility,
}: {
  id: Id<"service">;
  visibility: "hidden" | "visible";
}) {
  const { mutate: toggleVisibility, isPending } = useMutation({
    mutationFn: useConvexMutation(api.service.admin.toggleVisibility),
    onSuccess: () => {
      toast.success("Successfully updated visibility");
    },
    onError: (error) => {
      if (error instanceof ConvexError) {
        toast.error(
          error.data || "An unknown error occurred while changing visibility.",
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred while changing visibility.");
      }
    },
  });

  const handleVisibility = (visibility: "hidden" | "visible") => {
    toggleVisibility({ serviceId: id, visibility });
  };

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="flex items-center"
    >
      <Switch
        checked={visibility === "visible"}
        id={`toggle-visibility-${id}`}
        disabled={isPending}
        onCheckedChange={(e) =>
          handleVisibility(visibility === "visible" ? "hidden" : "visible")
        }
      />
    </div>
  );
}
