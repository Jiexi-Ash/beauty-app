"use client";

// Business settings page: status, description, verification, hours, controls.
import { Preloaded, usePreloadedQuery } from 'convex/react'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import { Switch } from '@/components/ui/switch'
import { Button } from '../ui/button'
import { PencilIcon } from 'lucide-react'
import BookingControls from './booking-controls'
import BusinessHours from './business-hours'
import { api } from '@/convex/_generated/api'

interface BusinessSettingsProps {
    preloadedBusiness: Preloaded<typeof api.business.admin.getUserBusiness>
}
function BusinessSettings({ preloadedBusiness }: BusinessSettingsProps) {
    const business = usePreloadedQuery(preloadedBusiness);
    const [isSaving, setIsSaving] = useState(false);

    // TODO: replace with real booking count once booking data is fetched.
    const bookingsCount = 15;
    const verificationThreshold = 50;
    const verificationPct = Math.min(
        (bookingsCount / verificationThreshold) * 100,
        100,
    );

    if (!business) return null;

    return (
        <div className="w-full px-6 py-6 2xl:mx-auto 2xl:max-w-[1600px]">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl">Business Settings</h1>
                    <p className="text-sm text-gray-400 max-w-md">
                        Fine-tune your salon's operational flow, booking rules and visual brand identity to provide the best expirience.
                    </p>
                </div>


            </div>

            <Card className="w-full pt-0 px-0 mt-6 lg:mt-10">
                <CardHeader className="relative h-64 w-full">
                    <Image src={business.coverImageUrl ?? "/salon-image-placeholder.jpg"} alt="header" fill className="object-cover rounded-t-lg" />
                    <div className="absolute inset-0 bg-linear-to-t from-black z-10 via-transparent to-transparent"></div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-surface-container/60 p-6">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Status</p>
                                <Switch size="default" id="business-visibility" disabled={isSaving} />
                            </div>
                            <p className="font-headline text-lg font-bold">Public Profile Active</p>
                            <p className="text-xs text-on-surface-variant">Visible to all clients on explore.</p>
                        </div>

                        <div className="bg-surface-container/60 p-6">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Business Description</p>
                                <Button variant="ghost" size="icon" disabled={isSaving}>
                                    <PencilIcon className="size-4 text-primary" />
                                </Button>
                            </div>
                            <p className="text-xs text-on-surface-variant">{business.description}</p>
                        </div>

                        <div className="bg-surface-container/60 p-6">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Verification</p>
                            </div>
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-on-surface-variant">Progress</p>
                                    <p className="text-xs font-semibold text-on-surface">{bookingsCount}/{verificationThreshold} bookings</p>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${verificationPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className=' gap-4 w-full mt-6 grid grid-cols-3'>
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
        </div >
    )
}

export default BusinessSettings