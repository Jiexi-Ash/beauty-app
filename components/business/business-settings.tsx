"use client";

// Business settings page: status, description, verification, hours, controls.
import { Preloaded, usePreloadedQuery } from 'convex/react'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import { Switch } from '@/components/ui/switch'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Check, Clock, Info, PencilSimple, SealCheck, X } from '@phosphor-icons/react'
import { format } from 'date-fns'
import BookingControls from './booking-controls'
import BusinessHours from './business-hours'
import { api } from '@/convex/_generated/api'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { ConvexError } from 'convex/values'

interface BusinessSettingsProps {
    preloadedBusiness: Preloaded<typeof api.business.admin.getUserBusiness>
}
function BusinessSettings({ preloadedBusiness }: BusinessSettingsProps) {
    const business = usePreloadedQuery(preloadedBusiness);
    const [isSaving, setIsSaving] = useState(false);
    const [offlineDialogOpen, setOfflineDialogOpen] = useState(false);
    const [pendingVisibility, setPendingVisibility] = useState<"visible" | "offline" | null>(null);

    const { mutate: toggleVisibility, isPending: isTogglingVisibility } = useMutation({
        mutationFn: useConvexMutation(api.business.admin.toggleBusinessVisibilty),
        onMutate: () => setIsSaving(true),
        onSuccess: () => {
            toast.success(
                pendingVisibility === "visible"
                    ? "Your profile is live again"
                    : "Your profile is now offline",
            );
            setOfflineDialogOpen(false);
        },
        onError: (error) => {
            if (error instanceof ConvexError) {
                toast.error(
                    typeof error.data === "string"
                        ? error.data
                        : "Could not update your profile status.",
                );
            } else {
                toast.error("Could not update your profile status.");
            }
        },
        onSettled: () => setIsSaving(false),
    });

    const handleVisibilityChange = (checked: boolean) => {
        if (checked) {
            setPendingVisibility("visible");
            toggleVisibility({ visibility: "visible" });
        } else {
            setOfflineDialogOpen(true);
        }
    };

    const confirmGoOffline = () => {
        setPendingVisibility("offline");
        toggleVisibility({ visibility: "offline" });
    };

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState(business?.description ?? "");

    const { mutate: saveDescription, isPending: isSavingDescription } = useMutation({
        mutationFn: useConvexMutation(api.business.admin.updateBusinessDescription),
        onMutate: () => setIsSaving(true),
        onSuccess: () => {
            toast.success("Business description updated");
            setIsEditingDescription(false);
        },
        onError: (error) => {
            if (error instanceof ConvexError) {
                toast.error(
                    typeof error.data === "string"
                        ? error.data
                        : "Could not update your business description.",
                );
            } else {
                toast.error("Could not update your business description.");
            }
        },
        onSettled: () => setIsSaving(false),
    });

    const startEditingDescription = () => {
        setDescription(business?.description ?? "");
        setIsEditingDescription(true);
    };

    const cancelEditingDescription = () => {
        setDescription(business?.description ?? "");
        setIsEditingDescription(false);
    };

    if (!business) return null;

    const verificationPct = Math.min(
        (business.completedBookingsCount / business.verificationThreshold) * 100,
        100,
    );
    const isPendingVerification =
        !business.verifiedDate &&
        business.completedBookingsCount >= business.verificationThreshold;

    return (
        <div className="w-full px-6 py-6 2xl:mx-auto 2xl:max-w-[1600px]">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold md:text-3xl">Business Settings</h1>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Fine-tune your salon&apos;s operational flow, booking rules and visual brand identity to provide the best experience.
                    </p>
                </div>


            </div>

            <Card className="w-full pt-0 px-0 mt-6 lg:mt-10">
                <CardHeader className="relative h-40 w-full sm:h-64">
                    <Image src={business.coverImageUrl ?? "/salon-image-placeholder.jpg"} alt="header" fill className="object-cover rounded-t-lg" />
                    <div className="absolute inset-0 bg-linear-to-t from-black z-10 via-transparent to-transparent"></div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="bg-muted rounded-lg p-6">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Status</p>
                                <Switch
                                    size="default"
                                    id="business-visibility"
                                    checked={business.visibility === "visible"}
                                    disabled={isSaving || isTogglingVisibility}
                                    onCheckedChange={handleVisibilityChange}
                                />
                            </div>
                            <p className="font-headline text-lg font-bold">
                                {business.visibility === "visible" ? "Public Profile Active" : "Profile Offline"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {business.visibility === "visible"
                                    ? "Visible to all clients on explore."
                                    : "Hidden from explore. Not accepting new bookings."}
                            </p>
                        </div>

                        <div className="bg-muted rounded-lg p-6">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Business Description</p>
                                {isEditingDescription ? (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={cancelEditingDescription}
                                            disabled={isSavingDescription}
                                        >
                                            <X className="size-4 text-primary" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => saveDescription({ description })}
                                            disabled={isSavingDescription || description.trim().length < 10}
                                        >
                                            <Check className="size-4 text-primary" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={startEditingDescription}
                                        disabled={isSaving}
                                    >
                                        <PencilSimple className="size-4 text-primary" />
                                    </Button>
                                )}
                            </div>
                            {isEditingDescription ? (
                                <div className="space-y-1">
                                    <Textarea
                                        autoFocus
                                        value={description}
                                        disabled={isSavingDescription}
                                        maxLength={250}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-background text-xs min-h-20 resize-none"
                                    />
                                    <p className="text-right text-[10px] tabular-nums text-muted-foreground">
                                        {description.length}/250 characters
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">{business.description}</p>
                            )}
                        </div>

                        <div className="bg-muted rounded-lg p-6">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Verification</p>
                                {business.verifiedDate && (
                                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                        <SealCheck weight="fill" className="size-3" />
                                        Verified
                                    </span>
                                )}
                                {isPendingVerification && (
                                    <span className="flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                        <Clock className="size-3" />
                                        Pending review
                                    </span>
                                )}
                            </div>
                            {business.verifiedDate ? (
                                <>
                                    <p className="font-headline text-lg font-bold">Verified Business</p>
                                    <p className="text-xs text-muted-foreground">
                                        Earned {format(business.verifiedDate, "MMMM yyyy")} · {business.completedBookingsCount} completed bookings
                                    </p>
                                </>
                            ) : isPendingVerification ? (
                                <>
                                    <p className="font-headline text-lg font-bold">Under Review</p>
                                    <p className="text-xs text-muted-foreground">
                                        You&apos;ve reached {business.verificationThreshold} completed bookings. Verification runs daily, check back soon.
                                    </p>
                                </>
                            ) : (
                                <div className="mt-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs text-muted-foreground">Progress</p>
                                        <p className="text-xs font-semibold text-foreground">
                                            {business.completedBookingsCount}/{business.verificationThreshold} bookings
                                        </p>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${verificationPct}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className='gap-4 w-full mt-6 grid grid-cols-1 lg:grid-cols-3'>
                <BusinessHours
                    businessId={business._id}
                    location={business.location}
                    hours={business.businessHours}
                    isSaving={isSaving}
                    setIsSaving={setIsSaving}
                />
                <BookingControls
                    businessId={business._id}
                    settings={business.settings}
                    isSaving={isSaving}
                    setIsSaving={setIsSaving}
                />
            </div>

            <AlertDialog open={offlineDialogOpen} onOpenChange={setOfflineDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Info className="size-8 text-primary shrink-0 text-center w-full" />
                        <AlertDialogTitle className="w-full text-center font-headline">
                            Take your profile offline?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="w-full text-center">
                            Your profile stops appearing on explore and clients cannot
                            make new bookings. Any bookings you already have, upcoming or
                            in progress, are not affected and will not be cancelled.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="lg:justify-center">
                        <AlertDialogCancel className="rounded-full">Stay Visible</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmGoOffline}
                            className="rounded-full"
                        >
                            Go Offline
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}

export default BusinessSettings