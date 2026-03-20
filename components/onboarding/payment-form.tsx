"use client";

import { Button } from "@/components/ui/button";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { paymentSchema, useBusinessStore } from "@/stores/use-business";

import { useForm } from "@tanstack/react-form";
import { ArrowLeft, ArrowRight, CircleAlertIcon, CreditCard, LockIcon, ZapIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";


const PaymentForm = () => {
    const { payment, setSteps, setPaymentDetails } = useBusinessStore();
    const form = useForm({
        defaultValues: {
            merchantId: payment?.merchantId ?? ""
        },
        validators: {
            onSubmit: paymentSchema,
        },
        onSubmit: ({ value }) => {
            setPaymentDetails({
                merchantId: value.merchantId
            });
            setSteps("Launch");
        },
    });
    return (
        <div className="space-y-2 w-full flex justify-center">
            <form
                id="payment-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="w-full max-w-xl"
            >

                <FieldGroup>
                    <form.Field name="merchantId">
                        {(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid} className="w-full">
                                    <div className="flex gap-4 flex-col">
                                        <Card className="">
                                            <CardContent className="flex flex-col space-y-3">
                                                <FieldLabel htmlFor={field.name}>
                                                    Payfast Merchant ID
                                                    <span className="text-gray-400">(Copy from Payfast)</span>
                                                </FieldLabel>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                                                    aria-invalid={isInvalid}
                                                    placeholder="e.g. 10000100" autoComplete="off"
                                                    className="h-9 rounded-smh-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm "
                                                />

                                                <div className="bg-secondary p-3">
                                                    <div className="flex gap-2">
                                                        <CircleAlertIcon className="size-7 text-primary" />
                                                        <p className="text-sm">
                                                            Find your Merchant ID in your Payfast Dashboard under <span className="font-bold">Settings {'>'} </span>  <span className="font-bold">Business Profile</span>. Ensure you have enabled the <span className="font-bold">{'"Allow API access"'}</span> toggle
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className=" rounded-lg">
                                            <CardContent>

                                                <div className="bg-secondary p-3 space-y-3">
                                                    <h3 className="font-bold text-base">Why payfast?</h3>
                                                    <div className="flex items-center gap-2">
                                                        <ZapIcon className="size-5 text-primary" />
                                                        <p className="text-xs md:text-sm">Payments via PayFast settle quickly and reflect directly in your PayFast account.</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <LockIcon className="size-4 text-primary" />
                                                        <p className="text-xs md:text-sm">PCI Level 1 compliant security for your peace of mind.</p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <CreditCard className="size-5 text-primary" />
                                                        <p className="text-xs md:text-sm">Marketplace-ready: enter only your PayFast Merchant ID; no banking details required in this app.</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </Field>
                            );
                        }}
                    </form.Field>
                </FieldGroup>
            </form>


        </div>
    );
};

export default PaymentForm;


