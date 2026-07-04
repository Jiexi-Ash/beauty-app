"use client"
import { Business, useBusinessStore } from '@/stores/use-business'
import { Card, CardContent } from '../ui/card'
import Image from 'next/image'
import { CalendarCheck, Calendar, CaretRight, Clock, CreditCard, Eye, EyeSlash, MapPin, PencilSimple, Storefront } from '@phosphor-icons/react'
import { Separator } from '../ui/separator'
import { useState, useEffect } from 'react'

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

function LaunchBusiness({ confirmed, setConfirmed }: { confirmed: boolean; setConfirmed: (v: boolean) => void }) {
    const { business, payment, setSteps } = useBusinessStore()
    const [showAccountNumber, setShowAccountNumber] = useState(false)
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!business?.coverImage) return;
        const url = URL.createObjectURL(business.coverImage);
        setCoverImageUrl(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [business?.coverImage]);

    const accountNumber = payment?.accountNumber ?? ''
    const maskedAccountNumber = accountNumber.length > 4
        ? '•'.repeat(accountNumber.length - 4) + accountNumber.slice(-4)
        : accountNumber

    return (
        <div className="w-full max-w-xl space-y-3">

            {/* Top row */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            <Storefront className="size-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Primary Identity</p>
                                <h3 className="font-bold text-base">{business?.name}</h3>
                            </div>
                        </div>
                        <Separator className="mt-4 mb-3" />
                        <button
                            type="button"
                            onClick={() => setSteps("Details")}
                            className="flex gap-2 items-center uppercase font-bold text-primary text-xs tracking-wide"
                        >
                            Edit
                            <PencilSimple className="size-3" />
                        </button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-3">
                        <Clock className="size-5 text-primary" />
                        <div className="flex items-start gap-2">
                            <MapPin className="size-4 text-gray-300 shrink-0 mt-0.5" />
                            <p className="text-xs truncate">{business?.address.address}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar className="size-4 text-gray-300 shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                                {groupBusinessDays(business?.businessDays ?? []).map((group, i) => (
                                    <p key={i} className="text-xs">
                                        {group.start === group.end ? group.start : `${group.start}–${group.end}`}{' '}
                                        {group.openTime}–{group.closeTime}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Banking & Contact */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="size-4 text-primary" />
                        <h3 className="text-sm font-semibold">Banking & Contact</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bank Name</p>
                            <p className="text-sm font-medium">{payment?.settlementBankName ?? payment?.settlementBank}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Business Email</p>
                            <p className="text-sm font-medium truncate">{payment?.businessEmail}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Account Number</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium font-mono tracking-wider">
                                    {showAccountNumber ? accountNumber : maskedAccountNumber}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowAccountNumber(v => !v)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showAccountNumber
                                        ? <EyeSlash className="size-3.5" />
                                        : <Eye className="size-3.5" />
                                    }
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Phone Number</p>
                            <p className="text-sm font-medium">{payment?.phone}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Preview */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Profile Preview</p>
            <Card className="p-0 overflow-hidden">
                <CardContent className="p-0">
                    <div className="w-full relative h-40">
                        <Image
                            src={coverImageUrl ?? "/salon-image-placeholder.jpg"}
                            fill
                            alt=""
                            className="object-cover"
                        />
                    </div>
                    <div className="w-full bg-white px-5 py-4 space-y-3">
                        <div>
                            <h2 className="text-base font-bold">{business?.name}</h2>
                            <div className="flex gap-1.5 items-center">
                                <MapPin className="size-3.5 text-gray-400" />
                                <p className="text-sm text-muted-foreground truncate">{business?.address.address}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(business?.tags ?? []).map(tag => (
                                <span key={tag} className="bg-muted text-xs py-1 px-3 rounded-full">{tag}</span>
                            ))}
                        </div>
                        <div className="bg-[#F3F3F4] w-full flex items-center justify-between p-3 rounded-full">
                            <div className="flex gap-2 items-center">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <CalendarCheck className="size-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="uppercase text-[10px] tracking-tight text-muted-foreground">Next Available</span>
                                    <span className="font-semibold text-sm">Today, 15:00</span>
                                </div>
                            </div>
                            <CaretRight className="size-4 text-black" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={e => setConfirmed(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Everything looks good</span>
            </label>

        </div>
    )
}

export default LaunchBusiness
