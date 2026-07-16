"use client";

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
  Business,
  BUSINESS_DAYS,
  businessSchema,
  useBusinessStore,
} from "@/stores/use-business";
import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import ImageCropDialog, { CroppedFile } from "../image-cropper";
import { Camera, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDebouncedCallback } from "use-debounce";

export const IMAGE_UPLOAD_GUIDELINES = {
  galleryImages: {
    acceptedRatios: [
      { name: "Portrait 2:3", min: 0.63, max: 0.7 },
      { name: "Portrait 3:4", min: 0.71, max: 0.8 },
      { name: "Square 1:1", min: 0.95, max: 1.05 },
      { name: "Landscape 4:3", min: 1.25, max: 1.4 },
      { name: "Landscape 3:2", min: 1.45, max: 1.55 },
      { name: "Landscape 16:9", min: 1.7, max: 1.85 },
    ],
    minDimensions: {
      portrait: { width: 1080, height: 1440 },
      square: { width: 1500, height: 1500 },
      landscape: { width: 1440, height: 1080 },
    },
  },
  maxFileSize: 5 * 1024 * 1024,
  maxImages: 5,
  acceptedFormats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

const BUSINESS_TAGS = [
  "Hair Styling",
  "Nails",
  "Barbershop",
  "Massage",
  "Lashes",
  "Makeup",
  "Luxury Spa",
  "Skincare",
];

const FIELD_ORDER = [
  "coverImage",
  "name",
  "description",
  "address",
  "tags",
  "businessDays",
] as const;

const BusinessDetailForm = () => {
  const [suggestions, setSuggestions] = useState<{ description: string, placeId: string }[]>([]);
  const searchAddress = useAction(api.business.admin.searchAddressPublic);
  const { business, setBusinessDetails, setSteps } = useBusinessStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  // Captured once at mount: true when a draft was restored from storage but its
  // (non-serializable) cover photo was dropped, so we prompt the user to re-add it.
  const [restoredWithoutCover] = useState(
    () => !!business?.name && !(business?.coverImage instanceof File),
  );
  const [pendingCropFile, setPendingCropFile] = useState<{
    file: File;
    isPrimary: boolean;
    primaryAspect: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      name: business?.name ?? "",
      description: business?.description ?? "",
      address: business?.address ?? { address: "", placeId: "" },
      businessDays: (business?.businessDays ?? [
        { ...BUSINESS_DAYS[0] },
      ]) as Business["businessDays"],
      coverImage: business?.coverImage ?? (null as File | null),
      tags: business?.tags ?? ([] as string[]),
    },
    validators: {
      onBlur: businessSchema,
      onSubmit: businessSchema,
    },
    onSubmit: ({ value }) => {
      setBusinessDetails({
        address: value.address,
        description: value.description,
        name: value.name,
        coverImage: value?.coverImage as File,
        businessDays: value.businessDays,
        tags: value.tags,
      });
      setSteps("Payment");
    },
    onSubmitInvalid: ({ formApi }) => {
      const fieldMeta = formApi.state.fieldMeta as Record<
        string,
        { errors?: unknown[] }
      >;
      const firstInvalid = FIELD_ORDER.find(
        (name) => (fieldMeta[name]?.errors?.length ?? 0) > 0,
      );
      if (!firstInvalid) return;
      const targetId =
        firstInvalid === "coverImage" ? "cover-photo-dropzone" : firstInvalid;
      const el = document.getElementById(targetId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLElement && firstInvalid !== "coverImage") el.focus();
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const submissionAttempts = useStore(
    form.store,
    (state) => state.submissionAttempts,
  );
  const saveDraft = useDebouncedCallback((v: typeof values) => {
    setBusinessDetails(v as Business);
  }, 500);

  useEffect(() => {
    saveDraft(values);
  }, [values, saveDraft]);

  useEffect(() => {
    return () => {
      saveDraft.flush();
    };
  }, [saveDraft]);

  // Hydrate cover preview from a restored File (kept in-memory across step switches).
  useEffect(() => {
    const file = business?.coverImage;
    if (!(file instanceof File)) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressChange = useDebouncedCallback(async (value: string) => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await searchAddress({ input: value });
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  }, 400);

  const handleSelectCoverImage = (
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

    setPendingCropFile({
      file,
      isPrimary: true,
      primaryAspect: 16 / 9,
      field,
    });
  };

  const handleCropConfirm = (cropped: CroppedFile) => {
    if (!pendingCropFile) return;
    const { field } = pendingCropFile;
    field.handleChange(cropped.file);
    field.handleBlur();
    setCoverPreview(cropped.url);
    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropCancel = () => {
    setPendingCropFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <form
        id="business-details-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="w-full"
      >
        <FieldGroup className="space-y-5">

          <form.Field name="coverImage">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              const hasImage = !!coverPreview;
              const showReAddHint =
                restoredWithoutCover && !field.state.value && !hasImage;
              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex items-center gap-2">
                    <FieldLabel htmlFor="cover-photo-dropzone">
                      {hasImage ? "Cover Photo" : "Upload Cover Photo"}
                    </FieldLabel>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  </div>
                  <Input
                    id={field.name}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleSelectCoverImage(e, field)}
                  />
                  <div
                    id="cover-photo-dropzone"
                    className={cn(
                      "relative w-full h-40 md:h-56 bg-white rounded-xl shadow-sm overflow-hidden border-2 border-transparent",
                      isInvalid && "border-destructive",
                    )}
                  >
                    {hasImage && (
                      <Image
                        src={coverPreview!}
                        fill
                        className="object-cover rounded-lg p-2"
                        alt="Cover preview"
                      />
                    )}
                    <div
                      className="group hover:bg-white/40 duration-200 ease-in-out absolute flex flex-col gap-2 items-center justify-center inset-0 bg-white/60 z-10 m-2 rounded-lg cursor-pointer"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      <div className="bg-secondary w-14 h-14 rounded-full flex justify-center items-center">
                        <Camera weight="fill" className="size-8 text-primary" />
                      </div>
                      <span className="text-black font-bold">
                        {hasImage ? "Change Cover Photo" : "Upload Cover Photo"}
                      </span>
                      <span className="text-sm text-muted-foreground">PNG, JPG up to 5MB</span>
                    </div>
                  </div>
                  {showReAddHint && !isInvalid && (
                    <p className="text-sm text-muted-foreground">
                      Please re-add your cover photo
                    </p>
                  )}
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Left column: business info */}
            <FieldGroup className="space-y-3">

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
                        className="h-9 bg-surface-container-low placeholder:text-sm rounded-sm"
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
                          placeholder="Put your business description here. This can be a brief information of what you do"
                          rows={6}
                          className="h-9 placeholder:text-sm bg-surface-container-low rounded-sm min-h-24 resize-none"
                          aria-invalid={isInvalid}
                        />
                        <InputGroupAddon align="block-end">
                          <InputGroupText className="tabular-nums">
                            {field.state.value.length}/250 characters
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
                  const hasSelectedPlace = !!field.state.value.placeId;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                      {hasSelectedPlace ? (
                        <div className="flex items-center justify-between gap-2 rounded-full bg-secondary border border-border px-4 py-2">
                          <span className="text-sm truncate">{field.state.value.address}</span>
                          <button
                            type="button"
                            aria-label="Clear address"
                            onClick={() => {
                              field.handleChange({ address: "", placeId: "" });
                              field.handleBlur();
                              setSuggestions([]);
                            }}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            id={field.name}
                            value={field.state.value.address}
                            onBlur={() => {
                              field.handleBlur();
                              setTimeout(() => setSuggestions([]), 100);
                            }}
                            onChange={(e) => {
                              field.handleChange({
                                address: e.target.value,
                                placeId: "",
                              });
                              handleAddressChange(e.target.value);
                            }}
                            aria-invalid={isInvalid}
                            placeholder="123 Main str, 1321"
                            autoComplete="off"
                            className="h-9 bg-surface-container-low placeholder:text-sm rounded-sm"
                          />
                          {suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-border overflow-hidden">
                              {suggestions.map((suggestion) => (
                                <button
                                  key={suggestion.placeId}
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    field.handleChange({
                                      address: suggestion.description,
                                      placeId: suggestion.placeId,
                                    });
                                    field.handleBlur();
                                    setSuggestions([]);
                                  }}
                                >
                                  {suggestion.description}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="tags">
                {(field) => {
                  // Gated on a submit attempt rather than field.state.meta.isTouched:
                  // a multi-select toggle has no natural "blur" moment the way a
                  // text input does, so touch-gating would flash the error on the
                  // very first tag click. Re-validate (handleBlur, after the value
                  // is applied) so the error still clears immediately once fixed.
                  const isInvalid =
                    submissionAttempts > 0 && !field.state.meta.isValid;
                  const selectedTags = field.state.value;

                  const toggleTag = (tag: string) => {
                    const isSelected = selectedTags.includes(tag);
                    if (isSelected) {
                      field.handleChange(selectedTags.filter((t) => t !== tag));
                    } else {
                      if (selectedTags.length >= 3) {
                        toast.error("Maximum 3 tags allowed", {
                          description: "Remove a tag before adding a new one",
                        });
                        return;
                      }
                      field.handleChange([...selectedTags, tag]);
                    }
                    field.handleBlur();
                  };

                  return (
                    <Field id="tags" data-invalid={isInvalid}>
                      <FieldLabel>
                        Business Tags
                        <span className="text-muted-foreground font-normal ml-1 text-xs">
                          (select up to 3)
                        </span>
                      </FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {BUSINESS_TAGS.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer",
                                isSelected
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                              )}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedTags.length}/3 selected
                      </p>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

            </FieldGroup>

            {/* Right column: business hours */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Business Hours</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Tap the days you&apos;re open, then set each day&apos;s hours</p>
              </div>

              <form.Field name="businessDays">
                {(field) => {
                  // Same submit-attempt gating as tags, for the same reason: a
                  // day-toggle has no natural "blur" moment.
                  const isInvalid =
                    submissionAttempts > 0 && !field.state.meta.isValid;

                  const toggleDay = (day: (typeof BUSINESS_DAYS)[number]) => {
                    const isSelected = field.state.value.some(
                      (d) => d.fullName === day.fullName,
                    );
                    const updated = isSelected
                      ? field.state.value.filter((d) => d.fullName !== day.fullName)
                      : [...field.state.value, { ...day }].sort(
                          (a, b) =>
                            BUSINESS_DAYS.findIndex((d) => d.fullName === a.fullName) -
                            BUSINESS_DAYS.findIndex((d) => d.fullName === b.fullName),
                        );
                    field.handleChange(updated as Business["businessDays"]);
                    field.handleBlur();
                  };

                  const selectedDays = BUSINESS_DAYS.filter((day) =>
                    field.state.value.some((d) => d.fullName === day.fullName),
                  );

                  return (
                    <Field id="businessDays" data-invalid={isInvalid}>
                      <div className="flex flex-wrap gap-2">
                        {BUSINESS_DAYS.map((day) => {
                          const isSelected = field.state.value.some(
                            (d) => d.fullName === day.fullName,
                          );
                          return (
                            <button
                              key={day.fullName}
                              type="button"
                              aria-pressed={isSelected}
                              aria-label={day.fullName}
                              onClick={() => toggleDay(day)}
                              className={cn(
                                "w-11 h-11 rounded-full text-sm flex items-center justify-center font-semibold border transition-colors",
                                isSelected
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-muted-foreground border-gray-200 hover:border-primary hover:text-primary",
                              )}
                            >
                              {day.shortName}
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-3 mt-2">
                        {selectedDays.map((day) => {
                          const index = field.state.value.findIndex(
                            (d) => d.fullName === day.fullName,
                          );
                          return (
                            <div
                              key={day.fullName}
                              className="rounded-xl border border-border bg-white p-3"
                            >
                              <p className="font-semibold text-sm mb-2">{day.fullName}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <form.Field name={`businessDays[${index}].openTime`}>
                                  {(subField) => (
                                    <label className="flex flex-col gap-1">
                                      <span className="text-xs text-muted-foreground">Opens</span>
                                      <Input
                                        type="time"
                                        step="60"
                                        value={subField.state.value}
                                        className="appearance-none bg-surface-container-low h-9 rounded-sm w-full"
                                        onChange={(e) => subField.handleChange(e.target.value)}
                                      />
                                    </label>
                                  )}
                                </form.Field>
                                <form.Field name={`businessDays[${index}].closeTime`}>
                                  {(subField) => (
                                    <label className="flex flex-col gap-1">
                                      <span className="text-xs text-muted-foreground">Closes</span>
                                      <Input
                                        type="time"
                                        step="60"
                                        value={subField.state.value}
                                        className="appearance-none bg-surface-container-low h-9 rounded-sm w-full"
                                        onChange={(e) => subField.handleChange(e.target.value)}
                                      />
                                    </label>
                                  )}
                                </form.Field>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            </div>

          </div>
        </FieldGroup>
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
