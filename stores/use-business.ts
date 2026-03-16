import { create } from "zustand";
import * as z from "zod";


export const businessSchema = z.object({
    name: z.string(),
    description: z.string().min(10, "Business description must have at least 10 characters").max(250),
    address:z.string().min(10, "Business address must at least have 10 characters"),
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
  step: "businessDetails"  | "payment" | "confirm";
  business: Business | null;
  payment: Payment | null;
  setBusinessDetails: (business: Business) => void;
  setPaymentDetails: (payment: Payment) => void;
  setSteps: (step: BusinessState["step"]) => void;
  reset: () => void;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
step: "businessDetails",
business: null,
payment: null,
setBusinessDetails: (business) => set({business}),
setPaymentDetails: (payment) => set({payment}),
setSteps: (step) => set({step}),
reset: () => {
  set({
    business: null,
    payment: null,
    step: "businessDetails"
  })
},
}))
