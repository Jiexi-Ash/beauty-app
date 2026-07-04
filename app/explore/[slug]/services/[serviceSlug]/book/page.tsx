"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAction, useQuery } from "convex/react"
import { notFound, useParams } from "next/navigation"
import Image from "next/image"
import { useState, useMemo } from "react"
import { format, isSameDay } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { MapPin, ShieldCheck, Check, CaretLeft, CaretRight } from "@phosphor-icons/react"
import Link from "next/link"
import { SignInButton, useUser } from "@clerk/nextjs"
import * as z from "zod"
import { useForm } from "@tanstack/react-form"
import { Field, FieldGroup } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import MainLayout from "@/components/main-layout"
import { BookingPageSkeleton } from "@/components/skeletons/booking-page"
import { toast } from "sonner"
import { ConvexError } from "convex/values"

const toNoonUTC = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0))

type Slot = {
  start: string
  end: string
  startTimestamp: number
  endTimestamp: number
}

const bookingSchema = z.object({
  serviceSlug: z.string(),
  fullName: z.string().min(1, "Required"),
  phoneNumber: z.string().min(10),
  notes: z.string(),
});


function BookServicePage() {
  const params = useParams<{ slug: string; serviceSlug: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>(() => toNoonUTC(new Date()))
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const bookSlot = useAction(api.booking.actions.bookSlot);
  const { user } = useUser()

  const service = useQuery(api.business.public.getBusinessServiceBySlug, {
    businessSlug: params.slug,
    serviceSlug: params.serviceSlug,
  })

  const form = useForm({
    defaultValues: {
      serviceSlug: params.serviceSlug ?? "",
      fullName: user?.fullName ?? "",
      phoneNumber: "",
      notes: "",

    },
    validators: {
      onSubmit: bookingSchema
    },
    onSubmit: async ({ value }) => {
      if (!selectedSlot) return;
      setIsSubmitting(true)
      try {
        const checkoutUrl = await bookSlot({
          serviceSlug: params.serviceSlug,
          businessSlug: params.slug,
          date: format(new Date(selectedSlot.startTimestamp), "yyyy-MM-dd"),
          time: format(new Date(selectedSlot.startTimestamp), "HH:mm"),
          fullName: value.fullName,
          phoneNumber: value.phoneNumber || undefined,
          notes: value.notes || undefined,
        });

        if (checkoutUrl) {
          window.location.href = checkoutUrl
        } else {
          toast.error("Failed to create booking session");
        }





      } catch (error) {
        setIsSubmitting(false)
        if (error instanceof ConvexError) {
          const { message } = error.data as { message: string; code: string };
          toast.error(message)
        } else {
          toast.error("An unexpected error occurred");
        }
        console.error("Booking failed:", error);
      }
    },
  })


  const weekDays = useMemo(() => {
    const now = new Date()
    const base = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base + (weekOffset * 7 + i) * 86_400_000)
    )
  }, [weekOffset])

  const blockedData = useQuery(
    api.business.public.getBlockedSlots,
    service
      ? {
        businessSlug: params.slug,
        serviceId: service._id as Id<"service">,
        date: selectedDate.getTime(),
      }
      : "skip",
  )

  // Generate slots entirely on the frontend using local time
  // This avoids all UTC offset issues — browser local time IS SA time for SA users
  const slots = useMemo<Slot[]>(() => {
    if (!blockedData?.businessHours || !service) return []

    const { businessHours, maxConcurrent, allowBeyondClose, bufferMinutes, bookedSlots } =
      blockedData

    const now = Date.now()

    const [openH, openM] = businessHours.openTime.split(":").map(Number)
    const [closeH, closeM] = businessHours.closeTime.split(":").map(Number)

    // Use local date from selectedDate — browser local time is SA time
    const base = new Date(selectedDate)
    base.setHours(0, 0, 0, 0)

    const openTime = new Date(base).setHours(openH, openM, 0, 0)
    const closeTime = new Date(base).setHours(closeH, closeM, 0, 0)
    const durationMs = service.duration * 60_000
    const bufferMs = bufferMinutes * 60_000

    const available: Slot[] = []
    let slotStart = openTime

    while (slotStart < closeTime) {
      const slotEnd = slotStart + durationMs

      if (!allowBeyondClose && slotEnd > closeTime) break
      if (allowBeyondClose && slotStart >= closeTime) break

      // past slot filter uses browser local time — always accurate for SA users
      if (slotStart > now) {
        const overlapping = bookedSlots.filter(
          (b) => b.start < slotEnd && b.end > slotStart
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
  }, [blockedData, selectedDate, service])

  if (service === undefined) {
    return <BookingPageSkeleton />
  }

  if (!service) {
    return notFound()
  }





  const weekStart = weekDays[0]
  const weekEnd = weekDays[6]
  const monthLabel =
    format(weekStart, "MMMM") === format(weekEnd, "MMMM")
      ? format(weekStart, "MMMM yyyy")
      : `${format(weekStart, "MMM")} – ${format(weekEnd, "MMM yyyy")}`

  const durationHours = Math.floor(service.duration / 60)
  const durationMinutes = service.duration % 60
  const durationLabel =
    durationHours > 0
      ? `${durationHours}${durationMinutes > 0 ? `.${durationMinutes}` : ""} hrs`
      : `${durationMinutes} min`

  // TODO: move to business settings or subscription tier config
  const depositPercent = 0.5

  // price stored in cents
  const priceRands = service.price / 100
  const depositDue = priceRands * 0.50


  const businessDisplayName = service.business.name ?? params.slug.replace(/-/g, " ")


  return (
    <MainLayout>
      <div className="mt-10">
        <Link
          href={`/explore/${params.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-6 hover:underline"
        >
          <CaretLeft className="size-4" />
          Back to Salon Profile
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-start">

          {/* ── Left column ── */}
          <div className="space-y-10">

            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Book Your{" "}
                <span className="text-primary italic">Appointment.</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-2 max-w-md leading-relaxed">
                Review your appointment details and secure your spot at Kasi&apos;s premium
                beauty destination.
              </p>
            </div>

            {/*  Dates */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold">Select Date &amp; Time</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{monthLabel}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setWeekOffset((o) => Math.max(0, o - 1))
                      setSelectedSlot(null)
                    }}
                    disabled={weekOffset === 0}
                    className="size-9 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
                  >
                    <CaretLeft className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      setWeekOffset((o) => o + 1)
                      setSelectedSlot(null)
                    }}
                    className="size-9 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <CaretRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Date cards */}
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] lg:overflow-visible lg:pb-0">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate)
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(toNoonUTC(day))
                        setSelectedSlot(null)
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-2xl transition-all snap-start shrink-0",
                        "w-[72px] h-[88px] lg:flex-1 lg:w-auto lg:h-24",
                        isSelected
                          ? "bg-primary text-white shadow-lg scale-105"
                          : "bg-white border border-foreground/10 hover:border-primary/30 hover:shadow-sm",
                      )}
                    >
                      <span className={cn(
                        "text-[11px] uppercase font-semibold tracking-wide",
                        isSelected ? "text-white/75" : "text-muted-foreground"
                      )}>
                        {format(day, "EEE")}
                      </span>
                      <span className="text-2xl font-black mt-0.5">{format(day, "d")}</span>
                    </button>
                  )
                })}
              </div>

              {/* Time slots */}
              <div className="mt-5">
                {blockedData === undefined ? (
                  <p className="text-sm text-muted-foreground">Loading slots...</p>
                ) : blockedData === null ? (
                  <p className="text-sm text-muted-foreground">Not open on this day.</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No available slots for this day.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTimestamp === slot.startTimestamp
                      return (
                        <button
                          key={slot.startTimestamp}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "rounded-2xl py-3 px-4 text-sm font-semibold transition-all",
                            isSelected
                              ? "bg-primary text-white shadow-md"
                              : "bg-gray-100 hover:bg-gray-200",
                          )}
                        >
                          {slot.start}
                          {isSelected && <Check className="inline ml-1.5 size-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>


            <form className="space-y-4"
              id="book-appointment"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <FieldGroup className="space-y-4">
                <h2 className="text-xl font-bold">Who&apos;s Coming?</h2>

                <div className="grid grid-cols-2 gap-4">
                  <form.Field name="fullName">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                            Fullname
                          </Label>
                          <Input
                            value={field.state.value}
                            className="mt-1.5 bg-transparent border-foreground/15 h-12 text-sm"
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </Field>
                      )

                    }}

                  </form.Field>
                  <form.Field name="phoneNumber">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                            Phone Number
                          </Label>
                          <Input
                            value={field.state.value}
                            className="mt-1.5 bg-transparent border-foreground/15 h-12 text-sm"
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </Field>
                      )

                    }}

                  </form.Field>

                </div>


                <form.Field name="notes">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                          Special Notes (Optional)
                        </Label>
                        <Textarea
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Let us know about allergies or specific style requests..."
                          className="mt-1.5 bg-transparent border-foreground/15 min-h-[100px] text-sm"
                          maxLength={250}
                        />
                      </Field>
                    )

                  }}

                </form.Field>

              </FieldGroup>


            </form>


            <div className="lg:hidden">
              <ConfirmBooking
                isSubmitting={isSubmitting}
                service={service}
                businessDisplayName={businessDisplayName}
                durationLabel={durationLabel}
                priceRands={priceRands}
                depositPercent={depositPercent}
                depositDue={depositDue}
                selectedSlot={selectedSlot}
              />
            </div>

          </div>


          <div className="hidden lg:block sticky top-8">
            <ConfirmBooking
              isSubmitting={isSubmitting}
              service={service}
              businessDisplayName={businessDisplayName}
              durationLabel={durationLabel}
              priceRands={priceRands}
              depositPercent={depositPercent}
              depositDue={depositDue}
              selectedSlot={selectedSlot}
            />
          </div>

        </div>
      </div>
    </MainLayout>
  )
}


function ConfirmBooking({
  isSubmitting,
  service,
  businessDisplayName,
  durationLabel,
  priceRands,
  depositPercent,
  depositDue,
  selectedSlot,
}: {
  isSubmitting: boolean
  service: { name: string; primaryImage?: string | null; price: number }
  businessDisplayName: string
  durationLabel: string
  priceRands: number
  depositPercent: number
  depositDue: number
  selectedSlot: Slot | null
}) {
  const { isSignedIn } = useUser()
  const fullUrl = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-foreground/10 overflow-hidden">
      {service.primaryImage && (
        <div className="relative w-full h-48">
          <Image
            src={service.primaryImage}
            alt={service.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-5 space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Luxury Studio
          </span>
          <h3 className="text-xl font-black mt-2 capitalize">{businessDisplayName}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 capitalize">
            <MapPin className="size-3 shrink-0" />
            {businessDisplayName}
          </p>
        </div>

        <div className="border-t border-foreground/8 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold capitalize">{service.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Duration: {durationLabel}</p>
            </div>
            <span className="text-sm font-bold shrink-0">R{priceRands.toFixed(2)}</span>
          </div>
        </div>


        {selectedSlot && (
          <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
            <p className="text-[11px] uppercase font-semibold text-primary tracking-widest mb-0.5">
              Selected Time
            </p>
            <p className="text-sm font-bold">
              {selectedSlot.start} – {selectedSlot.end}
            </p>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Deposit ({(depositPercent * 100).toFixed(0)}%)</span>
          <span>R{depositDue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-black text-lg pt-3 border-t border-foreground/8">
          <span>Due Today</span>
          <span className="text-primary">R{depositDue.toFixed(2)}</span>
        </div>

        {isSignedIn ?
          <Button
            size="lg"
            className="w-full rounded-full text-base font-bold py-6 bg-primary hover:bg-primary/90"
            disabled={!selectedSlot || isSubmitting}
            type="submit"
            form="book-appointment"
          >
            {isSubmitting ? "Processing..." : "Confirm Appointment"}
          </Button > : <SignInButton mode="modal" fallbackRedirectUrl={fullUrl} >
            <Button
              size="lg"
              className="w-full rounded-full text-base font-bold py-6 bg-primary hover:bg-primary/90"
            >
              Sign In to Book An Appointment
            </Button>
          </SignInButton>
        }

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold pt-1">
          <ShieldCheck className="inline size-3 mr-1" />
          Secure SSL Payment
        </p>
      </div>
    </div>
  )
}

export default BookServicePage