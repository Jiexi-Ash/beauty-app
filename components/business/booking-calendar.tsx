"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "../ui/button"

export function BookingCalendar() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [timeZone, setTimeZone] = React.useState<string | undefined>(undefined)

    React.useEffect(() => {
        setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }, [])

    const bookedDates = Array.from(
        { length: 15 },
        (_, i) => new Date(new Date().getFullYear(), 0, 12 + i)
    )

    return (
        <Card className="mx-auto w-fit px-3">
            <CardHeader>
                <CardTitle className="font-bold">Reserve Your Spot</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Calendar
                    mode="single"
                    navLayout="after"
                    defaultMonth={date}
                    selected={date}
                    onSelect={setDate}
                    disabled={bookedDates}
                    modifiers={{
                        booked: bookedDates,
                    }}
                    modifiersClassNames={{
                        booked: "[&>button]:line-through opacity-100",
                    }}
                    timeZone={timeZone}
                />

                <div className="w-full mt-4">
                    <Button className="w-full" size="lg">Book Now</Button>
                </div>
            </CardContent>

        </Card>
    )
}
