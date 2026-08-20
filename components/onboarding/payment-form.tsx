"use client";

import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Payment, paymentSchema, useBusinessStore } from "@/stores/use-business";
import { useForm, useStore } from "@tanstack/react-form";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Card, CardContent } from "../ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

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
            onBlur: paymentSchema,
            onSubmit: paymentSchema,
        },
        onSubmit: ({ value }) => {
            setPaymentDetails(value);
            setSteps("Launch");
        },
    });

    const values = useStore(form.store, (state) => state.values);
    const saveDraft = useDebouncedCallback((v: typeof values) => {
        setPaymentDetails(v as Payment);
    }, 500);

    useEffect(() => {
        saveDraft(values);
    }, [values, saveDraft]);

    useEffect(() => {
        return () => {
            saveDraft.flush();
        };
    }, [saveDraft]);

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
                                                className="h-9 bg-surface-container-low placeholder:text-sm rounded-sm"
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
                                            {/* Native select: opens the OS picker on mobile, better for a long bank list than the custom ui/select popover */}
                                            <select
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                aria-invalid={isInvalid}
                                                disabled={banksLoading}
                                                className="h-9 w-full bg-surface-container-low rounded-sm border border-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className="h-9 bg-surface-container-low placeholder:text-sm rounded-sm"
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
                                                className="h-9 bg-surface-container-low placeholder:text-sm rounded-sm"
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
                                                className="h-9 bg-surface-container-low placeholder:text-sm rounded-sm"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            </form.Field>

                            <div className="bg-secondary rounded-sm p-3 flex gap-2.5 mt-2">
                                <WarningCircle className="size-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground/80">
                                    Provide the bank account where you&apos;d like your payouts to land.
                                </p>
                            </div>

                        </FieldGroup>
                    </CardContent>
                </Card>
            </form>

            {/* Right: How payouts work */}
            <div className="lg:col-span-2">
                <Card className="bg-secondary border-0">
                    <CardContent className="p-6 space-y-5">
                        <h3 className="text-base font-bold">How payouts work</h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-2.5">
                                <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" weight="fill" />
                                <p className="text-sm text-foreground/80 leading-snug">
                                    Deposits are collected securely by Paystack when a client books.
                                </p>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" weight="fill" />
                                <p className="text-sm text-foreground/80 leading-snug">
                                    Payouts settle to your bank account automatically within 48 hours of each booking.
                                </p>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" weight="fill" />
                                <p className="text-sm text-foreground/80 leading-snug">
                                    This account only receives payouts — Paystack never withdraws or charges anything from it. Our commission is already deducted from the client&apos;s deposit before it reaches you.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
};

export default PaymentForm;
