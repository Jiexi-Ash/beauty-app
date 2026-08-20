import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
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

export const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;


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

const addressSchema = z.object({
  address: z.string().min(1, "Choose an address from the suggestions"),
  placeId: z.string().min(1, "Choose an address from the suggestions"),
})

export type Address = z.infer<typeof addressSchema>;
export const businessSchema = z.object({
    name: z.string().min(3, "Business Name needs to be at least 3 characters long."),
    description: z.string().min(10, "Business description must have at least 10 characters").max(250),
    address:addressSchema,
    businessDays: z.array(businessDaySchema).min(1, "Choose at least one open day so clients can book you"),
    tags: z.array(z.string()).min(1, "Please select at least 1 tag").max(3, "You can only select up to 3 tags"),
    coverImage:z.custom<File | null>((val) => val instanceof File || val === null, {
        message: "Invalid file type",
      })
      .refine((file) => file !== null, "Add a cover photo to continue")
      .refine(
        (file) => !file || file.size <= MAX_COVER_IMAGE_SIZE,
        "Cover photo must be less than 5MB"
      )
      .refine(
        (file) => !file || file.type.startsWith("image/"),
        "Cover photo must be an image file"
      ),
})

export const paymentSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  settlementBank: z.string().min(1, "Please select your settlement bank"),
  settlementBankName: z.string(),
  accountNumber: z.string()
    .min(6, "Account number must be at least 6 digits")
    .max(12, "Account number must be at most 12 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  businessEmail: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});




export type Business = z.infer<typeof businessSchema>;
export type Payment = z.infer<typeof paymentSchema>;

interface BusinessState {
  step: "Details"  | "Payment" | "Launch";
  business: Business | null;
  payment: Payment | null;
  savedAt: number | null;
  setBusinessDetails: (business: Business) => void;
  setPaymentDetails: (payment: Payment) => void;
  setSteps: (step: BusinessState["step"]) => void;
  reset: () => void;
}

// Debounced localStorage; skips the write (and "Saved" timestamp bump) when the payload is unchanged.
const debouncedStorage = (): StateStorage => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastWritten: string | null = null;
  return {
    getItem: (name) =>
      typeof window === "undefined" ? null : localStorage.getItem(name),
    setItem: (name, value) => {
      if (typeof window === "undefined" || value === lastWritten) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        localStorage.setItem(name, value);
        lastWritten = value;
        useBusinessStore.setState({ savedAt: Date.now() });
      }, 800);
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(name);
    },
  };
};

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      step: "Details",
      business: null,
      payment: null,
      savedAt: null,
      setBusinessDetails: (business) => set({ business }),
      setPaymentDetails: (payment) => set({ payment }),
      setSteps: (step) => set({ step }),
      reset: () => {
        set({
          business: null,
          payment: null,
          step: "Details",
          savedAt: null,
        });
      },
    }),
    {
      name: "business-onboarding-draft",
      storage: createJSONStorage(debouncedStorage),
      partialize: (state) => ({
        step: state.step,
        payment: state.payment,
        business: state.business
          ? { ...state.business, coverImage: null }
          : null,
      }),
    }
  )
);
