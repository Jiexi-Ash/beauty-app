"use client"

import { Business, useBusinessStore } from '@/stores/use-business'
import { Card, CardContent } from '../ui/card'
import Image from 'next/image'
import { Calendar, MapPin } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export const groupBusinessDays = (days: Business["businessDays"]) => {
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

function BookingPagePreview({ caption, className }: { caption?: string; className?: string }) {
    const business = useBusinessStore((s) => s.business)
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!business?.coverImage) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCoverImageUrl(null)
            return
        }
        const url = URL.createObjectURL(business.coverImage)
        setCoverImageUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [business?.coverImage])

    const dayGroups = groupBusinessDays(business?.businessDays ?? [])

    return (
        <div className={cn("space-y-2", className)}>
            <Card className="p-0 overflow-hidden">
                <CardContent className="p-0">
                    <div className="w-full relative h-40 bg-muted">
                        <Image
                            src={coverImageUrl ?? "/salon-image-placeholder.jpg"}
                            fill
                            alt=""
                            className="object-cover"
                        />
                    </div>
                    <div className="w-full bg-white px-5 py-4 space-y-3">
                        <div>
                            <h2 className="text-base font-bold">
                                {business?.name || "Your business name"}
                            </h2>
                            {business?.address?.address && (
                                <div className="flex gap-1.5 items-center">
                                    <MapPin className="size-3.5 text-gray-400 shrink-0" />
                                    <p className="text-sm text-muted-foreground truncate">{business.address.address}</p>
                                </div>
                            )}
                        </div>

                        {(business?.tags?.length ?? 0) > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {business!.tags.map(tag => (
                                    <span key={tag} className="bg-muted text-xs py-1 px-3 rounded-full">{tag}</span>
                                ))}
                            </div>
                        )}

                        {dayGroups.length > 0 && (
                            <div className="flex items-start gap-2 pt-1">
                                <Calendar className="size-4 text-gray-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5">
                                    {dayGroups.map((group, i) => (
                                        <p key={i} className="text-xs text-muted-foreground">
                                            {group.start === group.end ? group.start : `${group.start}–${group.end}`}{' '}
                                            {group.openTime}–{group.closeTime}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            {caption && (
                <p className="text-xs text-muted-foreground text-center">{caption}</p>
            )}
        </div>
    )
}

export default BookingPagePreview
