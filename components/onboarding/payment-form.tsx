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
import { ArrowLeft, ArrowRight, CreditCard } from "lucide-react";
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
            setSteps("confirm");
        },
    });
    return (
        <div className="space-y-4">
            <form
                id="payment-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="space-y-6"
            >
                <Card className="border-border bg-secondary/50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-foreground">PayFast Payment Gateway</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    We use PayFast to securely process payments. Create a PayFast account at{" "}
                                    <a href="https://www.payfast.co.za" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                                        payfast.co.za
                                    </a>{" "}
                                    and retrieve your Merchant ID.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3 bg-accent/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-foreground">How to find your Merchant ID:</h4>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Log in to your PayFast dashboard</li>
                        <li>Navigate to <span className="font-medium text-foreground">Settings → Merchant Settings</span></li>
                        <li>Copy your <span className="font-medium text-foreground">Merchant ID</span> number</li>
                        <li>Paste it in the field below</li>
                    </ol>
                </div>
                <FieldGroup>
                    <form.Field name="merchantId">
                        {(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Merchant ID{" "}
                                        <span className="text-gray-400">(Copy from Payfast)</span>
                                    </FieldLabel>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        placeholder="e.g. 10000100"
                                        autoComplete="off"
                                        className="py-4"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            );
                        }}
                    </form.Field>
                </FieldGroup>
            </form>

            <div>
                <Field orientation="horizontal">
                    <div className="py-4 w-full border-t border-border flex justify-between">
                        <Button type="button" className="h-10 px-4 py-2" variant="outline" onClick={() => setSteps("businessDetails")}>
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>

                        <Button type="submit" className="h-10 px-4 py-2" form="payment-form" >
                            Next
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </Field>
            </div>
        </div>
    );
};

export default PaymentForm;
