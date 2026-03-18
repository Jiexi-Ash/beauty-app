"use client"

import { SetStateAction, Dispatch, useState } from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Image from "next/image"
import { useBusinessStore } from "@/stores/use-business"
import { ArrowLeft, CheckCircle2, CreditCard, StoreIcon } from "lucide-react"
import BusinessDetailForm from "./onboarding/business-details-form"
import { Button } from "./ui/button"
import PaymentForm from "./onboarding/payment-form"
import LaunchBusiness from "./onboarding/launch-business"
import Link from "next/link"

const stepIcons = [
    { icon: StoreIcon, label: "Business", step: "Details" },
    { icon: CreditCard, label: "Payment", step: "payment" },
    { icon: CheckCircle2, label: "Launch", step: "Launch" },
]

interface OnboardingProps {
    open: boolean,


}
function Onboarding({ open }: OnboardingProps) {

    const { step } = useBusinessStore()
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto p-0 gap-0 border-border bg-card">
                <div className="flex min-h-[560px]">
                    <div className="hidden md:flex w-[340px] shrink-0 flex-col items-center justify-center border-r border-border rounded-l-lg">
                        {/* Illustrations */}
                        <div className="max-w-[260px] mb-6 w-full">
                            {step === "Details" && (<Image
                                src="/online-shopping.svg"
                                width={200}
                                height={200}
                                className="w-full h-auto"
                                alt="Online shopping illustration"
                                priority
                            />)}
                            {step === "Payment" && (<Image
                                src="/online-transactions.svg"
                                width={200}
                                height={200}
                                className="w-full h-auto"
                                alt="Online shopping illustration"
                                priority
                            />)}
                            {step === "Launch" && (<Image
                                src="/completed.svg"
                                width={200}
                                height={200}
                                className="w-full h-auto"
                                alt="Online shopping illustration"
                                priority
                            />)}
                        </div>


                        <div className="px-6">
                            {step === "Details" && <>
                                <h3 className="text-lg font-bold text-primary text-center">Create your business</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">Set up your store profile</p>
                            </>}
                            {step === "Payment" && <>
                                <h3 className="text-lg font-bold text-primary text-center">Get paid seamlessly</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">Connect Payfast to start accepting payments instantly</p>
                            </>}
                            {step === "Launch" && <>
                                <h3 className="text-lg font-bold text-center text-primary">{"You're all set"}</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">Review your details and launch your business</p>
                            </>}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col py-6">
                        <DialogHeader className="mb-4 px-6">
                            <Button

                                variant="outline"
                                className="border h-10 border-primary mb-2 max-w-fit flex items-center"
                            >
                                <Link
                                    href="/"
                                    className="text-sm flex text-primary  items-center gap-1"
                                >
                                    <ArrowLeft className="w-5 h-5 ml-0.5" /> Create Business Later
                                </Link>
                            </Button>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                {step === "Details" && "Set up your Business"}
                                {step === "Payment" && "Payment setup"}
                                {step === "Launch" && "Launch your business"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                {step === "Details" && "Tell us about your business to get started"}
                                {step === "Payment" && "Connect your payment provider to accept bookings"}
                                {step === "Launch" && "Review everything before launching your business"}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex items-center gap-2 mb-3 px-6">
                            {stepIcons.map((s, i) => {
                                const Icon = s.icon;
                                const isActive = step === s.step;
                                const isDone = i < stepIcons.findIndex(s2 => s2.step === step);
                                return (
                                    <div key={i} className="flex items-center gap-2 flex-1">
                                        <div
                                            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors ${isDone
                                                ? "bg-primary text-primary-foreground"
                                                : isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                        </div>
                                        <span
                                            className={`text-xs font-medium hidden sm:inline ${isActive ? "text-foreground" : "text-muted-foreground"
                                                }`}
                                        >
                                            {s.label}
                                        </span>
                                        {i < stepIcons.length - 1 && (
                                            <div className={`flex-1 h-0.5 rounded ${isDone ? "bg-primary" : "bg-muted"}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex-1 overflow-y-auto px-6">
                            {step === "Details" && (
                                <BusinessDetailForm />
                            )}
                            {step === "Payment" && (
                                <PaymentForm />
                            )}
                            {step === "Launch" && (
                                <LaunchBusiness />
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default Onboarding