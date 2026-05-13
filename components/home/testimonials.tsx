import Image from 'next/image'
import { Quote } from 'lucide-react'

function Testimonials() {
    return (
        <section className="bg-surface-container py-24 px-6 overflow-hidden relative">
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <Quote className="size-16 text-primary/20 mx-auto mb-8" />
                <p className="text-3xl md:text-4xl font-headline font-bold italic leading-tight mb-12">
                    &ldquo;Switching to The Beauty App was the best decision for my salon. It brought professional management to my business without the massive costs.&rdquo;
                </p>
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg mb-4 overflow-hidden relative">
                        <Image
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7yCAFBv55c3QbdD75z84DIns-TE78AcAVWU8zLCm0ncbR2_L0nC_Mvq55L4VpUUbwH0Wyi49H4zB1BWgyN2E_L_HOIcf2vGR2uz1COSUAnW7cMnaWZnPOkaK01QIq69nzKo9hs-kYJolW1ZWvY3hsWX-Si6hYxYHR68nsBBPXf6o42aAdexNn99a2LBEMBD2Tci2gq9wYzwtyXPgygKTIdyx0vjMm_rEcfkiJmpTb0-uDj7c3zkQ-M3pyNUOKwyHKSv65uwXkwhhU"
                            alt="Lerato Mokoena"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <h4 className="text-xl font-bold">Lerato Mokoena</h4>
                    <p className="text-on-surface-variant">Owner, Lerato&apos;s Luxe Braids</p>
                </div>
            </div>
            <div className="absolute top-1/2 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/2 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </section>
    )
}

export default Testimonials