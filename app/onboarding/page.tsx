"use client"

import { cn } from '@/lib/utils'
import { useBusinessStore } from '@/stores/use-business'

import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import BusinessDetailForm from '@/components/onboarding/business-details-form'
import PaymentForm from '@/components/onboarding/payment-form'
import LaunchBusiness from '@/components/onboarding/launch-business'
import { toast } from 'sonner'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ConvexError } from 'convex/values'
import { useConvexMutation } from '@convex-dev/react-query'
import { useRouter } from 'next/navigation'



function Onboarding() {
    const router = useRouter()
    const [isSubmitting, setSubmitting] = useState(false)
    const [visibleCount, setVisibleCount] = useState(1);
    const { setSteps, step, reset, business, payment } = useBusinessStore()

    const createBusiness = useAction(api.business.admin.createBusiness);

    const generateUploadUrl = useConvexMutation(api.business.admin.generateUploadUrl);
    const subHeader =
        step === "Details" ? "Set up your business" : step === "Payment" ? "Payment Integration" : "Launch & Review"

    const onboardingHeader = step === "Details" ? "Business Details" : step === "Payment" ? "Get Paid" : "Review and Launch"
    const stepCounter = step === "Details" ? "1" : step === "Payment" ? "2" : "3"

    const handlePreviousStep = () => {
        if (step === "Payment") {
            setSteps("Details")
            return
        }
        if (step === "Launch") {
            setSteps("Payment")
            return
        }

    }

    const handleLaunch = async () => {
        if (!business) {
            toast.error("Missing business details", {
                description: "Please complete your business details before launching.",
            })
            setSteps("Details")
            return
        }

        if (!payment?.merchantId) {
            toast.error("Missing payment details", {
                description: "Please add your PayFast Merchant ID before launching.",
            })
            setSteps("Payment")
            return
        }

        try {
            setSubmitting(true)
            const uploadCoverImageUrl = await generateUploadUrl();
            const coverImageResult = await fetch(uploadCoverImageUrl, {
                method: "POST",
                headers: { "Content-Type": business.coverImage!.type },
                body: business.coverImage,
            });

            if (!coverImageResult.ok) {
                throw new Error("Failed to upload logo");
            }

            const { storageId } = await coverImageResult.json();

            await createBusiness({
                name: business.name,
                merchantId: payment.merchantId,
                address: business.address.address,
                placesId: business.address.placeId,
                businessDays: business.businessDays,
                coverImageStorageId: storageId,
                description: business.description,
            })

            reset()
            router.push("/dashboard")

        } catch (error) {
            const errorMessage =
                error instanceof ConvexError
                    ? (error.data as { message: string }).message
                    : "An unexpected error occurred";

            toast.error(errorMessage);
        } finally {
            setSubmitting(false)
        }

    }




    return (
        <div className="w-full min-h-screen bg-[#F5F5F5] flex flex-col justify-center">
            <header className="h-16 flex items-center bg-white w-full sticky top-0 z-50">
                <div className="container mx-auto flex px-6 lg:px-8  2xl:px-0">
                    <Link href="/" className="flex items-center gap-3">
                        <ArrowLeft className="size-6 text-muted-foreground" />
                        <div className="text-xl font-bold">The <span className="text-primary">Beauty</span> App</div>
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center  px-6 lg:px-8 2xl:px-0 mt-6">
                <div className="w-full max-w-xl">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="uppercase text-primary font-bold text-sm">Step {stepCounter} of 3</div>
                            <p className="tew-full text-sm text-gray-400 font-semibold">{subHeader}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className={cn(
                                "w-full h-2 rounded-full",
                                step === "Details" || step === "Payment" || step === "Launch"
                                    ? "bg-primary"
                                    : "bg-gray-200"
                            )}></div>
                            <div className={cn(
                                "w-full h-2 rounded-full",
                                step === "Payment" || step === "Launch"
                                    ? "bg-primary"
                                    : "bg-gray-200"
                            )}></div>
                            <div className={cn(
                                "w-full h-2 rounded-full",
                                step === "Launch" ? "bg-primary" : "bg-gray-200"
                            )}></div>
                        </div>
                        <div className="my-6">

                            <h1 className="text-xl md:text-2xl font-bold">{onboardingHeader}</h1>

                            {step === "Details" && <p className="text-sm max-w-xs md:max-w-lg text-gray-400 ">Set up your business details. This is what your customer will see.</p>}
                            {step === "Payment" && <p className="text-sm max-w-xs md:max-w-lg text-gray-400 ">Connect your business to the most trusted payment gateway.</p>}
                            {step === "Launch" && <p className="text-sm max-w-xs md:max-w-sm text-gray-400">Take a final look at your business profile before going live.</p>}

                        </div>
                    </div>

                </div>

                {step === "Details" && <BusinessDetailForm setVisibleCount={setVisibleCount} visibleCount={visibleCount} />}
                {step === "Payment" && <PaymentForm />}
                {step === "Launch" && <LaunchBusiness />}
            </div>

            <footer className="sticky bottom-0 bg-white border-t border-border px-6 lg:px-8 2xl:px-0 h-32 flex items-center">
                <div className="container mx-auto flex justify-between w-full max-w-xl">
                    {step === "Details" && (<Button
                        variant="ghost"
                        className="h-14 px-8"
                        onClick={() => reset()}
                    >
                        Reset
                    </Button>)}
                    {step !== "Details" && (
                        <Button
                            variant="ghost"
                            className="h-14 px-8"
                            onClick={handlePreviousStep}

                        >
                            Back
                        </Button>)}
                    <Button
                        type={step === "Details" || step === "Payment" ? "submit" : "button"}
                        disabled={isSubmitting}

                        form={
                            step === "Details" ? "business-details-form"
                                : step === "Payment" ? "payment-form"
                                    : undefined
                        }
                        className="h-14 px-8"
                        onClick={step === "Launch" ? handleLaunch : undefined}
                    >
                        {isSubmitting ? <Loader2 className="text-white size-5 animate-spin" /> : step === "Launch" ? "Launch Store" : "Next Step"}

                    </Button>
                </div>
            </footer>
        </div>
    )
}

export default Onboarding