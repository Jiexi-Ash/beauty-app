"use client"
import {  BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { Card } from "../ui/card"

function Hero() {
    const router = useRouter()

    return (
        <section className="max-w-[1440px] mx-auto px-6 py-20 grid grid-cols-12 gap-8 items-center" id="search">

          
            <div className="col-span-12 md:col-span-6">
                <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tighter leading-[0.9] mb-8">
                    Verified <span className="text-primary italic">Businesses,</span>{" "}
                    <span>Transparent Pricing.</span>
                </h1>

                <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed mb-10">
                    Every salon on our platform is vetted to ensure you get the service you deserve — with zero hidden fees and total price transparency
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        size="lg"
                        onClick={() => router.push("/onboarding")}
                        className="h-14 px-10 hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
                    >
                         Get Your Salon Listed
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push("/explore?location=true")}
                        className="text-primary border-outline-variant border-2 h-14 px-10 hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
                    >
                        Find a Salon Near You
                    </Button>
                </div>
            </div>

            
            <div className="col-span-12 md:col-span-6 relative mt-12 md:mt-0">
                <div className="grid grid-cols-2 gap-3">

                 
                    <div className="flex flex-col gap-3">
                        <div className="relative rounded-3xl overflow-hidden aspect-[3/4]">
                            <Image
                                src="/salon-1.jpg"
                                alt="Modern salon interior"
                                fill
                                className="object-cover"
                            />
                         
                            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                                <BadgeCheck className="size-4 text-primary" />
                                <span className="text-xs font-bold text-on-surface tracking-wide">VERIFIED</span>
                            </div>
                        </div>

                     
                        <Card className="bg-surface-container rounded-2xl p-5 flex flex-col justify-between">
                            <p className="font-bold text-sm">100% Vetted</p>
                            <p className="text-xs leading-relaxed">
                                Every business on our platform undergoes a rigorous quality and safety check.
                            </p>
                        </Card>
                    </div>

                  
                    <div className="flex flex-col gap-3">
                        {/* No Hidden Fees card */}
                        <Card className="bg-primary rounded-2xl p-5 flex flex-col justify-between">
                                <p className="font-bold text-white text-base leading-tight">No Hidden Fees</p>
                                <p className="text-white/75 text-xs leading-relaxed">
                                    What you see is what you pay. We believe in fair, community-first pricing models.
                                </p>
                        </Card>

                    
                        <div className="relative rounded-3xl overflow-hidden flex-1 min-h-[220px]">
                            <Image
                                src="/salon-2.jpg"
                                alt="Luxury hair salon"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                                <span className="text-xs font-bold text-on-surface tracking-wide">FAIR TRADE</span>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-40 pointer-events-none" />
            </div>
        </section>
    )
}

export default Hero