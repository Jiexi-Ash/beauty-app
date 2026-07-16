"use client"

import { cn } from '@/lib/utils'
import { useBusinessStore } from '@/stores/use-business'

import { ArrowLeft, Check, CircleNotch } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import BusinessDetailForm from '@/components/onboarding/business-details-form'
import PaymentForm from '@/components/onboarding/payment-form'
import LaunchBusiness from '@/components/onboarding/launch-business'
import BookingPagePreview from '@/components/onboarding/booking-page-preview'
import { toast } from 'sonner'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ConvexError } from 'convex/values'
import { useConvexMutation } from '@convex-dev/react-query'
import { useRouter } from 'next/navigation'

type Step = "Details" | "Payment" | "Launch"

const STEPS: { key: Step; title: string; description: string }[] = [
    { key: "Details", title: "Your profile", description: "Name, photo & hours" },
    { key: "Payment", title: "How you get paid", description: "Bank & payouts" },
    { key: "Launch", title: "Review & go live", description: "Launch your page" },
]

const STEP_HEADINGS: Record<Step, { heading: string; subhead: string }> = {
    Details: {
        heading: "Set up your profile",
        subhead: "Tell clients who you are and when you're open.",
    },
    Payment: {
        heading: "Get paid",
        subhead: "Clients pay a deposit when they book. Paystack sends that money straight to your bank account — you never have to request a payout.",
    },
    Launch: {
        heading: "Review & go live",
        subhead: "Take a final look at your business profile. You can go live from your dashboard whenever you're ready to start taking bookings.",
    },
}

function SavedIndicator({ className }: { className?: string }) {
    const savedAt = useBusinessStore((s) => s.savedAt)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!savedAt) return
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true)
        const t = setTimeout(() => setVisible(false), 2000)
        return () => clearTimeout(t)
    }, [savedAt])

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-xs font-medium text-green-600 transition-opacity duration-300",
                visible ? "opacity-100" : "opacity-0",
                className,
            )}
            aria-live="polite"
        >
            <Check className="size-3.5" weight="bold" /> Saved
        </span>
    )
}

function Onboarding() {
    const router = useRouter()
    const [isSubmitting, setSubmitting] = useState(false)
    const [launchConfirmed, setLaunchConfirmed] = useState(false)
    const [formInstanceKey, setFormInstanceKey] = useState(0)
    const { setSteps, step, reset, business, payment } = useBusinessStore()

    const createBusiness = useAction(api.business.admin.createBusiness)
    const generateUploadUrl = useConvexMutation(api.business.admin.generateUploadUrl)

    const currentIndex = STEPS.findIndex((s) => s.key === step)
    const { heading, subhead } = STEP_HEADINGS[step]
    const showPreviewPanel = step !== "Launch"

    const handlePreviousStep = () => {
        if (step === "Payment") setSteps("Details")
        else if (step === "Launch") setSteps("Payment")
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

        if (!business.coverImage) {
            toast.error("Missing cover photo", {
                description: "Please re-add your cover photo before launching.",
            })
            setSteps("Details")
            return
        }

        try {
            setSubmitting(true)
            const uploadCoverImageUrl = await generateUploadUrl()
            const coverImageResult = await fetch(uploadCoverImageUrl, {
                method: "POST",
                headers: { "Content-Type": business.coverImage.type },
                body: business.coverImage,
            })

            if (!coverImageResult.ok) {
                throw new Error("Failed to upload cover photo")
            }

            const { storageId } = await coverImageResult.json()

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
            toast.success("Your salon is set up!", {
                description: "Add a service, then hit Go Live in the sidebar when you're ready to start taking bookings.",
            })
            router.push("/dashboard")

        } catch (error) {
            const errorMessage =
                error instanceof ConvexError
                    ? typeof error.data === "string"
                        ? error.data
                        : (error.data as { message: string }).message ?? "Something went wrong"
                    : "An unexpected error occurred"

            toast.error(errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="w-full min-h-screen bg-[#F5F5F5] flex flex-col">
            <header className="h-16 flex items-center bg-white w-full sticky top-0 z-50 border-b border-border">
                <div className="container mx-auto flex px-6 lg:px-8 2xl:px-0">
                    <Link href="/" className="flex items-center gap-3">
                        <ArrowLeft className="size-6 text-muted-foreground" />
                        <div className="text-xl font-bold">The <span className="text-primary">Beauty</span> App</div>
                    </Link>
                </div>
            </header>

            <div className="flex-1 w-full">
                <div className="container mx-auto px-6 lg:px-8 2xl:px-0 pt-6 pb-24">
                    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_340px] lg:gap-10">

                        <aside className="hidden lg:block">
                            <div className="sticky top-24 space-y-6">
                                <ol className="space-y-6">
                                    {STEPS.map((s, i) => {
                                        const isComplete = i < currentIndex
                                        const isCurrent = i === currentIndex
                                        return (
                                            <li key={s.key} className="flex gap-3">
                                                <div
                                                    className={cn(
                                                        "size-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                                                        isComplete && "bg-primary text-white border-primary",
                                                        isCurrent && "border-primary text-primary bg-white",
                                                        !isComplete && !isCurrent && "border-gray-200 text-gray-400 bg-white",
                                                    )}
                                                >
                                                    {isComplete ? <Check className="size-4" weight="bold" /> : i + 1}
                                                </div>
                                                <div className="pt-0.5">
                                                    <p className={cn("text-sm font-semibold", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                                        {s.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{s.description}</p>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ol>
                                <SavedIndicator />
                            </div>
                        </aside>

                        <main className="w-full max-w-2xl">
                            <div className="mb-8">
                                <div className="flex items-center justify-between gap-3">
                                    <h1 className="text-2xl md:text-3xl font-bold">{heading}</h1>
                                    <SavedIndicator className="lg:hidden" />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">{subhead}</p>

                                <div className="flex gap-2 mt-4 lg:hidden">
                                    {STEPS.map((s, i) => {
                                        const isComplete = i < currentIndex
                                        const isCurrent = i === currentIndex
                                        return (
                                            <div
                                                key={s.key}
                                                className={cn(
                                                    "h-1.5 flex-1 rounded-full transition-colors",
                                                    isComplete && "bg-primary",
                                                    isCurrent && "bg-primary/25 ring-1 ring-primary ring-inset",
                                                    !isComplete && !isCurrent && "bg-gray-200",
                                                )}
                                            />
                                        )
                                    })}
                                </div>
                            </div>

                            {step === "Details" && <BusinessDetailForm key={formInstanceKey} />}
                            {step === "Payment" && <PaymentForm />}
                            {step === "Launch" && <LaunchBusiness confirmed={launchConfirmed} setConfirmed={setLaunchConfirmed} />}
                        </main>

                        {/* Right: live preview (xl) */}
                        {showPreviewPanel && (
                            <aside className="hidden xl:block">
                                <div className="sticky top-24">
                                    <BookingPagePreview caption="Preview of your booking page." />
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </div>

            <footer className="sticky bottom-0 bg-white border-t border-border px-6 lg:px-8 2xl:px-0 h-20 flex items-center z-40">
                <div className="container mx-auto flex justify-between items-center w-full">
                    {step === "Details" ? (
                        <Button
                            variant="ghost"
                            className="h-12 px-4"
                            onClick={() => {
                                reset()
                                setFormInstanceKey((k) => k + 1)
                            }}
                        >
                            Reset
                        </Button>
                    ) : (
                        <Button variant="ghost" className="h-12 px-4" onClick={handlePreviousStep}>
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
                            className="h-12 px-8 rounded-full"
                            onClick={step === "Launch" ? handleLaunch : undefined}
                        >
                            {isSubmitting ? <CircleNotch className="text-white size-5 animate-spin" /> : step === "Launch" ? "Launch My Salon" : "Next Step"}
                        </Button>
                        {step === "Launch" && (
                            <p className="hidden sm:block text-[11px] text-muted-foreground">By launching, you agree to our Merchant Services Terms</p>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Onboarding
