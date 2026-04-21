"use client"
import { api } from '@/convex/_generated/api';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { useState } from 'react'
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ArrowRight, MapPin, SearchIcon, StarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

const CATEGORIES = ["All", "Hair Styling", "Nails", "Barbershop", "Massage", "Lashes", "Makeup", "Luxury Spa", "Skincare"]

const dummyBusinesses = [

    {
        id: "2",
        name: "The Barber Republic",
        location: "Soweto, Orlando West",
        coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop"
    },
    {
        id: "3",
        name: "Posh Polish Lounge",
        location: "Sandton, Morningside",
        coverImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop"
    },
    {
        id: "4",
        name: "Velvet Touch Spa",
        location: "Rosebank, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop"
    },
    {
        id: "5",
        name: "The Lash Bar",
        location: "Fourways, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop"
    },
    {
        id: "6",
        name: "Kink & Coil Natural Studio",
        location: "Braamfontein, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop"
    },
    {
        id: "7",
        name: "Serene Skin Clinic",
        location: "Melrose, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop"
    },
    {
        id: "8",
        name: "Sharp & Fade Barbershop",
        location: "Alexandra, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop"
    },
    {
        id: "9",
        name: "Bloom Beauty Bar",
        location: "Parktown, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&auto=format&fit=crop"
    },
    {
        id: "10",
        name: "The Nail Atelier",
        location: "Greenside, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop"
    },
    {
        id: "11",
        name: "Luxe Hair Lounge",
        location: "Hyde Park, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop"
    },
    {
        id: "12",
        name: "The Brow Studio",
        location: "Norwood, Johannesburg",
        coverImage: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop"
    },
]

interface ServicesProps {
    preloadedBusinesses: Preloaded<typeof api.business.public.getBusinesses>;
}

function Explore({ preloadedBusinesses }: ServicesProps) {
    const businesses = usePreloadedQuery(preloadedBusinesses);
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [focusedField, setFocusedField] = useState<"search" | "location" | null>(null)

    // if (!businesses || businesses.length === 0) {
    //     return <div className="max-w-[1440px] container mx-auto px-6">no business</div>
    // }

    return (
        <div className="max-w-[1440px] container mx-auto px-6">
            <div className="space-y-6 mt-10">

              
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Find a Salon</h1>
                    <p className="text-sm text-muted-foreground">Discover top-rated salons and spas near you</p>
                </div>

           
                <div className={cn(
                    "flex items-center w-full max-w-2xl rounded-full border transition-all duration-200 overflow-hidden",
                    focusedField ? "bg-white ring-2 ring-primary border-primary" : "border-gray-200 bg-stone-100"
                )}>

                  
                    <div className="flex items-center gap-2 flex-1 px-4 py-1.5">
                        <SearchIcon className="size-4 text-gray-400 shrink-0" />
                        <Input
                            placeholder="Salon name or service..."
                            className="flex-1 text-sm border-none shadow-none outline-none focus-visible:ring-0 bg-transparent placeholder:text-gray-400 px-0"
                            onFocus={() => setFocusedField("search")}
                            onBlur={() => setFocusedField(null)}
                        />
                    </div>

                  
                    <div className="w-px h-6 bg-gray-200 shrink-0" />

                 
                    <div className="flex items-center gap-2 flex-1 px-4 py-1.5">
                        <MapPin className="size-4 text-gray-400 shrink-0" />
                        <Input
                            placeholder="Location..."
                            className="flex-1 text-sm border-none shadow-none outline-none focus-visible:ring-0 bg-transparent placeholder:text-gray-400 px-0"
                            onFocus={() => setFocusedField("location")}
                            onBlur={() => setFocusedField(null)}
                        />
                    </div>

                 
                    <div className="pr-1.5">
                        <Button size="sm" className="rounded-full cursor-pointer shrink-0">
                            Find
                        </Button>
                    </div>

                </div>


                
                <div className="flex items-center gap-2 flex-wrap">
                    {CATEGORIES.map((category) => (
                        <Button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            variant={selectedCategory === category ? "default" : "ghost"}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer",
                                selectedCategory === category
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                            )}
                        >
                            {category}
                        </Button>
                    ))}
                </div>

         
                <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {dummyBusinesses.map((business) => (
                        <div key={business.id} className="group flex flex-col gap-3 cursor-pointer">
                            <div className="relative aspect-4/3 overflow-hidden rounded-tl-4xl rounded-br-4xl">
                                <Badge className="absolute top-2 right-2 z-20 bg-white hover:bg-white shadow-sm gap-1">
                                    <StarIcon fill="#F59E0B" className="size-3.5 text-amber-400" />
                                    <span className="text-[11px] font-medium text-black">4.3</span>
                                </Badge>
                                <Image
                                    src={business.coverImage}
                                    fill
                                    alt={`${business.name} cover photo`}
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="flex flex-col gap-1 px-1">
                                <h2 className="text-sm font-semibold leading-tight">{business.name}</h2>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <MapPin className="size-3.5 shrink-0" />
                                    <p className="text-[10px]">{business.location}</p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="mx-1 cursor-pointer text-xs hover:bg-primary hover:text-white transition-all duration-200 ease-in-out"
                            >
                                View Details
                                <ArrowRight className="size-3" />
                            </Button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

export default Explore