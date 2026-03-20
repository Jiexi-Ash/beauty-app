import { create } from "zustand";
import * as z from "zod";


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


const businessDaySchema = z.object({
  shortName: z.string(),
  fullName: z.string(),
  openTime: z.string(),
  closeTime: z.string(),
}).refine(
  (day) => BUSINESS_DAYS.some(d => d.shortName === day.shortName && d.fullName === day.fullName),
  { message: "Invalid business day" }
).refine(
  (day) => !day.openTime || !day.closeTime || day.openTime < day.closeTime,
  { message: "Opening time must be before closing time" }
)

export const businessSchema = z.object({
    name: z.string().min(3, "Business Name needs to be at least 3 characters long."),
    description: z.string().min(10, "Business description must have at least 10 characters").max(250),
    address:z.string().min(10, "Business address must at least have 10 characters"),
    businessDays: z.array(businessDaySchema),
    coverImage:z.custom<File | null>((val) => val instanceof File || val === null, {
        message: "Invalid file type",
      })
      .refine((file) => file !== null, "Cover Image is required")
      .refine(
        (file) => !file || file.size <= 2 * 1024 * 1024,
        "Logo must be less than 2MB"
      )
      .refine(
        (file) => !file || file.type.startsWith("image/"),
        "Logo must be an image file"
      ),
})

export const paymentSchema = z.object({
  merchantId: z.string().max(10),
});



export type Business = z.infer<typeof businessSchema>;
export type Payment = z.infer<typeof paymentSchema>;

interface BusinessState {
  step: "Details"  | "Payment" | "Launch";
  business: Business | null;
  payment: Payment | null;
  setBusinessDetails: (business: Business) => void;
  setPaymentDetails: (payment: Payment) => void;
  setSteps: (step: BusinessState["step"]) => void;
  reset: () => void;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
step: "Details",
business: null,
payment: null,
setBusinessDetails: (business) => set({business}),
setPaymentDetails: (payment) => set({payment}),
setSteps: (step) => set({step}),
reset: () => {
  set({
    business: null,
    payment: null,
    step: "Details"
  })
},
}))
