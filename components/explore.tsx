"use client"
import { api } from '@/convex/_generated/api';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { useState } from 'react'
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ArrowRight, MapPin, SearchIcon, SearchX, StarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';

const CATEGORIES = ["All", "Hair Styling", "Nails", "Barbershop", "Massage", "Lashes", "Makeup", "Luxury Spa", "Skincare"]

interface ServicesProps {
    preloadedBusinesses: Preloaded<typeof api.business.public.getBusinesses>;
}

function Explore({ preloadedBusinesses }: ServicesProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const search = searchParams.get("search")
    const city = searchParams.get("city")
    const [searchValue, setSearchValue] = useState(search ?? "")
    const [cityValue, setCityValue] = useState(city ?? "")
    const businesses = usePreloadedQuery(preloadedBusinesses);
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [focusedField, setFocusedField] = useState<"search" | "city" | null>(null)


    const handleSearch = () => {
        if (!searchValue.trim() && !cityValue.trim()) return
        if (searchValue.trim().length > 0 && searchValue.trim().length < 2) return

        const params = new URLSearchParams(searchParams.toString())

        if (searchValue.trim()) params.set("search", searchValue.trim())
        else params.delete("search")

        if (cityValue.trim()) params.set("city", cityValue.trim())
        else params.delete("city")

        router.push(`/explore?${params.toString()}`)
    }

    const { data: businessQueryResults, isLoading } = useQuery({
        ...convexQuery(api.business.public.searchBusinessByQuery, { query: search ?? undefined, city: city ?? undefined }),
        enabled: !!search || !!cityValue,
    });

    if (isLoading) {
        return (
            <div className="space-y-6 mt-10">
                <div className="space-y-1">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                        Find a <span className="text-primary italic">Salon.</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">Discover top-rated salons and spas near you</p>
                </div>

                <div className={cn(
                    "flex items-center w-full max-w-2xl rounded-full border transition-all duration-200 overflow-hidden",
                    focusedField ? "bg-white ring-2 ring-primary border-primary" : "border-gray-300 bg-gray-50"
                )}>
                    <div className="flex items-center gap-2 flex-1 px-4 py-1.5">
                        <SearchIcon className="size-4 text-gray-400 shrink-0" />
                        <Input
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Salon name or service..."
                            className="flex-1 text-sm border-none shadow-none outline-none focus-visible:ring-0 bg-transparent placeholder:text-gray-400 px-0"
                            onFocus={() => setFocusedField("search")}
                            onBlur={() => setFocusedField(null)}
                            disabled
                        />
                    </div>
                    <div className="w-px h-6 bg-gray-200 shrink-0" />
                    <div className="flex items-center gap-2 flex-1 px-4 py-1.5">
                        <MapPin className="size-4 text-gray-400 shrink-0" />
                        <Input
                            value={cityValue}
                            placeholder="City..."
                            className="flex-1 text-sm border-none shadow-none outline-none focus-visible:ring-0 bg-transparent placeholder:text-gray-400 px-0"
                            disabled
                        />
                    </div>
                    <div className="pr-1.5">
                        <Button size="lg" className="rounded-lg cursor-pointer shrink-0 px-6" disabled>
                            Find
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {CATEGORIES.map((category) => (
                        <div
                            key={category}
                            className="h-8 w-24 rounded-sm bg-gray-100 animate-pulse"
                        />
                    ))}
                </div>

                <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-3">
                            <div className="aspect-4/3 rounded-tl-4xl rounded-br-4xl bg-gray-100 animate-pulse" />
                            <div className="flex flex-col gap-2 px-1">
                                <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
                                <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-6 w-16 bg-gray-100 animate-pulse rounded-sm" />
                                <div className="h-6 w-16 bg-gray-100 animate-pulse rounded-sm" />
                            </div>
                            <div className="h-10 bg-gray-100 animate-pulse rounded mx-1" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const businessData = (search || city) ? businessQueryResults : businesses


    const filteredBusinesses = businessData?.filter((b) => {
        if (selectedCategory === "All") return true
        return b.tags.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase())
    })


    return (
        <div className="space-y-6 mt-10">
            <div className="space-y-1">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                    Find a <span className="text-primary italic">Salon.</span>
                </h1>
                <p className="text-sm text-muted-foreground">Discover top-rated salons and spas near you</p>
            </div>

            <div className={cn(
                "flex items-center w-full max-w-2xl rounded-full border transition-all duration-200 overflow-hidden",
                focusedField ? "bg-white ring-2 ring-primary border-primary" : "border-gray-300 bg-gray-50"
            )}>
                <div className="flex items-center gap-2 flex-1 px-4 py-1.5">
                    <SearchIcon className="size-4 text-gray-400 shrink-0" />
                    <Input
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                        value={cityValue}
                        onChange={(e) => setCityValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="City..."
                        className="flex-1 text-sm border-none shadow-none outline-none focus-visible:ring-0 bg-transparent placeholder:text-gray-400 px-0"
                        onFocus={() => setFocusedField("city")}
                        onBlur={() => setFocusedField(null)}
                    />
                </div>
                <div className="pr-1.5">
                    <Button onClick={handleSearch} size="lg" className="rounded-lg cursor-pointer shrink-0 px-6">
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
                            "px-4 py-1.5 rounded-sm text-sm font-medium border transition-all duration-200 cursor-pointer",
                            selectedCategory === category
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                        )}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Results area */}
            {!businessData || businessData.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full">
                        <SearchX className="size-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">No results found</h2>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            We could not find any salons matching your search. Try adjusting your filters or search for something else.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Button size="lg" className="rounded-sm px-6" onClick={() => {
                            setSearchValue("")
                            setCityValue("")
                            router.push("/explore")
                        }}>
                            Clear Search
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-sm px-6" onClick={() => setSelectedCategory("All")}>
                            Clear Filters
                        </Button>
                    </div>
                </div>
            ) : filteredBusinesses?.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full">
                        <SearchX className="size-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">No salons in this category</h2>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            No salons match the <span className="font-semibold text-foreground">{selectedCategory}</span> category. Try a different one.
                        </p>
                    </div>
                    <Button size="lg" className="rounded-sm px-6 mt-2" onClick={() => setSelectedCategory("All")}>
                        Clear Filter
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredBusinesses?.map((business) => (
                        <div key={business._id} className="group flex flex-col gap-3 cursor-pointer">
                            <div className="relative aspect-4/3 overflow-hidden">
                                <Badge className="absolute top-2 right-2 z-20 bg-white hover:bg-white shadow-sm gap-1">
                                    <StarIcon fill="#dd275e" className="size-3.5 text-primary" />
                                    <span className="text-[11px] font-medium text-black">4.3</span>
                                </Badge>
                                <Image
                                    src={business.coverImageUrl ?? ""}
                                    fill
                                    alt={`${business.name} cover photo`}
                                    className="object-cover rounded-tl-4xl rounded-br-4xl group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <div className="flex flex-col gap-1 px-1">
                                <h2 className="text-sm font-semibold leading-tight group-hover:text-primary">{business.name}</h2>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <MapPin className="size-3.5 shrink-0" />
                                    <p className="text-xs">{business.city}</p>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                {business.tags.map((tag) => (
                                    <div key={tag} className="bg-secondary py-1 px-2 rounded-sm text-primary text-xs capitalize">{tag}</div>
                                ))}
                            </div>
                            <Link className="w-full" href={`/explore/${business.slug}`}>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="mx-1 cursor-pointer text-xs hover:bg-primary hover:text-white transition-all duration-200 ease-in-out w-full"
                                >
                                    View Details
                                    <ArrowRight className="size-3" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Explore