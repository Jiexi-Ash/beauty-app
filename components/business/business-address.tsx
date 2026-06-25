"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MapPin, PencilIcon, X } from "lucide-react";

interface BusinessAddressProps {
    businessId: Id<"business">;
    location?: string;
    isSaving: boolean;
    setIsSaving: (value: boolean) => void;
}

type Suggestion = { description: string; placeId: string };

export default function BusinessAddress({
    businessId,
    location,
    isSaving,
    setIsSaving,
}: BusinessAddressProps) {
    const searchAddress = useAction(api.business.admin.searchAddressPublic);
    const updateAddress = useAction(api.business.admin.updateBusinessAddress);

    const [isEditing, setIsEditing] = useState(false);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [currentLocation, setCurrentLocation] = useState(location);
    const [isPending, setIsPending] = useState(false);

    const handleSearch = useDebouncedCallback(async (value: string) => {
        if (value.length < 3) {
            setSuggestions([]);
            return;
        }
        try {
            const results = await searchAddress({ input: value });
            setSuggestions(results);
        } catch {
            setSuggestions([]);
        }
    }, 400);

    const handleSelect = async (suggestion: Suggestion) => {
        setIsPending(true);
        setIsSaving(true);
        try {
            await updateAddress({
                businessId,
                address: suggestion.description,
                placesId: suggestion.placeId,
            });
            setCurrentLocation(suggestion.description);
            toast.success("Business address updated");
            closeEditor();
        } catch (error) {
            if (error instanceof ConvexError) {
                toast.error(
                    typeof error.data === "string"
                        ? error.data
                        : "Could not update the address.",
                );
            } else {
                toast.error("Could not update the address.");
            }
        } finally {
            setIsPending(false);
            setIsSaving(false);
        }
    };

    const closeEditor = () => {
        setIsEditing(false);
        setQuery("");
        setSuggestions([]);
    };

    if (isEditing) {
        return (
            <div className="bg-surface-container/60 p-6 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">Business Address</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeEditor}
                        disabled={isPending}
                    >
                        <X className="size-4 text-primary" />
                    </Button>
                </div>
                <Input
                    autoFocus
                    value={query}
                    disabled={isPending}
                    placeholder="Search for your address..."
                    onChange={(e) => {
                        setQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                    className="bg-white"
                />
                {suggestions.length > 0 && (
                    <ul className="rounded-lg border border-border bg-white">
                        {suggestions.map((s) => (
                            <li key={s.placeId}>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleSelect(s)}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {s.description}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {isPending && (
                    <p className="text-xs text-muted-foreground">Saving address...</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-surface-container/60 flex items-start justify-between p-6 rounded-xl">
            <div className="flex gap-3 items-start">
                <MapPin className="size-5 text-primary" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-primary">Business Address</p>
                    <p className="max-w-xs text-xs">{currentLocation}</p>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                disabled={isSaving}
            >
                <PencilIcon className="size-4 text-primary" />
            </Button>
        </div>
    );
}
