"use client"
import { Business, BUSINESS_DAYS, useBusinessStore } from '@/stores/use-business'
import { Card, CardContent } from '../ui/card'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, Clock, CreditCard, DotIcon, MapPin } from 'lucide-react'
import { Button } from '../ui/button'
import { useEffect, useMemo } from 'react'

function ConfirmBusiness() {
    const { business, payment, setSteps } = useBusinessStore()


    const coverImageFile = business?.coverImage ?? null;
    const coverImage = useMemo(() => {
        if (!coverImageFile) return null;
        return URL.createObjectURL(coverImageFile);
    }, [coverImageFile]);

    useEffect(() => {
        return () => { if (coverImage) URL.revokeObjectURL(coverImage); };
    }, [coverImage]);

    const sortedDays = useMemo(() =>
        BUSINESS_DAYS.filter(day =>
            business?.businessDays.includes(day as Business["businessDays"][number])
        ), [business?.businessDays]);

    const coverImageUrl = business?.coverImage
        ? URL.createObjectURL(business.coverImage)
        : null;

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-foreground">Almost there! Review your store details below.</p>
            </div>
            <Card className="relative border-border overflow-hidden w-full h-56">
                {coverImageUrl && <Image src={coverImageUrl} fill alt="Store" className="w-full h-full object-cover" />}
                <div className="absolute top-28 px-6 w-full h-full bg-black/40">
                    <div className="flex flex-col space-y-1">
                        <div className="flex flex-col">
                            <h3 className="text-white text-lg capitalize">{business?.name}</h3>
                            <p className="text-xs text-muted max-w-xs">{business?.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="size-3.5 text-muted" />
                            <span className="text-xs text-muted">{business?.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="size-3.5 text-white/70" />
                            <div className="flex items-center capitalize">
                                <span className="text-xs text-muted">{sortedDays[0]}</span>
                                <span className="text-xs text-muted">-</span>
                                <span className="text-xs text-muted">{sortedDays[sortedDays.length - 1]}</span>
                            </div>
                            <DotIcon className="size-3.5 text-muted" />
                            <div className="flex items-center capitalize gap-0.5">
                                <span className="text-xs text-muted">{business?.startTime}</span>
                                <span className="text-xs text-muted">-</span>
                                <span className="text-xs text-muted">{business?.endTime}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="border-border">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</span>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">PayFast Merchant ID</p>
                        <p className="text-sm font-mono font-semibold text-foreground">{payment?.merchantId}</p>
                    </div>
                </CardContent>
            </Card>

            {business && payment ? (
                <div className="py-4 border-t border-border flex justify-between">
                    <Button variant="outline" className="h-10 px-4 py-2" onClick={() => setSteps("payment")}>
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                    <Button className="h-10 px-4 py-2"  >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Launch Store
                    </Button>
                </div>
            ) : <div />}
        </div>

    )
}

export default ConfirmBusiness