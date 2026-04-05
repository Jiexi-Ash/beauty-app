"use client";

import ImageCropDialog, { CroppedFile } from "@/components/image-cropper";
import { IMAGE_UPLOAD_GUIDELINES } from "@/components/onboarding/business-details-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Bell, CameraIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

const serviceSchema = z.object({
  name: z
    .string()
    .min(
      3,
      "Service name is required and needs to be at least 3 characters long",
    ),
  category: z.string(),
  price: z.number().min(0, "Price must be a positive number"),
  description: z
    .string()
    .min(10, "service description is required and must be 10 characters long"),
  duration: z.number().min(0, "Price must be a positive number"),
  serviceImage: z
    .custom<File | null>((val) => val instanceof File || val === null, {
      message: "Invalid file type",
    })
    .refine((file) => file !== null, "Cover Image is required")
    .refine(
      (file) => !file || file.size <= 2 * 1024 * 1024,
      "Logo must be less than 2MB",
    )
    .refine(
      (file) => !file || file.type.startsWith("image/"),
      "Logo must be an image file",
    ),
});

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hr", value: 60 },
  { label: "2 hr", value: 120 },
  { label: "3 hr", value: 180 },
  { label: "4 hr", value: 240 },
];

const CATEGORY_OPTIONS = [
  { label: "Hair", value: "hair" },
  { label: "Nails", value: "nails" },
  { label: "Eyes", value: "eyes" },
  { label: "Skin & Facials", value: "skin_facials" },
  { label: "Makeup", value: "makeup" },
  { label: "Lashes & Brows", value: "lashes_brows" },
  { label: "Other", value: "other" },
];

function DashboardCreateServicePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<{
    file: File;
    isPrimary: boolean;
    primaryAspect: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      category: CATEGORY_OPTIONS[0].value,
      price: 100,
      description: "",
      duration: 60,
      serviceImage: null as File | null,
    },
    validators: {
      onSubmit: serviceSchema,
    },
    onSubmit: ({ value }) => {
      console.log(value);
    },
  });

  const handleSelectImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: unknown,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const file = files[0];
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
      primaryAspect: 4 / 3,
      field,
    });
  };

  const handleCropConfirm = (cropped: CroppedFile) => {
    if (!pendingCropFile) return;

    const { field } = pendingCropFile;

    field.handleChange(cropped.file);

    setServiceImage(cropped.url);

    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropCancel = () => {
    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen w-full">
      <header className="flex w-full justify-between items-center top-0 sticky lg:border-b border-border shadow-sm px-6 z-50 bg-white">
        <div className="flex gap-3 items-center h-20">
          <div className="relative w-12 h-12 rounded-full">
            <Image
              src={"/salon-image-placeholder.jpg"}
              alt={`${"Katlego nail's bar"} cover image`}
              fill
              className="rounded-full object-cover"
            />
          </div>

          <h1 className="text-base text-primary font-bold">
            {"Katlego's nail Bar"}
          </h1>
        </div>

        <div className="flex gap-4 items-center">
          <Bell className="size-6 text-gray-100" fill="#9CA3AF" />
        </div>
      </header>

      <div className="space-y-6 px-6 pt-4 pb-6">
        <div>
          <h1 className="text-2xl font-bold">Create New Service</h1>
          <p className="text-sm text-muted-foreground">
            Add a new service to your business to start taking bookings
          </p>
        </div>

        <Button
          variant="outline"
          className="text-primary h-10"
          onClick={() => router.back()}
          size="lg"
        >
          <ArrowLeft className="text-primary size-4" />
          Go Back
        </Button>

        <form
          id="service-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="w-full max-w-xl pl-1"
        >
          <FieldGroup className="space-y-3">
            <form.Field name="serviceImage">
              {/* ts.ignore */}
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className="">
                    <Input
                      id={field.name}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => handleSelectImage(e, field)}
                    />

                    <div className="relative w-2/3 aspect-4/3 bg-white rounded-lg shadow-lg overflow-hidden">
                      <Image
                        src={serviceImage ?? "/salon-image-placeholder.jpg"}
                        fill
                        className="object-cover rounded-lg"
                        alt="image placeholder"
                      />
                      <div
                        className={cn(
                          "group absolute flex flex-col gap-2 items-center justify-center inset-0 z-10  rounded cursor-pointer duration-200 ease-in-out",
                          serviceImage
                            ? "bg-transparent hover:bg-white/60"
                            : "bg-white/60",
                        )}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="bg-secondary w-14 h-14 rounded-full flex justify-center items-center">
                          <CameraIcon
                            fill="#EB3368"
                            className="size-8 text-white"
                          />
                        </div>
                        <span className="text-black font-bold">
                          {serviceImage
                            ? "Change Service image"
                            : "Upload Service Image"}
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
                    <FieldLabel htmlFor={field.name}>Service Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Box braids"
                      autoComplete="off"
                      className={cn(
                        "h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm border-none",
                      )}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <div className="flex flex-col gap-3 md:flex-row">
              <form.Field name="category">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                      <Select
                        onValueChange={(val) => field.handleChange(val ?? "")}
                        value={field.state.value || undefined}
                      >
                        <SelectTrigger
                          id={field.name}
                          onBlur={field.handleBlur}
                          className="h-9 bg-[#F3F3F4] rounded-sm border-none"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="price">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Price (R)</FieldLabel>
                      <div className="flex gap-0.5 items-center bg-[#F3F3F4] rounded-sm pl-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                        <div className="font-semibold text-primary">R</div>
                        <Input
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                            )
                          }
                          aria-invalid={isInvalid}
                          placeholder="0.00"
                          type="number"
                          className={cn(
                            "h-9 placeholder:text-sm  border-none bg-transparent  focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500",
                          )}
                        />
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            </div>
            <form.Field name="duration">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Duration</FieldLabel>
                    <Select
                      onValueChange={(val) => field.handleChange(Number(val))}
                      value={
                        field.state.value
                          ? String(field.state.value)
                          : undefined
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        onBlur={field.handleBlur}
                        className="h-9 bg-[#F3F3F4] rounded-sm border-none"
                      >
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
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
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="This can be a brief information about the service"
                        rows={6}
                        className={cn(
                          "h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm border-none min-h-24",
                        )}
                        aria-invalid={isInvalid}
                      />
                    </InputGroup>
                    <InputGroupAddon align="block-end" className="">
                      <InputGroupText className="tabular-nums">
                        {field.state.value.length}/250 characters
                      </InputGroupText>
                    </InputGroupAddon>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>
      </div>
      <footer className="sticky bottom-0 bg-white z-50 border-t border-border p-6">
        <div className="flex gap-3 md:justify-end">
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.back()}
            className="flex-1 md:flex-none h-12 px-6 rounded-full"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="service-form"
            className="flex-1 md:flex-none h-12 px-6 rounded-full"
            size="lg"
          >
            Save Service
          </Button>
        </div>
      </footer>

      {pendingCropFile && (
        <ImageCropDialog
          file={pendingCropFile.file}
          isPrimary={pendingCropFile.isPrimary}
          onCropConfirm={handleCropConfirm}
          primaryAspect={pendingCropFile.primaryAspect}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

export default DashboardCreateServicePage;
