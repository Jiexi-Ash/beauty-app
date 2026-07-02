"use client";

import ImageCropDialog, { CroppedFile } from "@/components/image-cropper";
import { IMAGE_UPLOAD_GUIDELINES } from "@/components/onboarding/business-details-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ConvexError } from "convex/values";
import { ArrowLeft, Camera, CircleNotch } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { Id } from "@/convex/_generated/dataModel";
import { SERVICE_DURATION_OPTIONS } from "@/app/constants";

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

function DashboardCreateServicePage() {
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...convexQuery(api.public.getCategories),
  });

  if (isLoading) return <CreateServiceSkeleton />;

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Failed to load categories</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );

  return <CreateServiceForm categories={categories!} />;
}

export default DashboardCreateServicePage;

export function CreateServiceSkeleton() {
  return (
    <div className="min-h-screen w-full">
      <div className="space-y-6 px-6 pt-4 pb-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Back button */}
        <Skeleton className="h-10 w-24 rounded-full" />

        <div className="w-full max-w-xl space-y-3">
          {/* Image upload */}
          <Skeleton className="w-2/3 aspect-4/3 rounded-lg" />

          {/* Service name */}
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-sm" />
          </div>

          {/* Category + Price row */}
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full rounded-sm" />
            </div>
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full rounded-sm" />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-sm" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full rounded-sm" />
            <Skeleton className="h-3 w-28 ml-auto" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 bg-background z-50 border-t border-border p-6">
        <div className="flex gap-3 md:justify-end">
          <Skeleton className="flex-1 md:flex-none h-12 w-32 rounded-full" />
          <Skeleton className="flex-1 md:flex-none h-12 w-36 rounded-full" />
        </div>
      </footer>
    </div>
  );
}

interface CreateServiceFormProps {
  categories: {
    _id: Id<"categories">;
    _creationTime: number;
    name: string;
  }[];
}
export const CreateServiceForm = ({ categories }: CreateServiceFormProps) => {
  const [isSubmiting, setSubmiting] = useState(false);
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

  const generateUploadUrl = useConvexMutation(
    api.business.admin.generateUploadUrl,
  );

  const { mutate: createService } = useMutation({
    mutationFn: useConvexMutation(api.service.admin.createService),
    onSuccess: () => {
      toast.success("Service created Successfully");
      form.reset();
    },
    onError: (error) => {
      if (error instanceof ConvexError) {
        toast.error(
          error.data || "An unknown error occurred while creating service.",
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred while creating service.");
      }
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      category: categories[0].name,
      price: 100,
      description: "",
      duration: 60,
      serviceImage: null as File | null,
    },
    validators: {
      onSubmit: serviceSchema,
    },
    onSubmit: async ({ value }) => {
      if (!value.serviceImage) return;
      try {
        setSubmiting(true);
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": value.serviceImage.type },
          body: value.serviceImage,
        });

        if (!uploadResult.ok) {
          throw new Error("Failed to upload service image.");
        }

        const { storageId } = await uploadResult.json();
        createService({
          name: value.name,
          description: value.description,
          duration: value.duration,
          price: value.price,
          primaryImageStorageId: storageId,
          categoryName: value.category,
        });
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unknown error occurred while creating service.");
        }
      } finally {
        setSubmiting(false);
      }
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
          disabled={isSubmiting}
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

                    <div className="relative w-2/3 aspect-4/3 bg-card rounded-lg shadow-lg overflow-hidden">
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
                            ? "bg-transparent hover:bg-background/60"
                            : "bg-background/60",
                        )}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="bg-secondary w-14 h-14 rounded-full flex justify-center items-center">
                          <Camera weight="fill" className="size-8 text-primary" />
                        </div>
                        <span className="text-foreground font-bold">
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
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Box braids"
                      autoComplete="off"
                      className={cn(
                        "h-9 bg-muted placeholder:text-sm rounded-sm border-none",
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
                          className="h-9 bg-muted rounded-sm border-none"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((opt) => (
                            <SelectItem
                              className="capitalize"
                              key={opt.name}
                              value={opt.name}
                            >
                              {opt.name}
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
                      <div className="flex gap-0.5 items-center bg-muted rounded-sm pl-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                        <div className="font-semibold text-primary">R</div>
                        <Input
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          value={
                            field.state.value === 0 ? "" : field.state.value
                          }
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
                            "h-9 placeholder:text-sm  border-none bg-transparent  focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground",
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
                        className="h-9 bg-muted rounded-sm border-none"
                      >
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_DURATION_OPTIONS.map((opt) => (
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
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="This can be a brief information about the service"
                        rows={6}
                        className={cn(
                          "h-9 bg-muted placeholder:text-sm rounded-sm border-none min-h-24",
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
      <footer className="sticky bottom-0 bg-background z-50 border-t border-border p-6">
        <div className="flex gap-3 md:justify-end">
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.back()}
            className="flex-1 md:flex-none h-12 px-6 rounded-full"
            size="lg"
            disabled={isSubmiting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="service-form"
            className="flex-1 md:flex-none h-12 px-6 rounded-full"
            size="lg"
            disabled={isSubmiting}
          >
            {isSubmiting ? (
              <CircleNotch className="text-primary-foreground animate-spin size-4" />
            ) : (
              "Save Service"
            )}
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
};
