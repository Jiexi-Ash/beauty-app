"use client";

import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group";
import { Business, BUSINESS_DAYS, businessSchema, useBusinessStore } from "@/stores/use-business";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import ImageCropDialog, { CroppedFile } from "../image-cropper";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const IMAGE_UPLOAD_GUIDELINES = {
    galleryImages: {
        acceptedRatios: [
            { name: "Portrait 2:3", min: 0.63, max: 0.70 },
            { name: "Portrait 3:4", min: 0.71, max: 0.80 },
            { name: "Square 1:1", min: 0.95, max: 1.05 },
            { name: "Landscape 4:3", min: 1.25, max: 1.40 },
            { name: "Landscape 3:2", min: 1.45, max: 1.55 },
            { name: "Landscape 16:9", min: 1.70, max: 1.85 },
        ],
        minDimensions: {
            portrait: { width: 1080, height: 1440 },
            square: { width: 1500, height: 1500 },
            landscape: { width: 1440, height: 1080 },
        },
    },
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    maxImages: 5,
    acceptedFormats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

const BusinessDetailForm = () => {
    const { business, setBusinessDetails, setSteps } = useBusinessStore();
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [pendingCropFile, setPendingCropFile] = useState<{
        file: File;
        isPrimary: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        field: any;
    } | null>(null)

    const form = useForm({
        defaultValues: {
            name: business?.name ?? "",
            description: business?.description ?? "",
            address: business?.address ?? "",
            businessDays: [] as Business["businessDays"],
            coverImage: business?.coverImage ?? (null as File | null),
            startTime: business?.startTime ?? "08:00",
            endTime: business?.endTime ?? "18:00",
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
                startTime: value.startTime,
                endTime: value.endTime,

            });
            setSteps("Payment");
        },
    });

    const handleSelectCoverImage = (e: React.ChangeEvent<HTMLInputElement>, field: unknown) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return

        const file = files[0]
        if (!IMAGE_UPLOAD_GUIDELINES.acceptedFormats.includes(file.type)) {
            toast.error("Invalid file format", {
                description: "Please upload JPEG, PNG, or WebP images only",
            });
            return;
        }

        if (file.size > IMAGE_UPLOAD_GUIDELINES.maxFileSize) {
            toast.error("File too large", {
                description: `Max ${IMAGE_UPLOAD_GUIDELINES.maxFileSize / 1024 / 1024}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`,
            });
            return;
        }

        // open crop dialog
        setPendingCropFile({
            file,
            isPrimary: true,
            field
        })

    }

    const handleCropConfirm = (cropped: CroppedFile) => {
        if (!pendingCropFile) return

        const { field } = pendingCropFile

        field.handleChange(cropped.file)

        setCoverImage(cropped.url)

        setPendingCropFile(null);
    }


    return (
        <div className="space-y-1.5">
            <form
                id="business-details-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
            >
                <FieldGroup>
                    <form.Field name="name">
                        {(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
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
                                        placeholder="Katlego's Nail Bar"
                                        autoComplete="off"
                                        className={cn("h-9 placeholder:text-sm rounded-sm")}
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            );
                        }}
                    </form.Field>
                    <form.Field name="address">
                        {(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        placeholder="123 Main str, 1321"
                                        autoComplete="off"
                                        className={cn("h-9 placeholder:text-sm rounded-sm")}
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            );
                        }}
                    </form.Field>
                    <form.Field name="businessDays">
                        {(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Business Days</FieldLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {BUSINESS_DAYS.map((day) => {
                                            const isSelected = field.state.value.includes(day as typeof field.state.value[number]);
                                            return (
                                                <Button
                                                    variant={isSelected ? "default" : "outline"}
                                                    key={day}
                                                    size="sm"
                                                    type="button"
                                                    className={cn(
                                                        "rounded-sm text-sm capitalize",
                                                        isSelected ? "bg-primary text-white" : ""
                                                    )}
                                                    onClick={() => {
                                                        const days = field.state.value.includes(day as typeof field.state.value[number])
                                                            ? field.state.value.filter((d: typeof day) => d !== (day as typeof field.state.value[number]))
                                                            : [...field.state.value, day as typeof field.state.value[number]];
                                                        field.handleChange(days as typeof field.state.value);
                                                    }}
                                                >
                                                    {day}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            );
                        }}
                    </form.Field>
                    <form.Field name="description">
                        {(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                                    <InputGroup>
                                        <InputGroupTextarea
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Put you business description here. This can be a brief information of what you do"
                                            rows={6}
                                            className={cn("h-9 placeholder:text-sm rounded-sm min-h-24 resize-none")}
                                            aria-invalid={isInvalid}
                                        />
                                        <InputGroupAddon align="block-end">
                                            <InputGroupText className="tabular-nums">
                                                {field.state.value.length}/150 characters
                                            </InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            );
                        }}
                    </form.Field>

                    <Field className="">
                        <FieldLabel className="">Business Hours</FieldLabel>
                        <div className="flex items-center gap-3">
                            <form.Field name="startTime">
                                {(field) => {
                                    const isInvalid =
                                        field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <Input
                                                id={field.name}
                                                type="time"
                                                step="1"
                                                value={field.state.value}
                                                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none h-9 flex-1 rounded-sm"
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}

                            </form.Field>
                            <span>to</span>
                            <form.Field name="endTime">
                                {(field) => {
                                    const isInvalid =
                                        field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <Input
                                                id={field.name}
                                                type="time"
                                                step="1"
                                                value={field.state.value}
                                                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none h-9 flex-1 rounded-sm"
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}

                            </form.Field>
                        </div>
                    </Field>
                    <form.Field name="coverImage">
                        {(field) => {
                            const file = field.state.value as File | null;
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Business Cover Image</FieldLabel>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="file"
                                        accept="image/*"
                                        onBlur={field.handleBlur}
                                        onChange={(e) => handleSelectCoverImage(e, field)}
                                        aria-invalid={isInvalid}
                                        className={cn("h-9 placeholder:text-sm rounded-sm cursor-pointer")}
                                    />
                                    <FieldDescription>
                                        recommended: square image, max 5MB
                                    </FieldDescription>

                                    {/* Preview */}
                                    {file && coverImage && (

                                        <div className="max-w-[200px] h-[200px] rounded-lg">
                                            <div className="w-full h-full relative rounded-lg">
                                                <Image src={coverImage} className="object-cover rounded-lg" alt="Store Cover image preview" fill />
                                            </div>
                                        </div>

                                    )}

                                    {/* // @ts-expect-error - File validation causes deep type instantiation */}
                                    {isInvalid && (
                                        <FieldError errors={field.state.meta.errors as never} />
                                    )}
                                </Field>
                            );
                        }}
                    </form.Field>
                </FieldGroup>
            </form>

            <div className="py-4 w-full border-t border-border flex justify-between">
                <Button type="button" className="h-10 px-4 py-2" variant="outline" onClick={() => {
                    form.reset();
                    setCoverImage(null);
                }}>
                    Reset
                </Button>
                <Button type="submit" className="h-10 px-4 py-2" form="business-details-form" >
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
            </div>



            {pendingCropFile && (
                <ImageCropDialog
                    file={pendingCropFile.file}
                    isPrimary={pendingCropFile.isPrimary}
                    onCropConfirm={handleCropConfirm}
                    onCancel={() => setPendingCropFile(null)}
                />
            )}
        </div>
    );
};

export default BusinessDetailForm;
