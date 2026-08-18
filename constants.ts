export const CATEGORIES = [
    "All Categories",
    "Nails",
    "Hair",
    "Eyes",
    "Make-up"
]

// Completed bookings a business needs before it's marked verified.
export const VERIFICATION_THRESHOLD = 50

// Max services a business can list, matches the free-tier pricing copy.
export const MAX_SERVICES_PER_BUSINESS = 20

// Platform-wide policy: every booking takes this fraction of the service price
export const DEPOSIT_PERCENT = 0.5

// Statuses that still hold a slot and must be counted when checking for
// double-bookings or rendering blocked calendar slots. Everything else
// (cancelled_*, completed, no_show) has released the slot.
export const ACTIVE_BOOKING_STATUSES = [
    "pending",
    "upcoming",
    "in_progress",
] as const

// Minimum notice required to reschedule a booking, to stop users chaining
// last-minute reschedules to hold a slot indefinitely without forfeiting the deposit.
export const RESCHEDULE_MIN_NOTICE_HOURS = 48

// Window after a booking's end time during which a business can correct an
// auto-marked no_show back to completed (e.g. they forgot to click Start).
// Bounded so old no-shows can't be flipped to completed long after the fact
// just to pad the verification count.
export const NO_SHOW_CORRECTION_WINDOW_HOURS = 48

type BusinessDay = {
    shortName: string
    fullName: string
    openTime: string
    closeTime: string
}

export const BUSINESS_DAYS: BusinessDay[] = [
    {
        shortName: "M",
        fullName: "Monday",
        openTime: "08:00",
        closeTime: "18:00",

    },
    {
        shortName: "T",
        fullName: "Tuesday",
        openTime: "08:00",
        closeTime: "18:00",
    },
    {
        shortName: "W",
        fullName: "Wednesday",
        openTime: "08:00",
        closeTime: "18:00",
    },
    {
        shortName: "T",
        fullName: "Thursday",
        openTime: "08:00",
        closeTime: "18:00",
    },
    {
        shortName: "F",
        fullName: "Friday",
        openTime: "08:00",
        closeTime: "18:00",
    },
    {
        shortName: "S",
        fullName: "Saturday",
        openTime: "08:00",
        closeTime: "18:00",
    },
    {
        shortName: "S",
        fullName: "Sunday",
        openTime: "08:00",
        closeTime: "18:00",
    }
]