import Image from 'next/image'

const testimonials = [
    {
        quote: "Switching to The Beauty App was the best decision for my salon. It brought professional management to my business without the massive costs.",
        name: "Lerato Mokoena",
        role: "Owner, Lerato's Luxe Braids",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7yCAFBv55c3QbdD75z84DIns-TE78AcAVWU8zLCm0ncbR2_L0nC_Mvq55L4VpUUbwH0Wyi49H4zB1BWgyN2E_L_HOIcf2vGR2uz1COSUAnW7cMnaWZnPOkaK01QIq69nzKo9hs-kYJolW1ZWvY3hsWX-Si6hYxYHR68nsBBPXf6o42aAdexNn99a2LBEMBD2Tci2gq9wYzwtyXPgygKTIdyx0vjMm_rEcfkiJmpTb0-uDj7c3zkQ-M3pyNUOKwyHKSv65uwXkwhhU",
    },
    {
        quote: "Before this I was running everything on WhatsApp and a notebook. Now my clients book themselves, I get reminders, and I actually know my numbers.",
        name: "Sipho Ndlovu",
        role: "Owner, The Fade Factory Mamelodi",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAauPzPf1rOwH6AVnL2r8Bn3ZJ031zWbw_pDWTuxp2p16zR0WlEuK6DbgB9ZstQM-IV6n-6kmwISvNeH4Oza4UM_fX_D3I7FOtF-dpMBUnkS8cvj0y3nViMVVwzT9iSpSG-x_g7E8JDxazTURhTfB9X2OBbdO7NmloWkfsaqmY8diQ4c6MARpRw-vLhi3wFsWexuFGenB-EuC-jfVl0BnnL7cv0RGY0fcHpCNzuGZmf1PX92C4x0R9vpB3f-KP0pXNEDxdNak-GIz0h",
    },
    {
        quote: "The commission model on the free tier is honest — I started small and moved to Pro once I had the bookings to justify it. No pressure.",
        name: "Nomsa Dlamini",
        role: "Owner, Tips & Toes Lounge",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjo-mWxQ0qxMX1NqjoIYYaKI_4H4LWeHBUl0NnpUN_7xHFco0rQJzQuf8t-7w-w4-ARw34HhFatPL1o5j8INwXZWEGxZZkWZ-05eONqeM6QGeoQJuFmEvdTtRAbhNxrttfXVjVPP1xjHOM16LXi9wBBNqPEL4GACYWfQOa7UkEMAhom50RIRoWLsaAl7qf16Zd6uEk4DRAxs4feUNO6FqovOi5hXVdfUh1vunsnMcslZxst1rQZOJ_G-0wy78HrU3LaX7-N89taMO",
    },
]

function Testimonials() {
    return (
        <section className="bg-surface-container py-24 px-6 overflow-hidden relative">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-14">
                    <h2 className="text-4xl font-headline font-bold tracking-tight mb-2">From the community</h2>
                    <p className="text-on-surface-variant">Real owners, real results.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.name} className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between gap-8">
                            <p className="text-lg font-medium leading-relaxed">
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full overflow-hidden relative shrink-0">
                                    <Image
                                        src={t.img}
                                        alt={t.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{t.name}</p>
                                    <p className="text-on-surface-variant text-xs">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="absolute top-1/2 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/2 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </section>
    )
}

export default Testimonials
