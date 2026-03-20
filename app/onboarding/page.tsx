"use client"
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group"
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Business, BUSINESS_DAYS, businessSchema, useBusinessStore } from '@/stores/use-business'
import { useForm } from '@tanstack/react-form'
import { ArrowLeft, CameraIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import BusinessDetailForm from '@/components/onboarding/business-details-form'



function Onboarding() {
    const [visibleCount, setVisibleCount] = useState(1);
    const { business, setBusinessDetails, setSteps, step } = useBusinessStore()
    const subHeader =
        step === "Details" ? "Set up your business" : step === "Payment" ? "Payment Integration" : "Launch & Review"

    const onboardingHeader = step === "Details" ? "Business Details" : step === "Payment" ? "Get Paid" : "Review and Launch"
    const stepCounter = step === "Details" ? "1" : step === "Payment" ? "2" : "3"

    const form = useForm({
        defaultValues: {
            name: business?.name ?? "",
            description: business?.description ?? "",
            address: business?.address ?? "",
            businessDays: [{ ...BUSINESS_DAYS[0] }] as Business["businessDays"],
            coverImage: business?.coverImage ?? (null as File | null),
        },
        validators: {
            onSubmit: businessSchema,
        },
        onSubmit: ({ value }) => {
            setBusinessDetails({
                address: value.address,
                description: value.description,
                name: value.name,
                coverImage: value?.coverImage as File,
                businessDays: value.businessDays,

            });
            setSteps("Payment");
        },
    });



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

            <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8 2xl:px-0 mt-6">
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
            </div>

            <footer className="sticky bottom-0 bg-white border-t border-border px-6 lg:px-8 2xl:px-0 h-32 flex items-center">
                <div className="container mx-auto flex justify-between w-full max-w-xl">
                    <Button
                        variant="ghost"
                        className="h-14 px-8"
                        onClick={() => form.reset()}

                    >
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        form="business-details-form"
                        className="h-14 px-8"
                    >
                        Next Step
                    </Button>
                </div>
            </footer>
        </div>
    )
}

export default Onboarding