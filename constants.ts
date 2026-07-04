export const CATEGORIES = [
    "All Categories",
    "Nails",
    "Hair",
    "Eyes",
    "Make-up"
]

// Completed bookings a business needs before it's marked verified.
export const VERIFICATION_THRESHOLD = 50

type BusinessDay = {
    shortName: string
    fullName: string
    openTime: string
    closeTime: string
  }

export const BUSINESS_DAYS:BusinessDay[] = [
    {
        shortName: "M",
        fullName: "Monday",
        openTime:"08:00",
        closeTime: "18:00",
        
    },
    {
        shortName: "T",
        fullName: "Tuesday",
        openTime:"08:00",
        closeTime: "18:00",
    },
    {
        shortName: "W",
        fullName: "Wednesday",
        openTime:"08:00",
        closeTime: "18:00",
    },
    {
        shortName: "T",
        fullName: "Thursday",
        openTime:"08:00",
        closeTime: "18:00",
    },
    {
        shortName: "F",
        fullName: "Friday",
        openTime:"08:00",
        closeTime: "18:00",
    },
    {
        shortName: "S",
        fullName: "Saturday",
        openTime:"08:00",
        closeTime: "18:00",
    },
    {
        shortName: "S",
        fullName: "Sunday",
        openTime:"08:00",
        closeTime: "18:00",
    }
  ]