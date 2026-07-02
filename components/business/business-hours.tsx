"use client";

// Business hours editor: per-day open/closed + times, plus address editor.
import { useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { BUSINESS_DAYS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Clock, FloppyDisk, PencilSimple } from "@phosphor-icons/react";
import BusinessAddress from "./business-address";

type DayState = {
    fullName: string;
    shortName: string;
    isClosed: boolean;
    openTime: string;
    closeTime: string;
};

const buildDays = (hours: Doc<"businessHours">[]): DayState[] =>
    BUSINESS_DAYS.map((d) => {
        const row = hours.find((h) => h.fullName === d.fullName);
        return {
            fullName: d.fullName,
            shortName: d.shortName,
            isClosed: !row,
            openTime: row?.openTime ?? d.openTime,
            closeTime: row?.closeTime ?? d.closeTime,
        };
    });

interface BusinessHoursProps {
    businessId: Id<"business">;
    location?: string;
    hours: Doc<"businessHours">[];
    isSaving: boolean;
    setIsSaving: (value: boolean) => void;
}

export default function BusinessHours({
    businessId,
    location,
    hours,
    isSaving,
    setIsSaving,
}: BusinessHoursProps) {
    const displayDays = buildDays(hours);

    const [isEditing, setIsEditing] = useState(false);
    const [days, setDays] = useState<DayState[]>(displayDays);

    const { mutate: save, isPending } = useMutation({
        mutationFn: useConvexMutation(api.business.admin.updateBusinessHours),
        onMutate: () => setIsSaving(true),
        onSuccess: () => {
            toast.success("Business hours updated");
            setIsEditing(false);
        },
        onError: (error) => {
            if (error instanceof ConvexError) {
                toast.error(
                    typeof error.data === "string"
                        ? error.data
                        : "Could not update business hours.",
                );
            } else {
                toast.error("Could not update business hours.");
            }
        },
        onSettled: () => setIsSaving(false),
    });

    const startEditing = () => {
        setDays(buildDays(hours));
        setIsEditing(true);
    };

    const updateDay = (index: number, patch: Partial<DayState>) => {
        setDays((prev) =>
            prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
        );
    };

    const handleSave = () => {
        const openDays = days
            .filter((d) => !d.isClosed)
            .map(({ fullName, shortName, openTime, closeTime }) => ({
                fullName,
                shortName,
                openTime,
                closeTime,
            }));
        save({ businessId, days: openDays });
    };

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary">
                                <Clock className="size-5 text-primary" />
                            </div>
                            <p className="font-headline text-lg font-bold">Business Hours</p>
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
            <CardContent className="space-y-4 mt-6">
                {isEditing ? (
                    <div className="space-y-3">
                        {days.map((day, index) => (
                            <div
                                key={day.fullName}
                                className="flex flex-wrap items-center justify-between gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Switch
                                        size="default"
                                        checked={!day.isClosed}
                                        disabled={isPending}
                                        onCheckedChange={(open) =>
                                            updateDay(index, { isClosed: !open })
                                        }
                                    />
                                    <span className="font-medium">{day.fullName}</span>
                                </div>
                                {day.isClosed ? (
                                    <span className="text-sm text-muted-foreground">Closed</span>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="time"
                                            value={day.openTime}
                                            disabled={isPending}
                                            onChange={(e) =>
                                                updateDay(index, { openTime: e.target.value })
                                            }
                                            className="h-8 w-24 sm:w-28 bg-background"
                                        />
                                        <span className="text-muted-foreground">-</span>
                                        <Input
                                            type="time"
                                            value={day.closeTime}
                                            disabled={isPending}
                                            onChange={(e) =>
                                                updateDay(index, { closeTime: e.target.value })
                                            }
                                            className="h-8 w-24 sm:w-28 bg-background"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayDays.map((day) => (
                            <div
                                key={day.fullName}
                                className="flex items-center justify-between"
                            >
                                <span className="font-medium">{day.fullName}</span>
                                {day.isClosed ? (
                                    <Badge className="bg-muted text-muted-foreground">Closed</Badge>
                                ) : (
                                    <span className="text-muted-foreground">
                                        {day.openTime} - {day.closeTime}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <BusinessAddress
                    businessId={businessId}
                    location={location}
                    isSaving={isSaving}
                    setIsSaving={setIsSaving}
                />
            </CardContent>
        </Card>
    );
}
