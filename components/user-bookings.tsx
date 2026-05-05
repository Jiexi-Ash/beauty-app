"use client"
import React, { useMemo, useState } from 'react'
import MainLayout from './main-layout'
import Link from 'next/link'
import { ArrowRight, CalendarDays, ChevronLeft, CircleCheck, Clock, XIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Preloaded, usePreloadedQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import Image from 'next/image'

interface UserBookingsProps {
    preloadedBookings: Preloaded<typeof api.booking.user.getUserBookings>;
}
function UserBookings({ preloadedBookings }: UserBookingsProps) {
    const [dismissed, setDismissed] = useState(false)
    const bookings = usePreloadedQuery(preloadedBookings);
    const searchParams = useSearchParams()
    const isSuccess = searchParams.get("status") === "success"

    const [now] = useState(() => Date.now())

    const upcomingBookings = useMemo(() =>
        bookings?.filter(b => b.status === "upcoming" && b.bookingStartDate > now) ?? []
        , [bookings, now])

    const completedBookings = useMemo(() =>
        bookings?.filter(b => b.status === "upcoming" && b.bookingEndDate <= now) ?? []
        , [bookings, now])

    const cancelledBookings = useMemo(() =>
        bookings?.filter(b => b.status === "cancelled_by_user" || b.status === "cancelled_by_business" || b.status === "cancelled_by_payment_failed") ?? []
        , [bookings])

    const nextAppointment = upcomingBookings[0] ?? null




    if (!bookings) {
        return <MainLayout>
            <Link
                href={`/explore`}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-6 hover:underline"
            >
                <ChevronLeft className="size-4" />
                Browse  Salons
            </Link>
        </MainLayout>
    }
    return (
        <MainLayout>
            <div className="py-4 space-y-4 w-full">
                {isSuccess && !dismissed && (
                    <Card className="bg-green-400 rounded-none ">
                        <CardContent className="px-6">
                            <div className="flex gap-2 justify-between items-center">
                                <div className="flex gap-2 items-center">
                                    <CircleCheck className="text-white size-6" />
                                    <p className="text-white">{"Booking confirmed. You're all set"}</p>
                                </div>

                                <Button variant="ghost" size="icon-lg" onClick={() => setDismissed(true)}>
                                    <XIcon className="text-white/80 size-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>)
                }
                <h1 className="px-6 font-bold text-2xl">Appointments</h1>
                {nextAppointment && (
                    <div className="space-y-4">
                        <Card className="rounded-none bg-primary px-2">
                            <CardHeader>
                                <CardTitle className="text-white font-bold">Next Up</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                {nextAppointment.business?.coverImageUrl && (
                                    <div className="w-28 h-28 relative">
                                        <Image fill src={nextAppointment.business.coverImageUrl} alt={nextAppointment.business.name ?? ""} className=" rounded-md object-cover" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <p className="text-sm text-white font-bold">{nextAppointment.business?.name}</p>
                                    <p className="font-medium text-white/80 capitalize">{nextAppointment.service?.name}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1 text-white/80">
                                            <CalendarDays className="size-4" />
                                            {format(new TZDate(nextAppointment.bookingStartDate, nextAppointment.business?.timezone ?? "Africa/Johannesburg"), "dd MMM yyyy")}
                                        </span>
                                        <span className="flex items-center gap-1 text-white/80">
                                            <Clock className="size-4" />
                                            {format(new TZDate(nextAppointment.bookingStartDate, nextAppointment.business?.timezone ?? "Africa/Johannesburg"), "HH:mm")}
                                        </span>
                                    </div>
                                    <Button size="lg" className="bg-white w-full rounded-none text-primary">
                                        Manage Booking
                                        <ArrowRight className="size-4 text-primary" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <h2 className="px-6 text-xl font-medium mt-6">History</h2>
                </div>

                <div className="my-6">

                    <p className="font-bold text-gray-400 text-center text-sm">Other recent and past appointments will appear here</p>
                </div>

            </div>
        </MainLayout>
    )
}

export default UserBookings