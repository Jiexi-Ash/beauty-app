"use client";

import { useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "../ui/input";
import { FloppyDisk, PencilSimple, SlidersHorizontal } from "@phosphor-icons/react";

interface BookingControlsProps {
    businessId: Id<"business">;
    settings: Doc<"businessSettings"> | null;
    isSaving: boolean;
    setIsSaving: (value: boolean) => void;
}

export default function BookingControls({
    businessId,
    settings,
    isSaving,
    setIsSaving,
}: BookingControlsProps) {
    const maxConcurrentValue = settings?.maxConcurrentBookings ?? 1;
    const bufferMinutesValue = settings?.bufferTimeMinutes ?? 0;
    const allowBeyondCloseValue = settings?.allowBookingBeyondCloseTime ?? false;

    const [isEditing, setIsEditing] = useState(false);
    const [maxConcurrent, setMaxConcurrent] = useState(maxConcurrentValue);
    const [bufferMinutes, setBufferMinutes] = useState(bufferMinutesValue);
    const [allowBeyondClose, setAllowBeyondClose] = useState(allowBeyondCloseValue);

    const { mutate: save, isPending } = useMutation({
        mutationFn: useConvexMutation(api.business.admin.updateBusinessSettings),
        onMutate: () => setIsSaving(true),
        onSuccess: () => {
            toast.success("Booking controls updated");
            setIsEditing(false);
        },
        onError: (error) => {
            if (error instanceof ConvexError) {
                toast.error(
                    typeof error.data === "string"
                        ? error.data
                        : "Could not update settings.",
                );
            } else {
                toast.error("Could not update settings.");
            }
        },
        onSettled: () => setIsSaving(false),
    });

    const startEditing = () => {
        // Seed
        setMaxConcurrent(maxConcurrentValue);
        setBufferMinutes(bufferMinutesValue);
        setAllowBeyondClose(allowBeyondCloseValue);
        setIsEditing(true);
    };

    const handleSave = () => {
        save({
            businessId,
            maxConcurrentBookings: maxConcurrent,
            bufferTimeMinutes: bufferMinutes,
            allowBookingBeyondCloseTime: allowBeyondClose,
        });
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary">
                                <SlidersHorizontal className="size-5 text-primary" />
                            </div>
                            <p className="font-headline text-lg font-bold">Booking Controls</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSave} disabled={isPending}>
                                        <FloppyDisk className="size-4 text-primary-foreground ml-1" />
                                        {isPending ? "Saving..." : "Save"}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className="text-primary"
                                    onClick={startEditing}
                                    disabled={isSaving}
                                >
                                    <PencilSimple className="size-4 text-primary" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="mt-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Max concurrent */}
                    <div className="space-y-2">
                        <span className="text-xs font-black uppercase text-muted-foreground tracking-tighter mb-2 block">
                            concurrent limits
                        </span>
                        <div className="bg-muted w-full rounded-xl px-4 py-4 flex justify-between items-center border border-transparent focus-within:border-primary/40 transition-all">
                            <span className="text-foreground font-bold">Max Clients/Slot</span>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    min={1}
                                    value={maxConcurrent}
                                    disabled={isPending}
                                    onChange={(e) =>
                                        setMaxConcurrent(Math.max(1, Number(e.target.value) || 1))
                                    }
                                    className="h-9 w-16 border-0 bg-background text-right text-lg font-extrabold text-primary shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                                />
                            ) : (
                                <span className="text-2xl font-headline font-extrabold text-primary">
                                    {String(maxConcurrentValue).padStart(2, "0")}
                                </span>
                            )}
                        </div>
                        <p className="max-w-xs text-xs">
                            Maximum number of concurrent bookings per slot
                        </p>
                    </div>

                    {/* Buffer minutes */}
                    <div className="space-y-2">
                        <span className="text-xs font-black uppercase text-muted-foreground tracking-tighter mb-2 block">
                            Grace Period Buffer
                        </span>
                        <div className="bg-muted w-full rounded-xl px-4 py-4 flex justify-between items-center border border-transparent focus-within:border-primary/40 transition-all">
                            <span className="text-foreground font-bold">Post Service</span>
                            {isEditing ? (
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={bufferMinutes}
                                        disabled={isPending}
                                        onChange={(e) =>
                                            setBufferMinutes(Math.max(0, Number(e.target.value) || 0))
                                        }
                                        className="h-9 w-16 border-0 bg-background text-right text-lg font-extrabold text-primary shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                                    />
                                    <span className="text-muted-foreground text-sm">min</span>
                                </div>
                            ) : (
                                <span className="text-2xl font-headline font-extrabold text-primary">
                                    <span className="text-primary font-bold mr-1">
                                        {bufferMinutesValue}
                                    </span>
                                    <span className="text-muted-foreground text-sm">min</span>
                                </span>
                            )}
                        </div>
                        <p className="max-w-xs text-xs">
                            Downtime between bookings for breaks and/or cleaning.
                        </p>
                    </div>

                    {/* Allow beyond close */}
                    <div className="space-y-2">
                        <span className="text-xs font-black uppercase text-muted-foreground tracking-tighter mb-2 block">
                            Booking Beyond Closing Time
                        </span>
                        <div className="bg-muted w-full rounded-xl px-4 py-4 flex justify-between items-center border border-transparent focus-within:border-primary/40 transition-all">
                            <span className="text-foreground font-bold">
                                {(isEditing ? allowBeyondClose : allowBeyondCloseValue)
                                    ? "Allowed"
                                    : "Not Allowed"}
                            </span>
                            <Switch
                                size="default"
                                id="toggle-booking-close-time"
                                checked={isEditing ? allowBeyondClose : allowBeyondCloseValue}
                                disabled={!isEditing || isPending}
                                onCheckedChange={setAllowBeyondClose}
                            />
                        </div>
                        <p className="max-w-xs text-xs">
                            Allow appoitments that stretch beyond your business close time.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
