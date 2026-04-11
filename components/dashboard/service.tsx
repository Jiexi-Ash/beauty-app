"use client";

import { api } from "@/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { ArrowLeft, Bell, CameraIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "../ui/input-group";
import ImageCropDialog, { CroppedFile } from "../image-cropper";
import z from "zod";
import { useRef, useState } from "react";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { CreateServiceSkeleton } from "@/app/dashboard/services/create-service/page";
import { IMAGE_UPLOAD_GUIDELINES } from "../onboarding/business-details-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { SERVICE_DURATION_OPTIONS } from "@/app/constants";

interface DashboardServiceProps {
  preloadedServices: Preloaded<typeof api.service.admin.getServiceById>;
}

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
    .min(10, "Service description is required and must be 10 characters long"),
  duration: z.number().min(0, "Duration must be a positive number"),
  serviceImage: z.union([
    z.null(),
    z
      .custom<File>((val) => val instanceof File, {
        message: "Invalid file type",
      })
      .refine(
        (file) => file.size <= 2 * 1024 * 1024,
        "Image must be less than 2MB",
      )
      .refine(
        (file) => file.type.startsWith("image/"),
        "Must be an image file",
      ),
  ]),
  galleryImages: z
    .array(
      z.union([
        z.null(),
        z
          .custom<File>((val) => val instanceof File, {
            message: "Invalid file type",
          })
          .refine(
            (file) => file.size <= 2 * 1024 * 1024,
            "Image must be less than 2MB",
          )
          .refine(
            (file) => file.type.startsWith("image/"),
            "Must be an image file",
          ),
      ]),
    )
    .max(IMAGE_UPLOAD_GUIDELINES.maxImages),
});

interface GalleryImageSlotProps {
  index: number;
  previewUrl: string | null;
  onFileSelected: (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => void;
  onRemove: (index: number) => void;
}

function GalleryImageSlot({
  index,
  previewUrl,
  onFileSelected,
  onRemove,
}: GalleryImageSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative aspect-square bg-[#F3F3F4] rounded-lg flex items-center justify-center overflow-hidden group">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileSelected(e, index)}
      />
      {previewUrl ? (
        <>
          <Image
            src={previewUrl}
            fill
            className="object-cover"
            alt={`Gallery image ${index + 1}`}
          />
          {/* Remove button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="absolute top-1 right-1 z-10 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="size-3 text-white" />
          </button>

          <div
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors cursor-pointer flex items-center justify-center"
            onClick={() => inputRef.current?.click()}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-full"
        >
          <CameraIcon className="size-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

function DashboardService({ preloadedServices }: DashboardServiceProps) {
  const router = useRouter();
  const service = usePreloadedQuery(preloadedServices);
  const { data: categories, isLoading } = useQuery({
    ...convexQuery(api.public.getCategories),
    enabled: !!service,
  });

  if (isLoading) return <CreateServiceSkeleton />;
  if (!service)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Service not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="size-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  return <DashboardServiceForm categories={categories!} service={service} />;
}

interface DashboardServiceFormProps {
  categories: {
    _id: Id<"categories">;
    _creationTime: number;
    name: string;
  }[];
  service: Doc<"service"> & { image: string | null } & {
    galleryImages: {
      storageId: Id<"_storage">;
      url: string | null;
    }[];
  };
}

function DashboardServiceForm({
  service,
  categories,
}: DashboardServiceFormProps) {
  const [isSubmiting, setSubmiting] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  //preview
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [galleryImageUrls, setGalleryImageUrls] = useState<(string | null)[]>(
    () => {
      const urls = Array(IMAGE_UPLOAD_GUIDELINES.maxImages).fill(null);
      service.galleryImages.forEach((img, i) => {
        urls[i] = img.url;
      });
      return urls;
    },
  );

  const [pendingCropFile, setPendingCropFile] = useState<{
    file: File;
    isPrimary: boolean;
    primaryAspect: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any;
    index?: number;
  } | null>(null);

  const generateUploadUrl = useConvexMutation(
    api.business.admin.generateUploadUrl,
  );

  const { mutate: updateService } = useMutation({
    mutationFn: useConvexMutation(api.service.admin.updateService),
    onSuccess: () => {
      toast.success("Service updated Successfully");
      form.reset();
      router.back();
    },
    onError: (error) => {
      if (error instanceof ConvexError) {
        toast.error(
          error.data || "An unknown error occurred while updating service.",
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred while updating service.");
      }
    },
  });

  const price = service ? service.price / 100 : 1;
  const existingGalleryIds = useRef<(Id<"_storage"> | null)[]>(
    Array(IMAGE_UPLOAD_GUIDELINES.maxImages)
      .fill(null)
      .map((_, i) => service.galleryImages[i]?.storageId ?? null),
  );

  const form = useForm({
    defaultValues: {
      name: service?.name ?? "",
      category:
        categories.find((c) => c._id === service.categoryId)?.name ??
        categories[0].name,
      price,
      description: service?.description ?? "",
      duration: service?.duration ?? 60,
      serviceImage: null as File | null,
      galleryImages: Array(IMAGE_UPLOAD_GUIDELINES.maxImages).fill(
        null,
      ) as (File | null)[],
    },
    validators: {
      onSubmit: serviceSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        setSubmiting(true);

        let primaryStorageId = service.primaryImageStorageId;

        if (value.serviceImage) {
          const uploadUrl = await generateUploadUrl();
          const uploadResult = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": value.serviceImage.type },
            body: value.serviceImage,
          });
          if (!uploadResult.ok)
            throw new Error("Failed to upload service image.");
          const { storageId } = await uploadResult.json();
          primaryStorageId = storageId;
        }

        const galleryStorageIds = (
          await Promise.all(
            value.galleryImages.map(async (file, i) => {
              if (file instanceof File) {
                const url = await generateUploadUrl();
                const result = await fetch(url, {
                  method: "POST",
                  headers: { "Content-Type": file.type },
                  body: file,
                });
                if (!result.ok)
                  throw new Error("Failed to upload gallery image.");
                const { storageId } = await result.json();
                return storageId as Id<"_storage">;
              }
              return existingGalleryIds.current[i] ?? null;
            }),
          )
        ).filter((id): id is Id<"_storage"> => id !== null);
        updateService({
          serviceId: service._id,
          categoryName: value.category,
          description: value.description,
          duration: value.duration,
          name: value.name,
          price: value.price,
          primaryImageStorageId: primaryStorageId,
          galleryImageIds: galleryStorageIds,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "An unknown error occurred.",
        );
      } finally {
        setSubmiting(false);
      }
    },
  });

  const handleSelectPrimaryImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: unknown,
  ) => {
    const file = Array.from(e.target.files ?? [])[0];
    if (!file) return;

    if (!IMAGE_UPLOAD_GUIDELINES.acceptedFormats.includes(file.type)) {
      toast.error("Invalid file format", {
        description: "Please upload JPEG, PNG, or WebP images only",
      });
      return;
    }
    if (file.size > IMAGE_UPLOAD_GUIDELINES.maxFileSize) {
      toast.error("File too large", {
        description: `Max ${IMAGE_UPLOAD_GUIDELINES.maxFileSize / 1024 / 1024}MB`,
      });
      return;
    }

    setPendingCropFile({ file, isPrimary: true, primaryAspect: 4 / 3, field });
  };

  const handleSelectGalleryImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: unknown,
    index: number,
  ) => {
    const file = Array.from(e.target.files ?? [])[0];
    if (!file) return;

    if (!IMAGE_UPLOAD_GUIDELINES.acceptedFormats.includes(file.type)) {
      toast.error("Invalid file format", {
        description: "Please upload JPEG, PNG, or WebP images only",
      });
      return;
    }
    if (file.size > IMAGE_UPLOAD_GUIDELINES.maxFileSize) {
      toast.error("File too large", {
        description: `Max ${IMAGE_UPLOAD_GUIDELINES.maxFileSize / 1024 / 1024}MB`,
      });
      return;
    }

    setPendingCropFile({
      file,
      isPrimary: false,
      primaryAspect: 1,
      field,
      index,
    });
  };

  const handleCropConfirm = (cropped: CroppedFile) => {
    if (!pendingCropFile) return;
    const { field, isPrimary, index } = pendingCropFile;

    field.handleChange(isPrimary ? cropped.file : cropped.file);

    if (isPrimary) {
      setServiceImage(cropped.url);
    } else if (index !== undefined) {
      setGalleryImageUrls((prev) => {
        const updated = [...prev];
        updated[index] = cropped.url;
        return updated;
      });
    }

    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropCancel = () => {
    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveGalleryImage = (index: number, field: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (field as any).handleChange(null);
    existingGalleryIds.current[index] = null;
    setGalleryImageUrls((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  return (
    <div className="min-h-screen w-full">
      <header className="flex w-full justify-between items-center top-0 sticky lg:border-b border-border shadow-sm px-6 z-50 bg-white">
        <div className="flex gap-3 items-center h-20">
          <div className="relative w-12 h-12 rounded-full">
            <Image
              src={"/salon-image-placeholder.jpg"}
              alt="Business cover image"
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
          <h1 className="text-2xl font-bold">Edit Service</h1>
          <p className="text-sm text-muted-foreground">
            Update your service details and/or add/remove gallery images
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
            <div className="flex flex-col gap-3">
              <form.Field name="serviceImage">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <Input
                        id={field.name}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => handleSelectPrimaryImage(e, field)}
                      />
                      <div className="relative w-2/3 aspect-4/3 bg-white rounded-lg shadow-lg overflow-hidden">
                        <Image
                          src={
                            serviceImage ??
                            service?.image ??
                            "/salon-image-placeholder.jpg"
                          }
                          fill
                          className="object-cover rounded-lg"
                          alt="Service image"
                        />
                        <div
                          className={cn(
                            "group absolute flex flex-col gap-2 items-center justify-center inset-0 z-10 rounded cursor-pointer duration-200 ease-in-out",
                            (serviceImage ?? service?.image)
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
                            {(serviceImage ?? service?.image)
                              ? "Change Service image"
                              : "Upload Service Image"}
                          </span>
                          <span className="text-sm">PNG, JPG 5MB</span>
                        </div>
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <div className="flex flex-col gap-1.5">
                <FieldLabel>Gallery Images</FieldLabel>
                <p className="text-xs text-muted-foreground">
                  Add up to {IMAGE_UPLOAD_GUIDELINES.maxImages} photos to
                  showcase your service
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({
                    length: IMAGE_UPLOAD_GUIDELINES.maxImages,
                  }).map((_, i) => (
                    <form.Field key={i} name={`galleryImages[${i}]`}>
                      {(subField) => (
                        <GalleryImageSlot
                          index={i}
                          previewUrl={galleryImageUrls[i]}
                          onFileSelected={(e, index) =>
                            handleSelectGalleryImage(e, subField, index)
                          }
                          onRemove={(index) =>
                            handleRemoveGalleryImage(index, subField)
                          }
                        />
                      )}
                    </form.Field>
                  ))}
                </div>
              </div>
            </div>

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
                      className="h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm border-none"
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
                          {categories.map((opt) => (
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
                      <div className="flex gap-0.5 items-center bg-[#F3F3F4] rounded-sm pl-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
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
                          className="h-9 placeholder:text-sm border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500"
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
                        className="h-9 bg-[#F3F3F4] placeholder:text-sm rounded-sm border-none min-h-24"
                        aria-invalid={isInvalid}
                      />
                    </InputGroup>
                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.state.value?.length}/250 characters
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
              <Loader2 className="text-white animate-spin size-4" />
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
}

export default DashboardService;
