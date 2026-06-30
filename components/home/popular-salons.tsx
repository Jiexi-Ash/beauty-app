import Image from 'next/image'
import { ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'

const salons = [
    {
        name: "Glow Up Bar Soweto",
        type: "Hair & Braiding",
        location: "Orlando East",
        tag: "Local favorite",
        rating: "4.87",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXM0O7EH2I5M2EeM8gjnv5n4oO_WANC4qSPGgxNq7TcuoICYJVRzCxaCT1sIK88EsyUwB7Fv1URvU9AOPozS6iXD1hNVBgAP0p1pnHdJmCDmnZoAv5m3TnSq1dV2X27DU51Yrs6Ybnb2hu_0AJRnbExQq00mMCiv7JSn0PuPH7jFCtN18QUdhdsh5V_bwMh4TFyD0RP8zKvnDyKX_irilkwq1ex8OPH2wEp6VwEBrCKYBlwpErv9aOQlj7QRZFTxR_7KOF-drPf5pV",
        tall: true,
    },
    {
        name: "The Fade Factory",
        type: "Barber Shop",
        location: "Mamelodi",
        tag: "Top rated",
        rating: "4.83",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAauPzPf1rOwH6AVnL2r8Bn3ZJ031zWbw_pDWTuxp2p16zR0WlEuK6DbgB9ZstQM-IV6n-6kmwISvNeH4Oza4UM_fX_D3I7FOtF-dpMBUnkS8cvj0y3nViMVVwzT9iSpSG-x_g7E8JDxazTURhTfB9X2OBbdO7NmloWkfsaqmY8diQ4c6MARpRw-vLhi3wFsWexuFGenB-EuC-jfVl0BnnL7cv0RGY0fcHpCNzuGZmf1PX92C4x0R9vpB3f-KP0pXNEDxdNak-GIz0h",
        tall: false,
    },
    {
        name: "Tips & Toes Lounge",
        type: "Nails & Spa",
        location: "Khayelitsha",
        tag: "New",
        rating: "5.0",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjo-mWxQ0qxMX1NqjoIYYaKI_4H4LWeHBUl0NnpUN_7xHFco0rQJzQuf8t-7w-w4-ARw34HhFatPL1o5j8INwXZWEGxZZkWZ-05eONqeM6QGeoQJuFmEvdTtRAbhNxrttfXVjVPP1xjHOM16LXi9wBBNqPEL4GACYWfQOa7UkEMAhom50RIRoWLsaAl7qf16Zd6uEk4DRaxs4feUNO6FqovOi5hXVdfUh1vunsnMcslZxst1rQZOJ_G-0wy78HrU3LaX7-N89taMO",
        tall: false,
    },
]

function PopularSalons() {
    const [lead, ...rest] = salons

    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-14">
                <div>
                    <h2 className="text-4xl font-headline font-bold tracking-tight mb-2">Local <span className="text-primary">Gems</span></h2>
                    <p className="text-on-surface-variant">The most booked salons in your neighbourhood right now.</p>
                </div>
                <Link className="text-xs text-primary font-bold flex items-center gap-1.5 hover:underline underline-offset-4 shrink-0" href="/explore">
                    View all <ArrowRight className="size-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Lead card — takes 7 columns */}
                <div className="md:col-span-7 group">
                    <div className="relative overflow-hidden h-[520px]">
                        <Image
                            src={lead.img}
                            alt={lead.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105 rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg"
                        />
                        <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-primary">{lead.tag}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-start mt-5">
                        <div>
                            <h3 className="text-xl font-headline font-bold group-hover:text-primary transition-colors">{lead.name}</h3>
                            <p className="text-sm text-on-surface-variant">{lead.type} · {lead.location}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg shrink-0">
                            <Star className="size-3.5 text-primary fill-primary" />
                            <span className="text-sm font-bold">{lead.rating}</span>
                        </div>
                    </div>
                </div>

                {/* Two stacked cards — 5 columns */}
                <div className="md:col-span-5 flex flex-col gap-5">
                    {rest.map((salon) => (
                        <div key={salon.name} className="group flex-1">
                            <div className="relative overflow-hidden h-[240px]">
                                <Image
                                    src={salon.img}
                                    alt={salon.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105 rounded-tl-2xl rounded-br-2xl rounded-tr-lg rounded-bl-lg"
                                />
                                <div className="absolute top-3 left-3">
                                    <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold text-primary">{salon.tag}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-start mt-4">
                                <div>
                                    <h3 className="text-base font-headline font-bold group-hover:text-primary transition-colors">{salon.name}</h3>
                                    <p className="text-xs text-on-surface-variant">{salon.type} · {salon.location}</p>
                                </div>
                                <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg shrink-0">
                                    <Star className="size-3 text-primary fill-primary" />
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
