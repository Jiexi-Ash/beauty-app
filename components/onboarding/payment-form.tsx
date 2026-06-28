"use client";

import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { paymentSchema, useBusinessStore } from "@/stores/use-business";
import { useForm } from "@tanstack/react-form";
import { CircleAlertIcon, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const PAYSTACK_BENEFITS = [
    "Paid settlements directly to your South African bank account",
    "PCI DSS Level 1 certified security for all transactions",
    "Seamlessly integrated with local banking infrastructure",
];

const PaymentForm = () => {
    const { payment, setSteps, setPaymentDetails } = useBusinessStore();

    const fetchBankList = useAction(api.paystack.actions.getBankList);
    const { data: banks = [], isLoading: banksLoading } = useQuery<{ id: number; name: string; code: string }[]>({
        queryKey: ["paystack-banks"],
        queryFn: () => fetchBankList({}),
        staleTime: 1000 * 60 * 60,
    });

    const form = useForm({
        defaultValues: {
            businessName: payment?.businessName ?? "",
            settlementBank: payment?.settlementBank ?? "",
            settlementBankName: payment?.settlementBankName ?? "",
            accountNumber: payment?.accountNumber ?? "",
            businessEmail: payment?.businessEmail ?? "",
            phone: payment?.phone ?? "",
        },
        validators: {
            onSubmit: paymentSchema,
        },
        onSubmit: ({ value }) => {
            setPaymentDetails(value);
            setSteps("Launch");
        },
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start w-full">

            {/* Left: form card */}
            <form
                id="payment-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="lg:col-span-3"
            >
                <Card>
                    <CardContent className="p-6">
                        <FieldGroup className="space-y-4">

                            <form.Field name="businessName">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Business Name</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                placeholder="Legal business name"
                                                autoComplete="off"
                                                className="h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field name="settlementBank">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Settlement Bank</FieldLabel>
                                            <select
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                aria-invalid={isInvalid}
                                                disabled={banksLoading}
                                                className="h-9 w-full bg-[#F3F3F4] rounded-sm border border-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                onChange={(e) => {
                                                    field.handleChange(e.target.value);
                                                    const selected = banks.find(b => b.code === e.target.value);
                                                    form.setFieldValue('settlementBankName', selected?.name ?? '');
                                                }}
                                            >
                                                <option value="" disabled>
                                                    {banksLoading ? "Loading banks…" : "Select your bank"}
                                                </option>
                                                {banks.map((bank) => (
                                                    <option key={bank.id} value={bank.code}>
                                                        {bank.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field name="accountNumber">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Account Number</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, ""))}
                                                aria-invalid={isInvalid}
                                                placeholder="e.g. 123456789"
                                                autoComplete="off"
                                                inputMode="numeric"
                                                className="h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field name="businessEmail">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Business Email</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                placeholder="hello@yourbusiness.com"
                                                autoComplete="off"
                                                type="email"
                                                className="h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <form.Field name="phone">
                                {(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Primary Contact Phone</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                placeholder="+27 00 000 0000"
                                                autoComplete="off"
                                                type="tel"
                                                className="h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <div className="bg-secondary rounded-sm p-3 flex gap-2.5 mt-2">
                                <CircleAlertIcon className="size-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground/80">
                                    Provide your business banking details for automated settlements. We use Paystack to ensure secure and timely transfers to your account.
                                </p>
                            </div>

                        </FieldGroup>
                    </CardContent>
                </Card>
            </form>

            {/* Right: Why Paystack? */}
            <div className="lg:col-span-2">
                <Card className="bg-secondary border-0">
                    <CardContent className="p-6 space-y-5">

                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold">Why Paystack?</h3>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <ShieldCheck className="size-5 text-primary" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {PAYSTACK_BENEFITS.map((benefit) => (
                                <div key={benefit} className="flex items-start gap-2.5">
                                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-sm text-foreground/80 leading-snug">{benefit}</p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-lg overflow-hidden">
                            <img
                                src="/salon-image-placeholder.jpg"
                                alt="Payment terminal"
                                className="w-full h-36 object-cover rounded-lg"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
};

export default PaymentForm;
