"use client"
import { api } from '@/convex/_generated/api';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { Heart, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'next/navigation';

type Service = Doc<"service"> & {
    primaryImage: string | null;
    imageGallery: { _id: Id<"serviceImages">; url: string | null }[];
}

const DUMMY_REVIEWS = [
    {
        id: "r1",
        name: "Thando M.",
        avatar: "T",
        rating: 5,
        date: "2 weeks ago",
        comment: "Absolutely loved my box braids! The stylist was so professional and the salon was clean and welcoming. Will definitely be coming back.",
    },
    {
        id: "r2",
        name: "Kefilwe D.",
        avatar: "K",
        rating: 4,
        date: "1 month ago",
        comment: "Great service overall. My knotless braids came out beautiful. Only took a little longer than expected but worth every minute.",
    },
    {
        id: "r3",
        name: "Naledi P.",
        avatar: "N",
        rating: 5,
        date: "1 month ago",
        comment: "Best salon experience I've had in Joburg. The gel manicure lasted over 3 weeks with no chipping. Highly recommend!",
    },
    {
        id: "r4",
        name: "Ayanda S.",
        avatar: "A",
        rating: 5,
        date: "2 months ago",
        comment: "Always leave here feeling like a queen. The atmosphere is amazing and the team really knows their craft.",
    },
]

interface BusinessProfileProps {
    preloadedBusiness: Preloaded<typeof api.business.public.getBusinessBySlug>;
}

function BusinessProfile({ preloadedBusiness }: BusinessProfileProps) {
    const [selectedServiceId, setSelectedServiceId] = useState<Id<"service"> | null>(null)
    const [detailService, setDetailService] = useState<Service | null>(null)
    const business = usePreloadedQuery(preloadedBusiness)

    if (!business) {
        return <div>business not found</div>
    }

    const handleSelectService = (serviceId: Id<"service">) => {
        setSelectedServiceId(prev => prev === serviceId ? null : serviceId)
        const service = business.services.find((s) => s._id === serviceId)
        if (service) setDetailService(service)
    }

    return (
        <div className="w-full min-h-screen">


            <div className="w-full h-[360px] md:h-[500px] relative">
                <Image
                    src={business.businessCoverImage ?? ""}
                    fill
                    className="object-cover object-top"
                    alt={`${business.name} cover`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 max-w-[1440px] container mx-auto px-4 md:px-6 pb-5">
                    <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{business.name}</h1>
                            {business.city && (
                                <div className="flex items-center gap-1 text-gray-500">
                                    <MapPin className="size-3.5 md:size-4 text-primary" />
                                    <span className="text-xs md:text-sm">{business.city}</span>
                                </div>
                            )}
                        </div>
                        <button className="bg-white rounded-full p-2.5 md:p-3 shadow-md hover:scale-105 transition-transform cursor-pointer">
                            <Heart className="size-4 md:size-5 text-primary" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] container mx-auto px-4 md:px-6 mt-6">
                <div className="flex flex-col lg:flex-row gap-8">


                    <div className="flex-1 space-y-8">


                        <div className="flex items-center gap-2 flex-wrap">
                            {business.tags.map((tag) => (
                                <Badge key={tag} className="bg-secondary text-primary capitalize font-medium">
                                    {tag}
                                </Badge>
                            ))}
                        </div>


                        <div className="space-y-1.5">
                            <h2 className="text-xl md:text-2xl font-bold">The Vibe</h2>
                            <p className="text-sm text-gray-400 leading-relaxed">{business.description}</p>
                        </div>


                        <div className="space-y-3">
                            <h3 className="text-lg md:text-xl font-bold">Our Services</h3>
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


                        <div className="space-y-4 pb-10">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg md:text-xl font-bold">Reviews</h3>
                                <span className="text-sm text-muted-foreground">({DUMMY_REVIEWS.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {DUMMY_REVIEWS.map((review) => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </div>
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
    const durationInHours = service.duration >= 60
        ? `${(service.duration / 60).toFixed(1).replace(".0", "")}hours`
        : `${service.duration}min`

    const price = (service.price / 100).toFixed(2)

    return (
        <Card
            onClick={() => onSelect(service._id)}
            className={cn(
                "ring-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-0",
                isSelected ? "bg-primary shadow-md" : "bg-white"
            )}
        >
            <CardContent className="p-3">
                <div className="flex gap-3 items-center">
                    <div className="relative w-18 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image
                            src={service.primaryImage ?? ""}
                            alt={service.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <p className={cn(
                                "text-sm font-semibold leading-tight truncate capitalize",
                                isSelected ? "text-white" : "text-foreground"
                            )}>
                                {service.name}
                            </p>
                            <span className={cn(
                                "text-sm font-bold shrink-0 ml-2",
                                isSelected ? "text-white" : "text-primary"
                            )}>
                                R{price}
                            </span>
                        </div>
                        <span className={cn(
                            "text-xs",
                            isSelected ? "text-white/70" : "text-muted-foreground"
                        )}>
                            {durationInHours}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
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
    const duration = service.duration >= 60
        ? `${(service.duration / 60).toFixed(1).replace(".0", "")} hours`
        : `${service.duration} min`
    const price = (service.price / 100).toFixed(2)

    return (
        <Dialog open={!!service} onOpenChange={(open) => { if (!open) { onClose(); setActiveImage(null) } }}>
            <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-lg p-0 gap-0 max-h-[85vh] overflow-y-auto rounded-lg">
                {/* Primary Image */}
                <div className="relative w-full h-56 sm:h-64">
                    <Image
                        src={displayImage}
                        alt={service.name}
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-4 gap-1 px-4 pt-4">
                    {service.imageGallery.slice(0, 4).map((img) => (
                        <div
                            key={img._id}
                            onClick={() => setActiveImage(img.url ?? "")}
                            className={cn(
                                "relative aspect-square rounded-md overflow-hidden cursor-pointer ring-2 transition-all",
                                displayImage === img.url ? "ring-primary" : "ring-transparent"
                            )}
                        >
                            <Image
                                src={img.url ?? ""}
                                alt={service.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>

                <div className="p-4 space-y-2">
                    <DialogTitle className="text-lg font-bold capitalize">{service.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">{duration}</span>
                        <span className="text-sm font-bold text-primary">R{price}</span>
                    </div>
                    <Button className="w-full mt-2" onClick={() => {
                        router.push(`/explore/${slug}/${service._id}/book`)
                    }}>
                        Book Now
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

type Review = typeof DUMMY_REVIEWS[number]

function ReviewCard({ review }: { review: Review }) {
    return (
        <div className="bg-white rounded-xl p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {review.avatar}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{review.name}</p>
                        <p className="text-[10px] text-muted-foreground">{review.date}</p>
                    </div>
                </div>
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="size-3.5 text-amber-400" fill="#F59E0B" />
                    ))}
                </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{review.comment}</p>
        </div>
    )
}