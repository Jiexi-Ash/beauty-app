"use client"
import { Business, BUSINESS_DAYS, useBusinessStore } from '@/stores/use-business'
import { Card, CardContent } from '../ui/card'
import Image from 'next/image'
import { ArrowLeft, Calendar1Icon, CalendarCheck, CalendarIcon, CheckCircle2, ChevronRightIcon, Clock, ClockIcon, CreditCard, DotIcon, MapPin, MapPinIcon, PencilIcon, PinIcon, StoreIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { useEffect, useMemo } from 'react'
import { Separator } from '../ui/separator'

function LaunchBusiness() {
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

    const groupBusinessDays = (days: Business["businessDays"]) => {
        if (!days?.length) return [];

        const groups: { start: string; end: string; openTime: string; closeTime: string }[] = [];
        let current = days[0];
        let groupStart = current;

        for (let i = 1; i < days.length; i++) {
            const day = days[i];
            const sameTime = day.openTime === current.openTime && day.closeTime === current.closeTime;

            if (sameTime) {
                current = day;
            } else {
                groups.push({ start: groupStart.fullName, end: current.fullName, openTime: groupStart.openTime, closeTime: groupStart.closeTime });
                groupStart = day;
                current = day;
            }
        }
        groups.push({ start: groupStart.fullName, end: current.fullName, openTime: groupStart.openTime, closeTime: groupStart.closeTime });

        return groups;
    };

    return (
        <div className="w-full max-w-xl">
            <div className=" grid grid-cols-2 gap-3">
                <Card>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            <StoreIcon className="size-5 text-primary" />
                            <h3 className="font-bold text-base ">{business?.name}</h3>
                        </div>
                        <Separator className="mt-6" />

                        <div className="flex gap-2 items-center mt-4 uppercase font-bold text-primary cursor-pointer" onClick={() => setSteps("Details")}>
                            Edit
                            <PencilIcon className="text-primary size-3" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <ClockIcon className="size-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-gray-300" />
                            <div className="flex flex-col gap-0.5">
                                {groupBusinessDays(business?.businessDays ?? []).map((group, i) => (
                                    <p key={i} className="text-xs">
                                        {group.start === group.end ? group.start : `${group.start}-${group.end}`}{" "}
                                        {group.openTime} - {group.closeTime}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <MapPinIcon className="size-4 text-gray-300" />
                            <p className="text-xs truncate">{business?.address.address}</p>
                        </div>
                    </CardContent>
                </Card>


            </div>
            {/* Profile view */}
            <Card className="p-0 my-8">
                <CardContent className="p-0">
                    <div className="w-full  relative h-54 p-0 m-0">
                        <Image src={coverImageUrl ?? "/salon-image-placeholder.jpg"} fill alt="" className="" />
                    </div>
                    <div className="w-full bg-white px-6 py-4 space-y-3">
                        <div>
                            <h2 className="text-lg font-bold">{business?.name}</h2>
                            <div className="flex gap-2 items-center">
                                <MapPinIcon className="size-4 text-gray-400" />
                                <p className="text-muted-foreground">Soweto</p>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="bg-muted py-1 px-3 rounded-full">Nails</div>
                            <div className="bg-muted py-1 px-3 rounded-full">Braids</div>
                            <div className="bg-muted py-1 px-3 rounded-full">Lashes</div>
                        </div>

                        <div className="bg-[#F3F3F4] w-full flex items-center justify-between p-3 mt-4 rounded-full">
                            <div className="flex gap-2 items-center">
                                <div className="h-14 w-14 rounded-full bg-primary/25 flex items-center justify-center">
                                    <CalendarCheck className="size-5 text-primary" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="uppercase text-xs tracking-tight">Next Available</span>
                                    <span className="font-semibold text-sm">Today, 15:00</span>
                                </div>
                            </div>
                            <ChevronRightIcon className="size-5 text-black" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

    )
}

export default LaunchBusiness