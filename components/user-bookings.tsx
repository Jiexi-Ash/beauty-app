"use client"
import { useMemo, useState } from 'react'
import MainLayout from './main-layout'
import Link from 'next/link'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Check, CaretLeft, CaretRight, CheckCircle, DotsThreeVertical, Star, Warning, X } from '@phosphor-icons/react'
import { useSearchParams } from 'next/navigation'
import { Preloaded, useAction, usePreloadedQuery, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { format, isSameDay } from 'date-fns'
import Image from 'next/image'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Id } from '@/convex/_generated/dataModel'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { ConvexError } from 'convex/values'
import { cn, formatBookingShortDate } from '@/lib/utils'
import NoBookings from './bookings/no-boookings'
import { RESCHEDULE_MIN_NOTICE_HOURS } from '@/constants'

interface PreloadedUserBookingsProps {
    preloadedBookings: Preloaded<typeof api.booking.user.getUserBookings>;
}

function PreloadedUserBookings({ preloadedBookings }: PreloadedUserBookingsProps) {
    const bookings = usePreloadedQuery(preloadedBookings);

    if (!bookings) return <NoBookings />

    return <UserBookings bookings={bookings} />
}

type Booking = {
    _creationTime: number
    _id: Id<"booking">
    bookingEndDate: number
    bookingPaymentId?: string
    bookingStartDate: number
    businessId: string
    notes?: string
    serviceId: string
    status:
    | "pending"
    | "upcoming"
    | "confirmed"
    | "declined"
    | "cancelled_by_user"
    | "cancelled_by_business"
    | "cancelled_by_payment_failed"
    | "completed"
    | string
    userId: Id<"users">
    service: {
        _creationTime: number
        _id: Id<"service">
        updatedAt?: number
        businessId: Id<"business">
        categoryId: Id<"categories">
        description: string
        duration: number
        name: string
        price: number
        primaryImageStorageId: string
        slug: string
        totalBookings: number
        visibility: "visible" | "hidden" | string
        serviceImage: string | null
    } | null
    business: {
        name: string
        location: string
        slug: string
        timezone: string
        coverImageUrl: string | null
    } | null
    review?: {
        rating: number
        comment?: string
    } | null
}

type BookingCardVariant = "upcoming" | "completed" | "cancelled"

interface BookingCardProps {
    booking: Booking
    variant: BookingCardVariant
}

function BookingCard({ booking, variant }: BookingCardProps) {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);

    const { mutate: cancelBooking } = useMutation({
        mutationFn: useConvexMutation(api.booking.user.cancelBooking),
        onSuccess: () => {
            toast.success("Appointment cancelled successfully");
            setCancelDialogOpen(false);

        },
        onError: (error) => {
            if (error instanceof ConvexError) {
                toast.error(
                    error.data || "An unknown error occurred while cancelling appointment.",
                );
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred while cancelling appointment.");
            }
        },
    });

    const [now] = useState(() => Date.now());

    const showDuration = variant === "upcoming"
    const showDropdown = variant === "upcoming"
    const showRebook = variant === "completed"
    const showReview = variant === "completed"
    const canReschedule = booking.bookingStartDate - now >= RESCHEDULE_MIN_NOTICE_HOURS * 60 * 60 * 1000

    const durationLabel = (() => {
        if (!showDuration) return null
        const durationHours = (booking.service?.duration ?? 0) / 60
        return `${durationHours} ${durationHours > 1 ? "hours" : "hour"}`
    })()

    return (

        <>
            <Card className="rounded-2xl ring-1 ring-black/5 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 shrink-0">
                            <div className="h-14 w-14 rounded-full relative overflow-hidden">
                                <Image src={booking.business?.coverImageUrl ?? ""} alt={`${booking.business?.name} photo`} fill className="object-cover" />
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="font-headline font-bold">{booking.business?.name}</h2>
                            <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap text-sm">
                                <p className="capitalize font-medium">{booking.service?.name}</p>
                                <span className="text-muted-foreground/50">&bull;</span>
                                <span>{formatBookingShortDate(booking.bookingStartDate, booking.business?.timezone)}</span>
                            </div>
                            {showDuration && (
                                <span className="text-sm text-muted-foreground">{durationLabel}</span>
                            )}
                        </div>
                    </div>

                    {showDropdown && (
                        <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                                <DotsThreeVertical weight="bold" className="text-muted-foreground size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                                    <DropdownMenuItem
                                        disabled={!canReschedule}
                                        onClick={() => setRescheduleOpen(true)}
                                    >
                                        {canReschedule
                                            ? "Reschedule appointment"
                                            : `Reschedule (unavailable within ${RESCHEDULE_MIN_NOTICE_HOURS}h)`}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setCancelDialogOpen(true)}>
                                        Cancel appointment
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {(showRebook || showReview) && (
                        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                            {showReview && (
                                booking.review ? (
                                    <div className="flex items-center gap-0.5" title={`You rated this ${booking.review.rating} out of 5`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                weight="fill"
                                                className={cn(
                                                    "size-3.5",
                                                    i < booking.review!.rating ? "text-amber-500" : "text-muted-foreground/25",
                                                )}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Button
                                        className="text-primary"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReviewOpen(true)}
                                    >
                                        Leave a review
                                    </Button>
                                )
                            )}
                            {showRebook && (
                                <Button className="text-primary" variant="ghost" size="sm">Rebook</Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Warning className="size-8 text-amber-500 shrink-0 text-center w-full" />
                        <AlertDialogTitle className="w-full text-center font-headline">Cancel Appointment?</AlertDialogTitle>
                        <AlertDialogDescription className="w-full text-center space-y-2" render={<div />}>
                            <span className="block text-muted-foreground font-medium">This action cannot be undone.</span>
                            <span className="block text-destructive font-medium text-center">
                                Deposits are non-refundable. You will not receive a refund for any payment made.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="lg:justify-center">
                        <AlertDialogCancel className="rounded-full">Keep Appointment</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => cancelBooking({ bookingId: booking._id })}
                            className="bg-destructive text-white hover:bg-destructive/90 rounded-full"
                        >
                            Cancel Appointment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >

            <RescheduleBookingModal
                open={rescheduleOpen}
                onOpenChange={setRescheduleOpen}
                booking={booking}
            />

            {showReview && (
                <ReviewDialog
                    open={reviewOpen}
                    onOpenChange={setReviewOpen}
                    booking={booking}
                />
            )}

        </>
    )
}


type RescheduleSlot = {
    start: string
    end: string
    startTimestamp: number
    endTimestamp: number
}

const toNoonUTC = (d: Date) =>
    new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0))

interface RescheduleBookingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    booking: Booking
}

function RescheduleBookingModal({ open, onOpenChange, booking }: RescheduleBookingModalProps) {
    const [weekOffset, setWeekOffset] = useState(0)
    const [selectedDate, setSelectedDate] = useState<Date>(() => toNoonUTC(new Date(booking.bookingStartDate)))
    const [selectedSlot, setSelectedSlot] = useState<RescheduleSlot | null>(null)

    const rescheduleAction = useAction(api.booking.actions.rescheduleBooking)

    const { mutate: reschedule, isPending } = useMutation({
        mutationFn: (args: { bookingId: Id<"booking">; date: string; time: string }) =>
            rescheduleAction(args),
        onSuccess: () => {
            toast.success("Appointment rescheduled successfully")
            onOpenChange(false)
            setSelectedSlot(null)
        },
        onError: (error) => {
            if (error instanceof ConvexError) {
                toast.error(
                    (error.data as string) ||
                    "An unknown error occurred while rescheduling.",
                )
            } else if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unknown error occurred while rescheduling.")
            }
        },
    })

    const weekDays = useMemo(() => {
        const now = new Date()
        const base = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
        return Array.from({ length: 7 }, (_, i) =>
            new Date(base + (weekOffset * 7 + i) * 86_400_000),
        )
    }, [weekOffset])

    const blockedData = useQuery(
        api.business.public.getBlockedSlots,
        open && booking.business && booking.service
            ? {
                businessSlug: booking.business.slug,
                serviceId: booking.service._id,
                date: selectedDate.getTime(),
            }
            : "skip",
    )

    const slots = useMemo<RescheduleSlot[]>(() => {
        if (!blockedData?.businessHours || !booking.service) return []

        const { businessHours, maxConcurrent, allowBeyondClose, bufferMinutes, bookedSlots } =
            blockedData

        const now = Date.now()
        const [openH, openM] = businessHours.openTime.split(":").map(Number)
        const [closeH, closeM] = businessHours.closeTime.split(":").map(Number)

        const base = new Date(selectedDate)
        base.setHours(0, 0, 0, 0)

        const openTime = new Date(base).setHours(openH, openM, 0, 0)
        const closeTime = new Date(base).setHours(closeH, closeM, 0, 0)
        const durationMs = booking.service.duration * 60_000
        const bufferMs = bufferMinutes * 60_000

        const available: RescheduleSlot[] = []
        let slotStart = openTime

        while (slotStart < closeTime) {
            const slotEnd = slotStart + durationMs

            if (!allowBeyondClose && slotEnd > closeTime) break
            if (allowBeyondClose && slotStart >= closeTime) break

            if (slotStart > now) {
                // Exclude the current booking from the blocked list so its own slot
                // doesn't appear as unavailable in the UI.
                const overlapping = bookedSlots.filter(
                    (b) =>
                        b.start < slotEnd &&
                        b.end > slotStart &&
                        !(b.start === booking.bookingStartDate && b.end === booking.bookingEndDate),
                )

                if (overlapping.length < maxConcurrent) {
                    available.push({
                        start: format(new Date(slotStart), "HH:mm"),
                        end: format(new Date(slotEnd), "HH:mm"),
                        startTimestamp: slotStart,
                        endTimestamp: slotEnd,
                    })
                }
            }

            slotStart += durationMs + bufferMs
        }

        return available
    }, [blockedData, selectedDate, booking])

    const weekStart = weekDays[0]
    const weekEnd = weekDays[6]
    const monthLabel =
        format(weekStart, "MMMM") === format(weekEnd, "MMMM")
            ? format(weekStart, "MMMM yyyy")
            : `${format(weekStart, "MMM")} – ${format(weekEnd, "MMM yyyy")}`

    const handleConfirm = () => {
        if (!selectedSlot) return
        reschedule({
            bookingId: booking._id,
            date: format(new Date(selectedSlot.startTimestamp), "yyyy-MM-dd"),
            time: format(new Date(selectedSlot.startTimestamp), "HH:mm"),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="font-headline font-bold">Reschedule Appointment</DialogTitle>
                    <DialogDescription>
                        Pick a new date and time for your <span className="font-bold capitalize">{booking.service?.name}</span> appointment at{" "}
                        <span className="font-bold text-primary">{booking.business?.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{monthLabel}</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setWeekOffset((o) => Math.max(0, o - 1))
                                    setSelectedSlot(null)
                                }}
                                disabled={weekOffset === 0}
                                className="size-8 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                            >
                                <CaretLeft className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setWeekOffset((o) => o + 1)
                                    setSelectedSlot(null)
                                }}
                                className="size-8 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-muted transition-colors"
                            >
                                <CaretRight className="size-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
                        {weekDays.map((day) => {
                            const isSelected = isSameDay(day, selectedDate)
                            return (
                                <button
                                    type="button"
                                    key={day.toISOString()}
                                    onClick={() => {
                                        setSelectedDate(toNoonUTC(day))
                                        setSelectedSlot(null)
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center rounded-xl transition-all shrink-0 w-14 h-16",
                                        isSelected
                                            ? "bg-primary text-white shadow"
                                            : "bg-muted hover:bg-muted/70",
                                    )}
                                >
                                    <span className={cn(
                                        "text-[10px] uppercase font-semibold tracking-wide",
                                        isSelected ? "text-white/75" : "text-muted-foreground",
                                    )}>
                                        {format(day, "EEE")}
                                    </span>
                                    <span className="text-lg font-bold mt-0.5">{format(day, "d")}</span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {blockedData === undefined ? (
                            <div className="grid grid-cols-3 gap-2" aria-busy="true" aria-label="Loading available slots">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-10 rounded-lg bg-muted animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : blockedData === null ? (
                            <p className="text-sm text-muted-foreground">Not open on this day.</p>
                        ) : slots.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No available slots for this day.</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {slots.map((slot) => {
                                    const isSelected = selectedSlot?.startTimestamp === slot.startTimestamp
                                    const isCurrent =
                                        slot.startTimestamp === booking.bookingStartDate &&
                                        slot.endTimestamp === booking.bookingEndDate
                                    return (
                                        <Button
                                            variant="outline"
                                            type="button"
                                            key={slot.startTimestamp}
                                            onClick={() => !isCurrent && setSelectedSlot(slot)}
                                            disabled={isCurrent}
                                            className={cn(
                                                "rounded-lg py-2 px-3 text-sm font-semibold transition-all",
                                                isCurrent
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                                                    : isSelected
                                                        ? "bg-primary text-white shadow"
                                                        : "bg-muted hover:bg-muted/70",
                                            )}
                                            title={isCurrent ? "Current booking time" : undefined}
                                        >
                                            {slot.start}
                                            {isSelected && !isCurrent && <Check className="inline ml-1 size-3.5" />}
                                        </Button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            size="lg"
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedSlot || isPending}
                            size="lg"
                            className="rounded-full active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        >
                            {isPending ? "Rescheduling..." : "Confirm"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface ReviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    booking: Booking
}

function ReviewDialog({ open, onOpenChange, booking }: ReviewDialogProps) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState("")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const { mutate: submitReview, isPending } = useMutation({
        mutationFn: useConvexMutation(api.users.addBookingReview),
        onSuccess: () => {
            toast.success("Review submitted. Thanks for the feedback!")
            onOpenChange(false)
            setRating(0)
            setComment("")
        },
        onError: (error) => {
            if (error instanceof ConvexError) {
                setErrorMessage((error.data as string) || "Your review could not be submitted.")
            } else if (error instanceof Error) {
                setErrorMessage(error.message)
            } else {
                setErrorMessage("Your review could not be submitted.")
            }
        },
    })

    const handleSubmit = () => {
        if (rating < 1) return
        submitReview({ bookingId: booking._id, rating, comment: comment.trim() || undefined })
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-headline font-bold">Leave a review</DialogTitle>
                        <DialogDescription>
                            How was your <span className="font-bold capitalize">{booking.service?.name}</span> appointment at{" "}
                            <span className="font-bold text-primary">{booking.business?.name}</span>?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Rating">
                            {Array.from({ length: 5 }).map((_, i) => {
                                const value = i + 1
                                const filled = value <= (hoverRating || rating)
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        aria-label={`${value} star${value > 1 ? "s" : ""}`}
                                        aria-pressed={rating === value}
                                        onClick={() => setRating(value)}
                                        onMouseEnter={() => setHoverRating(value)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        disabled={isPending}
                                        className="p-1 transition-transform hover:scale-110 disabled:pointer-events-none"
                                    >
                                        <Star
                                            weight={filled ? "fill" : "regular"}
                                            className={cn("size-8", filled ? "text-amber-500" : "text-muted-foreground/40")}
                                        />
                                    </button>
                                )
                            })}
                        </div>

                        <div className="space-y-1.5">
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                                placeholder="Share a few words about your experience (optional)"
                                disabled={isPending}
                                maxLength={300}
                                className="min-h-24"
                            />
                            <p className="text-right text-xs text-muted-foreground">{comment.length}/300</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            size="lg"
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={rating < 1 || isPending}
                            size="lg"
                            className="rounded-full active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        >
                            {isPending ? "Submitting..." : "Submit review"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!errorMessage} onOpenChange={(next) => !next && setErrorMessage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Warning className="size-8 text-destructive shrink-0 text-center w-full" />
                        <AlertDialogTitle className="w-full text-center font-headline">Could not submit review</AlertDialogTitle>
                        <AlertDialogDescription className="w-full text-center">
                            {errorMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="lg:justify-center">
                        <AlertDialogAction onClick={() => setErrorMessage(null)} className="rounded-full">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

interface UserBookingsProps {
    bookings: Booking[]
}
function UserBookings({ bookings }: UserBookingsProps) {

    const [dismissed, setDismissed] = useState(false)
    const searchParams = useSearchParams()
    const isSuccess = searchParams.get("status") === "success"
    const [now] = useState(() => Date.now())

    const upcomingBookings = useMemo(() =>
        bookings?.filter(b => b.status === "upcoming" && b.bookingStartDate > now) ?? []
        , [bookings, now])

    const completedBookings = useMemo(() =>
        bookings?.filter(b => b.status === "completed") ?? []
        , [bookings])

    const cancelledBookings = useMemo(() =>
        bookings?.filter(b => b.status === "cancelled_by_user" || b.status === "cancelled_by_business" || b.status === "cancelled_by_payment_failed") ?? []
        , [bookings])

    const hasVisibleBookings = upcomingBookings.length > 0 || completedBookings.length > 0 || cancelledBookings.length > 0

    if (!hasVisibleBookings) return <NoBookings />
    
    return (
        <MainLayout>
            <div className="space-y-4 w-full">
                {isSuccess && !dismissed && (
                    <Card className="bg-secondary rounded-2xl ring-1 ring-primary/15">
                        <CardContent className="px-6">
                            <div className="flex gap-2 justify-between items-center">
                                <div className="flex gap-2 items-center">
                                    <CheckCircle weight="fill" className="text-primary size-6" />
                                    <p className="text-secondary-foreground font-medium">{"Appointment confirmed. You're all set"}</p>
                                </div>

                                <Button variant="ghost" size="icon-lg" onClick={() => setDismissed(true)}>
                                    <X className="text-secondary-foreground/60 size-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>)
                }
                <div>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="font-headline font-bold text-2xl">My Bookings</h1>
                            <p className="text-muted-foreground">Manage your upcoming sessions and history.</p>
                        </div>
                        <Tabs defaultValue="upcoming" className="w-full mt-3 md:mt-6">
                            <TabsList className="w-full rounded-full bg-muted p-1 py-6 md:w-fit">
                                <TabsTrigger className="rounded-full data-active:bg-primary data-active:text-white py-3 md:px-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" value="upcoming">Upcoming</TabsTrigger>
                                <TabsTrigger className="rounded-full data-active:bg-primary data-active:text-white py-3 md:px-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" value="completed">Completed</TabsTrigger>
                                <TabsTrigger className="rounded-full data-active:bg-primary data-active:text-white py-3 md:px-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" value="cancelled">Cancelled</TabsTrigger>
                            </TabsList>

                            <TabsContent value="upcoming" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    { upcomingBookings.map((booking) => (
                                        <BookingCard key={booking._id} booking={booking} variant="upcoming" />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="completed" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {completedBookings.map((booking) => (
                                        <BookingCard key={booking._id} booking={booking} variant="completed" />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="cancelled" className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {cancelledBookings.map((booking) => (
                                        <BookingCard key={booking._id} booking={booking} variant="cancelled" />
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

            </div>
        </MainLayout>
    )
}

export default PreloadedUserBookings
