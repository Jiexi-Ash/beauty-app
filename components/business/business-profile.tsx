"use client"
import { api } from "@/convex/_generated/api"
import { Preloaded, usePreloadedQuery } from "convex/react"
import { Heart, MapPin, Star, CircleNotch, ArrowUpRight } from "@phosphor-icons/react"
import Image from "next/image"
import { Badge } from "../ui/badge"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { notFound, useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useConvexMutation } from "@convex-dev/react-query"
import { ConvexError } from "convex/values"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { getInitials } from "@/lib/utils"


type Service = Doc<"service"> & {
  primaryImage: string | null
  imageGallery: { _id: Id<"serviceImages">; url: string | null }[]
}

interface BusinessProfileProps {
  preloadedBusiness: Preloaded<typeof api.business.public.getBusinessBySlug>
}

function BusinessProfile({ preloadedBusiness }: BusinessProfileProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<Id<"service"> | null>(null)
  const [detailService, setDetailService] = useState<Service | null>(null)
  const business = usePreloadedQuery(preloadedBusiness)

  const { mutate: toggleFavorites, isPending } = useMutation({
    mutationFn: useConvexMutation(api.users.toggleFavorites),
    onError: (error) => {
      if (error instanceof ConvexError) {
        toast.error(error.data || "An unknown error occurred while adding salon to favorites.")
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An unknown error occurred while adding salon to favorites.")
      }
    },
  })

  if (!business) notFound()

  const handleSelectService = (serviceId: Id<"service">) => {
    setSelectedServiceId((prev) => (prev === serviceId ? null : serviceId))
    const service = business.services.find((s) => s._id === serviceId)
    if (service) setDetailService(service)
  }

  return (
    <div className="w-full min-h-screen">
      {/* Cover image */}
      <div className="w-[calc(100%+3rem)] md:w-full h-[360px] md:h-[500px] relative -mx-6 md:mx-0 -mt-4 md:mt-0 md:overflow-hidden md:rounded-4xl">
        <Image
          src={business.businessCoverImage ?? ""}
          fill
          className="object-cover object-top"
          alt={`${business.name} cover`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-5 pb-5">
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{business.name}</h1>
              <div className="flex items-center gap-1.5 flex-wrap">
                {business.reviewCount > 0 && (
                  <div className="flex items-center gap-1 text-gray-700">
                    <Star className="size-3.5 md:size-4 text-amber-400" weight="fill" />
                    <span className="text-xs md:text-sm font-semibold">{business.averageRating.toFixed(1)}</span>
                    <span className="text-xs md:text-sm text-gray-500">({business.reviewCount})</span>
                  </div>
                )}
                {business.city && (
                  <div className="flex items-center gap-1 text-gray-500">
                    {business.reviewCount > 0 && <span className="text-gray-400">&bull;</span>}
                    <MapPin className="size-3.5 md:size-4 text-primary" weight="fill" />
                    <span className="text-xs md:text-sm">{business.city}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              disabled={isPending}
              size="icon"
              className="bg-white/95 rounded-full p-2.5 md:p-3 shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.96]"
              onClick={() => toggleFavorites({ businessId: business._id })}
            >
              {isPending ? (
                <CircleNotch className="size-4 text-gray-400 animate-spin" />
              ) : business.isFavorite ? (
                <Heart weight="fill" className="size-4 md:size-5 text-primary" />
              ) : (
                <Heart className="size-4 md:size-5 text-primary" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {business.tags.map((tag) => (
                <Badge key={tag} className="bg-secondary text-primary font-medium">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h2 className="text-xl md:text-2xl font-bold">The vibe</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{business.description}</p>
            </div>

            {/* Services grid */}
            <div className="space-y-3">
              <h3 className="text-lg md:text-xl font-bold">Our services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {business.services.map((service) => (
                  <ServiceCard
                    key={service._id}
                    service={service}
                    isSelected={selectedServiceId === service._id}
                    onSelect={handleSelectService}
                  />
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-4 pb-10">
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-bold">Reviews</h3>
                <span className="text-sm text-muted-foreground">({business.reviewCount})</span>
                {business.reviewCount > 0 && (
                  <div className="flex items-center gap-1 ml-1">
                    <Star className="size-3.5 text-amber-400" weight="fill" />
                    <span className="text-sm font-semibold">{business.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {business.reviews.length === 0 ? (
                <p className="text-sm text-gray-400">No reviews yet. Be the first to book and share your experience.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business.reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ServiceDetailDialog
        service={detailService}
        onClose={() => {
          setDetailService(null)
          setSelectedServiceId(null)
        }}
        slug={business.slug}
      />
    </div>
  )
}

export default BusinessProfile


interface ServiceCardProps {
  service: Service
  isSelected: boolean
  onSelect: (serviceId: Id<"service">) => void
}

function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  const durationInHours =
    service.duration >= 60
      ? `${(service.duration / 60).toFixed(1).replace(".0", "")} hrs`
      : `${service.duration} min`

  const price = (service.price / 100).toFixed(2)

  return (
    <div
      onClick={() => onSelect(service._id)}
      className={cn(
        "group cursor-pointer rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.99]",
        isSelected
          ? "bg-primary shadow-[0_8px_24px_rgba(221,39,94,0.2)]"
          : "bg-surface-container-lowest shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className="p-3">
        <div className="flex gap-3 items-center">
          {/* Double-bezel image thumbnail */}
          <div
            className={cn(
              "p-1 rounded-xl ring-1 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isSelected ? "bg-white/15 ring-white/20" : "bg-black/[0.04] ring-black/5",
            )}
          >
            <div className="relative w-14 h-16 rounded-[0.6rem] overflow-hidden">
              <Image
                src={service.primaryImage ?? ""}
                alt={service.name}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <p
                className={cn(
                  "text-sm font-semibold leading-tight truncate",
                  isSelected ? "text-white" : "text-foreground",
                )}
              >
                {service.name}
              </p>
              <span
                className={cn(
                  "text-sm font-bold shrink-0",
                  isSelected ? "text-white" : "text-primary",
                )}
              >
                R{price}
              </span>
            </div>
            <span
              className={cn(
                "text-xs",
                isSelected ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {durationInHours}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


function ServiceDetailDialog({
  service,
  onClose,
  slug,
}: {
  service: Service | null
  onClose: () => void
  slug: string
}) {
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const router = useRouter()

  if (!service) return null

  const displayImage = activeImage ?? service.primaryImage ?? ""
  const duration =
    service.duration >= 60
      ? `${(service.duration / 60).toFixed(1).replace(".0", "")} hours`
      : `${service.duration} min`
  const price = (service.price / 100).toFixed(2)
  const depositPrice = ((service.price / 100) * 0.5).toFixed(2)

  const allImages = [
    ...(service.primaryImage ? [{ key: "primary", url: service.primaryImage }] : []),
    ...service.imageGallery.map((img) => ({ key: img._id, url: img.url ?? "" })),
  ]

  return (
    <Dialog
      open={!!service}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setActiveImage(null)
        }
      }}
    >
      {/*
        Overrides:
        - rounded-[1.75rem] over sm:rounded-lg
        - shadow-[...] over shadow-lg
        - p-0 gap-0 over p-6 gap-4
        - overflow-hidden clips the hero image to the dialog radius
        - max-h-[90dvh] for safe mobile height (dvh avoids iOS Safari viewport jump)
      */}
      <DialogContent
        className={cn(
          "w-[calc(100%-2rem)] sm:max-w-[440px]",
          "p-0 gap-0 rounded-[1.75rem] overflow-hidden border-0",
          "shadow-[0_32px_80px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)]",
          "max-h-[90dvh] overflow-y-auto",
        )}
      >
        {/* Hero image — crossfades on gallery selection via key-triggered re-mount */}
        <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-surface-container">
          <div
            key={displayImage}
            className="absolute inset-0 [animation:image-fade_0.45s_cubic-bezier(0.32,0.72,0,1)_both]"
          >
            <Image
              src={displayImage}
              alt={service.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Subtle bottom gradient so title area transitions smoothly */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Gallery thumbnail strip — horizontal scroll */}
        {allImages.length > 1 && (
          <div className="flex gap-2 px-5 pt-4 pb-1 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {allImages.map((img) => {
              const isActive = displayImage === img.url
              return (
                <button
                  key={img.key}
                  onClick={() =>
                    setActiveImage(
                      img.key === "primary" ? null : img.url,
                    )
                  }
                  className={cn(
                    "relative shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isActive
                      ? "ring-2 ring-primary scale-[1.06] shadow-[0_4px_16px_rgba(221,39,94,0.2)]"
                      : "opacity-55 hover:opacity-90 hover:scale-[1.04] ring-2 ring-transparent",
                  )}
                >
                  <Image src={img.url} alt={service.name} fill className="object-cover" />
                </button>
              )
            })}
          </div>
        )}

        {/* Content */}
        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Eyebrow — duration */}
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold">
            {duration}
          </p>

          {/* Service name */}
          <DialogTitle className="text-2xl font-headline font-bold leading-tight -mt-1">
            {service.name}
          </DialogTitle>

          {/* Description */}
          {service.description && (
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {service.description}
            </p>
          )}

          {/* Price + Book Now */}
          <div className="flex items-end justify-between pt-2 gap-4">
            <div>
              {/* Large price display */}
              <p className="text-4xl font-black text-foreground leading-none">
                R{price}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                R{depositPrice} deposit on booking
              </p>
            </div>

            {/* Button-in-button pill */}
            <Button
              className="group h-12 px-5 rounded-full flex items-center gap-2.5 shrink-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer"
              onClick={() => {
                router.push(`/explore/${slug}/services/${service.slug}/book`)
              }}
            >
              Book now
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110 shrink-0">
                <ArrowUpRight className="size-3.5" />
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


type Review = {
  _id: string
  _creationTime: number
  rating: number
  comment?: string
  reviewerName: string
  reviewerImage: string | null
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Squircle avatar */}
          <div
            className="relative w-9 h-9 bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
            style={{ borderRadius: "30%" }}
          >
            {review.reviewerImage ? (
              <Image src={review.reviewerImage} alt={review.reviewerName} fill className="object-cover" />
            ) : (
              getInitials(review.reviewerName)
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{review.reviewerName}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(review._creationTime, { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star key={i} className="size-3.5 text-amber-400" weight="fill" />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-xs text-gray-500 leading-relaxed">{review.comment}</p>
      )}
    </div>
  )
}
