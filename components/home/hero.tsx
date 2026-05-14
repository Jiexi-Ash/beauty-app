"use client"
import { Search, Verified } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from 'next/navigation';
import { useState } from "react"


function Hero() {
    const router = useRouter()
    const [search, setSearch] = useState("")

    const handleSearch = () => {
        if (!search.trim()) return
        if (search.trim().length < 2) return
        router.push(`/explore?search=${encodeURIComponent(search.trim())}`)
    }
    return (
        <section className="max-w-[1440px] mx-auto px-6 py-20 grid grid-cols-12 gap-8 items-center" id="search">
            <div className="col-span-12 md:col-span-7">
                <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tighter leading-[0.9] mb-8">
                    Your Community <br />
                    <span className="text-primary italic">Beauty,</span> Booked.
                </h1>
                <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed mb-8">
                    Bridge the gap between editorial luxury and local pride. Premium booking management for business owners, effortless self-care for everyone else.
                </p>

                {/* Search Bar */}
                <div className="mb-10 w-full max-w-xl">
                    <div className="flex items-center bg-white rounded-full p-2 shadow-xl shadow-primary/5 border border-surface-container-high focus-within:border-primary/30 transition-all duration-300">
                        <div className="pl-4 pr-2 text-on-surface-variant flex items-center">
                            <Search className="size-6 text-primary" />
                        </div>
                        <input
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="w-full bg-transparent border-none focus:outline-none text-on-surface placeholder:text-on-surface-variant/60 font-medium py-3"
                            placeholder="Search for salons, barbers, or spas..."
                            type="text"
                        />
                        <Button size="lg" onClick={handleSearch} className="bg-primary text-white px-8 py-3 h-10 rounded-full font-bold hover:bg-primary-container transition-all shadow-lg shadow-primary/20 whitespace-nowrap cursor-pointer">
                            Search
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button className="h-14 px-12 hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer" size="lg">
                        Get Your Salon Listed
                    </Button>
                    <Button variant="outline" size="lg" className="text-primary border-outline-variant border-2 h-14 px-12 hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer">
                        Find a Salon Near You
                    </Button>
                </div>
            </div>

            <div className="col-span-12 md:col-span-5 relative mt-12 md:mt-0">
                <div className="aspect-[4/5] bg-surface-container-low rounded-3xl overflow-hidden relative">
                    <Image
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaL_hYhfXMZK7dBQo2WHoOSIM0L27OwqncYsU4lSayXWABNlFwBX1vpfaWM1WTIguzLczZmaAhWBqkq_wWev8p4DegLiuqJ9OYc_PXxzUPh24sULw-kunmBGW17bWJ60q4wsgjwsYAOCQ5fPXEe6ZGfdtG5p1KXhrQTu4IgF71ZqKnj8D33PNbtKfPrc_XUvsXANMra6DZvw93paJDJ48kSaQpA9U_bL4eUJEUg5F2Lv9_INXeC0tmMmn7n8jYXZkfvhFODHwwMST6"
                        alt="Modern salon interior"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 backdrop-blur-md rounded-lg shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                <Verified className="size-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Verified Local Talent</p>
                                <p className="text-xs text-on-surface-variant">Over 2,500 salons across the community</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-40" />
            </div>
        </section>
    )
}

export default Hero