"use client";

import { Button } from "@/components/ui/button";
import {
    Field,
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
import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import ImageCropDialog, { CroppedFile } from "../image-cropper";
import { CameraIcon } from "lucide-react";
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

interface BusinessDetailFormProps {
    visibleCount: number,
    setVisibleCount: React.Dispatch<React.SetStateAction<number>>
}
const BusinessDetailForm = ({ setVisibleCount, visibleCount }: BusinessDetailFormProps) => {
    const { business, setBusinessDetails, setSteps } = useBusinessStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [pendingCropFile, setPendingCropFile] = useState<{
        file: File;
        isPrimary: boolean;
        primaryAspect: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        field: any;
    } | null>(null)

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
            primaryAspect: 16 / 9,
            field
        })

    }

    const handleCropConfirm = (cropped: CroppedFile) => {
        if (!pendingCropFile) return

        const { field } = pendingCropFile

        field.handleChange(cropped.file)

        setCoverImage(cropped.url)

        setPendingCropFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleCropCancel = () => {
        setPendingCropFile(null)
        if (fileInputRef.current) fileInputRef.current.value = "" // and here
    }



    return (
        <>
            <form
                id="business-details-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="w-full max-w-xl"
            >
                <div className="w-full h-full">
                    <FieldGroup className="space-y-3">
                        <form.Field name="coverImage">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <Input
                                            id={field.name}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={(e) => handleSelectCoverImage(e, field)}
                                        />

                                        <div className="relative w-full h-40 md:h-72 bg-white rounded-lg shadow-lg overflow-hidden">
                                            <Image
                                                src={coverImage ?? "/salon-image-placeholder.jpg"}
                                                fill
                                                className="object-cover rounded-lg p-2"
                                                alt="image placeholder"
                                            />
                                            <div
                                                className="group hover:bg-white/40 duration-200 ease-in-out absolute flex flex-col gap-2 items-center justify-center inset-0 bg-white/60 z-10 m-2 rounded cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <div className="bg-secondary w-14 h-14 rounded-full flex justify-center items-center">
                                                    <CameraIcon fill="#EB3368" className="size-8 text-white" />
                                                </div>
                                                <span className="text-black font-bold">
                                                    {coverImage ? "Change Cover Photo" : "Upload Cover Photo"}
                                                </span>
                                                <span className="text-sm">PNG, JPG 5MB</span>
                                            </div>
                                        </div>



                                    </Field>
                                );
                            }}
                        </form.Field>

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
                                            className={cn("h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm ")}
                                        />
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
                                                className={cn("h-9 placeholder:text-sm bg-[#F3F3F4] rounded-sm min-h-24 resize-none")}
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
                                            className={cn("h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm")}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                );
                            }}
                        </form.Field>

                        <form.Field name="businessDays">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                const visibleDays = BUSINESS_DAYS.slice(0, visibleCount);
                                const hasMoreDays = visibleCount < BUSINESS_DAYS.length;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Business Days</FieldLabel>
                                        <div className="flex flex-col gap-2">
                                            {visibleDays.map((day) => {
                                                const isSelected = field.state.value.some(
                                                    (d) => d.fullName === day.fullName
                                                );

                                                return (
                                                    <div
                                                        key={day.fullName}
                                                        className="w-full bg-white p-4 flex items-center gap-3 justify-between"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const isAlreadySelected = field.state.value.some(
                                                                    (d) => d.fullName === day.fullName
                                                                );
                                                                const updated = isAlreadySelected
                                                                    ? field.state.value.filter((d) => d.fullName !== day.fullName)
                                                                    : [...field.state.value, { ...day }];
                                                                field.handleChange(updated as Business["businessDays"]);
                                                            }}
                                                            className="flex items-center gap-3"
                                                        >
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-full text-sm flex items-center justify-center font-semibold",
                                                                isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                            )}>
                                                                {day.shortName}
                                                            </div>
                                                            <span className="font-semibold hidden md:block">{day.fullName}</span>
                                                        </button>

                                                        {isSelected ? (
                                                            <div className="flex gap-2 items-center">
                                                                <form.Field name={`businessDays[${field.state.value.findIndex(d => d.fullName === day.fullName)}].openTime`}>
                                                                    {(subField) => (
                                                                        <Input
                                                                            type="time"
                                                                            step="60"
                                                                            value={subField.state.value}
                                                                            className="appearance-none bg-background h-9 rounded-sm"
                                                                            onChange={(e) => subField.handleChange(e.target.value)}
                                                                        />
                                                                    )}
                                                                </form.Field>
                                                                <span>to</span>
                                                                <form.Field name={`businessDays[${field.state.value.findIndex(d => d.fullName === day.fullName)}].closeTime`}>
                                                                    {(subField) => (
                                                                        <Input
                                                                            type="time"
                                                                            step="60"
                                                                            value={subField.state.value}
                                                                            className="appearance-none bg-background h-9 rounded-sm"
                                                                            onChange={(e) => subField.handleChange(e.target.value)}
                                                                        />
                                                                    )}
                                                                </form.Field>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground font-medium px-3 py-1 bg-muted rounded-sm">
                                                                Closed
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Add Day button */}
                                            {hasMoreDays && (
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        const nextDay = BUSINESS_DAYS[visibleCount];
                                                        setVisibleCount((prev) => prev + 1);
                                                        field.handleChange([
                                                            ...field.state.value,
                                                            { ...nextDay },
                                                        ] as Business["businessDays"]);
                                                    }}
                                                    className="w-full h-10 mt-3 mb-6 border-border bg-none text-primary"
                                                    variant="outline"
                                                >
                                                    <span className="text-lg leading-none">+</span> Add Day
                                                </Button>
                                            )}
                                        </div>
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                );
                            }}
                        </form.Field>
                    </FieldGroup>
                </div>
            </form>

            {pendingCropFile && (
                <ImageCropDialog
                    file={pendingCropFile.file}
                    isPrimary={pendingCropFile.isPrimary}
                    onCropConfirm={handleCropConfirm}
                    primaryAspect={pendingCropFile.primaryAspect}
                    onCancel={handleCropCancel}
                />
            )}
        </>
    );
};

export default BusinessDetailForm;
