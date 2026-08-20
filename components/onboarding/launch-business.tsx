"use client"
import { useBusinessStore } from '@/stores/use-business'
import { Card, CardContent } from '../ui/card'
import { Calendar, Clock, CreditCard, Eye, EyeSlash, MapPin, PencilSimple, Storefront } from '@phosphor-icons/react'
import { Separator } from '../ui/separator'
import { useState } from 'react'
import BookingPagePreview, { groupBusinessDays } from './booking-page-preview'

function LaunchBusiness({ confirmed, setConfirmed }: { confirmed: boolean; setConfirmed: (v: boolean) => void }) {
    const { business, payment, setSteps } = useBusinessStore()
    const [showAccountNumber, setShowAccountNumber] = useState(false)

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
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Location &amp; Hours</p>
                        <div className="flex items-start gap-2">
                            <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs truncate">{business?.address.address}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar className="size-4 text-muted-foreground shrink-0 mt-0.5" />
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
            <BookingPagePreview />

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
