"use client"
import Image from "next/image"
import { ArrowRight, Star } from "@phosphor-icons/react"
import Link from "next/link"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const salons = [
  {
    name: "Glow Up Bar Soweto",
    type: "Hair & Braiding",
    location: "Orlando East",
    tag: "Local favourite",
    rating: "4.87",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXM0O7EH2I5M2EeM8gjnv5n4oO_WANC4qSPGgxNq7TcuoICYJVRzCxaCT1sIK88EsyUwB7Fv1URvU9AOPozS6iXD1hNVBgAP0p1pnHdJmCDmnZoAv5m3TnSq1dV2X27DU51Yrs6Ybnb2hu_0AJRnbExQq00mMCiv7JSn0PuPH7jFCtN18QUdhdsh5V_bwMh4TFyD0RP8zKvnDyKX_irilkwq1ex8OPH2wEp6VwEBrCKYBlwpErv9aOQlj7QRZFTxR_7KOF-drPf5pV",
  },
  {
    name: "The Fade Factory",
    type: "Barber Shop",
    location: "Mamelodi",
    tag: "Top rated",
    rating: "4.83",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAauPzPf1rOwH6AVnL2r8Bn3ZJ031zWbw_pDWTuxp2p16zR0WlEuK6DbgB9ZstQM-IV6n-6kmwISvNeH4Oza4UM_fX_D3I7FOtF-dpMBUnkS8cvj0y3nViMVVwzT9iSpSG-x_g7E8JDxazTURhTfB9X2OBbdO7NmloWkfsaqmY8diQ4c6MARpRw-vLhi3wFsWexuFGenB-EuC-jfVl0BnnL7cv0RGY0fcHpCNzuGZmf1PX92C4x0R9vpB3f-KP0pXNEDxdNak-GIz0h",
  },
  {
    name: "Tips & Toes Lounge",
    type: "Nails & Spa",
    location: "Khayelitsha",
    tag: "New",
    rating: "5.0",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjo-mWxQ0qxMX1NqjoIYYaKI_4H4LWeHBUl0NnpUN_7xHFco0rQJzQuf8t-7w-w4-ARw34HhFatPL1o5j8INwXZWEGxZZkWZ-05eONqeM6QGeoQJuFmEvdTtRAbhNxrttfXVjVPP1xjHOM16LXi9wBBNqPEL4GACYWfQOa7UkEMAhom50RIRoWLsaAl7qf16Zd6uEk4DRaxs4feUNO6FqovOi5hXVdfUh1vunsnMcslZxst1rQZOJ_G-0wy78HrU3LaX7-N89taMO",
  },
]

function PopularSalons() {
  const [lead, ...rest] = salons
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="py-24 px-6 max-w-7xl mx-auto">
      <div
        className={cn(
          "flex items-end justify-between mb-14 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        )}
      >
        <div>
          <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold mb-4">
            — Top rated near you —
          </div>
          <h2 className="text-4xl font-headline font-bold tracking-tight mb-2">
            Local <span className="text-primary">gems</span>
          </h2>
          <p className="text-on-surface-variant">The most booked salons in your neighbourhood right now.</p>
        </div>
        <Link
          className="text-xs text-primary font-bold flex items-center gap-1.5 hover:underline underline-offset-4 shrink-0 transition-colors duration-200"
          href="/explore"
        >
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Lead card — 7 columns */}
        <div
          className={cn(
            "md:col-span-7 group transition-all duration-700 delay-100 ease-[cubic-bezier(0.32,0.72,0,1)]",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <div className="relative overflow-hidden h-[520px] rounded-tl-3xl rounded-br-3xl rounded-tr-xl rounded-bl-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-shadow duration-500">
            <Image
              src={lead.img}
              alt={lead.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-white/95 px-3 py-1 rounded-full text-xs font-semibold text-primary">
                {lead.tag}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-start mt-5">
            <div>
              <h3 className="text-xl font-headline font-bold group-hover:text-primary transition-colors duration-300">
                {lead.name}
              </h3>
              <p className="text-sm text-on-surface-variant">{lead.type} · {lead.location}</p>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-low px-2.5 py-1.5 rounded-full shrink-0">
              <Star className="size-3.5 text-primary" weight="fill" />
              <span className="text-sm font-bold">{lead.rating}</span>
            </div>
          </div>
        </div>

        {/* Two stacked cards — 5 columns */}
        <div className="md:col-span-5 flex flex-col gap-5">
          {rest.map((salon, i) => (
            <div
              key={salon.name}
              className={cn(
                "group flex-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
              )}
              style={{ transitionDelay: inView ? `${(i + 2) * 100}ms` : "0ms" }}
            >
              <div className="relative overflow-hidden h-[240px] rounded-tl-2xl rounded-br-2xl rounded-tr-lg rounded-bl-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)] transition-shadow duration-500">
                <Image
                  src={salon.img}
                  alt={salon.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/95 px-2.5 py-1 rounded-full text-xs font-semibold text-primary">
                    {salon.tag}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-start mt-4">
                <div>
                  <h3 className="text-base font-headline font-bold group-hover:text-primary transition-colors duration-300">
                    {salon.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">{salon.type} · {salon.location}</p>
                </div>
                <div className="flex items-center gap-1 bg-surface-container-low px-2.5 py-1.5 rounded-full shrink-0">
                  <Star className="size-3 text-primary" weight="fill" />
                  <span className="text-xs font-bold">{salon.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PopularSalons
