"use client"

import { cn } from '@/lib/utils'
import { useBusinessStore } from '@/stores/use-business'

import { ArrowLeft, CircleNotch } from '@phosphor-icons/react'
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
    const [launchConfirmed, setLaunchConfirmed] = useState(false);
    const { setSteps, step, reset, business, payment } = useBusinessStore()

    const createBusiness = useAction(api.business.admin.createBusiness);
    const generateUploadUrl = useConvexMutation(api.business.admin.generateUploadUrl);

    const subHeader =
        step === "Payment" ? "Payment Integration" : "Launch & Review"

    const onboardingHeader = step === "Details" ? "Business Profile" : step === "Payment" ? "Get Paid" : "Review and Launch"
    const stepCounter = step === "Details" ? "1" : step === "Payment" ? "2" : "3"
    const stepPercentage = step === "Details" ? 33 : step === "Payment" ? 66 : 100

    const isWide = step === "Details" || step === "Payment"

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

        if (!payment?.businessName || !payment?.settlementBank || !payment?.accountNumber) {
            toast.error("Missing payment details", {
                description: "Please complete your bank details before launching.",
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
                address: business.address.address,
                placesId: business.address.placeId,
                businessDays: business.businessDays,
                coverImageStorageId: storageId,
                description: business.description,
                tags: business.tags,
                paystackBusinessName: payment.businessName,
                paystackBank: payment.settlementBank,
                paystackAccountNumber: payment.accountNumber,
                paystackEmail: payment.businessEmail,
                paystackPhone: payment.phone,
            })

            reset()
            router.push("/dashboard")

        } catch (error) {
            const errorMessage =
                error instanceof ConvexError
                    ? typeof error.data === "string"
                        ? error.data
                        : (error.data as { message: string }).message ?? "Something went wrong"
                    : "An unexpected error occurred";

            toast.error(errorMessage);
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="w-full min-h-screen bg-[#F5F5F5] flex flex-col justify-center">
            <header className="h-16 flex items-center bg-white w-full sticky top-0 z-50">
                <div className="container mx-auto flex px-6 lg:px-8 2xl:px-0">
                    <Link href="/" className="flex items-center gap-3">
                        <ArrowLeft className="size-6 text-muted-foreground" />
                        <div className="text-xl font-bold">The <span className="text-primary">Beauty</span> App</div>
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center px-6 lg:px-8 2xl:px-0 mt-6 pb-16">
                <div className={cn("w-full", isWide ? "max-w-5xl" : "max-w-xl")}>

                    {/* Step progress */}
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="uppercase text-primary font-bold text-xs tracking-wider">Step {stepCounter} of 3</p>
                                <h1 className="text-2xl md:text-3xl font-bold mt-1">{onboardingHeader}</h1>
                            </div>
                            <p className="text-sm text-gray-400 font-medium pb-1">{stepPercentage}% Complete</p>
                        </div>
                        <div className="w-full h-0.5 bg-gray-200">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${stepPercentage}%` }}
                            />
                        </div>
                        {step !== "Details" && (
                            <p className="text-sm text-gray-400 mt-3">{subHeader}</p>
                        )}
                        {step === "Payment" && <p className="text-sm max-w-xs md:max-w-lg text-gray-400">Connect your business to the most trusted payment gateway.</p>}
                        {step === "Launch" && <p className="text-sm max-w-xs md:max-w-sm text-gray-400">Take a final look at your business profile before going live.</p>}
                    </div>

                    {step === "Details" && <BusinessDetailForm setVisibleCount={setVisibleCount} visibleCount={visibleCount} />}
                    {step === "Payment" && <PaymentForm />}
                    {step === "Launch" && <LaunchBusiness confirmed={launchConfirmed} setConfirmed={setLaunchConfirmed} />}
                </div>
            </div>

            <footer className="sticky bottom-0 bg-white border-t border-border px-6 lg:px-8 2xl:px-0 h-32 flex items-center">
                <div className={cn("container mx-auto flex justify-between w-full", isWide ? "max-w-5xl" : "max-w-xl")}>
                    {step === "Details" && (
                        <Button
                            variant="ghost"
                            className="h-14 px-8"
                            onClick={() => reset()}
                        >
                            Reset
                        </Button>
                    )}
                    {step !== "Details" && (
                        <Button
                            variant="ghost"
                            className="h-14 px-8"
                            onClick={handlePreviousStep}
                        >
                            Back
                        </Button>
                    )}
                    <div className="flex flex-col items-end gap-1">
                        <Button
                            type={step === "Details" || step === "Payment" ? "submit" : "button"}
                            disabled={isSubmitting || (step === "Launch" && !launchConfirmed)}
                            form={
                                step === "Details" ? "business-details-form"
                                    : step === "Payment" ? "payment-form"
                                        : undefined
                            }
                            className="h-14 px-8"
                            onClick={step === "Launch" ? handleLaunch : undefined}
                        >
                            {isSubmitting ? <CircleNotch className="text-white size-5 animate-spin" /> : step === "Launch" ? "Launch My Salon" : "Next Step"}
                        </Button>
                        {step === "Launch" && (
                            <p className="text-[11px] text-muted-foreground">By launching, you agree to our Merchant Services Terms</p>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Onboarding
