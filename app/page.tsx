import Navbar from "@/components/navbar";
import Image from "next/image";
import { Search, Verified, CalendarDays, UserRoundSearch, Star, Quote, ArrowRight, Share2 } from "lucide-react";
import PricingCards from "@/components/pricing-cards";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-white">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="max-w-[1440px] mx-auto px-6 py-20 grid grid-cols-12 gap-8 items-center" id="search">
          <div className="col-span-12 md:col-span-7">
            <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tighter leading-[0.9] mb-8">
              Your Community <br />
              <span className="text-primary italic">Beauty,</span> Booked.
            </h1>
            <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed mb-8">
              Bridge the gap between editorial luxury and kasi pride. Premium booking management for business owners, effortless self-care for everyone else.
            </p>

            {/* Search Bar */}
            <div className="mb-10 w-full max-w-xl">
              <div className="flex items-center bg-white rounded-full p-2 shadow-xl shadow-primary/5 border border-surface-container-high focus-within:border-primary/30 transition-all duration-300">
                <div className="pl-4 pr-2 text-on-surface-variant flex items-center">
                  <Search className="size-6 text-primary" />
                </div>
                <input
                  className="w-full bg-transparent border-none focus:outline-none text-on-surface placeholder:text-on-surface-variant/60 font-medium py-3"
                  placeholder="Search for salons, barbers, or spas..."
                  type="text"
                />
                <button className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-container transition-all shadow-lg shadow-primary/20 whitespace-nowrap cursor-pointer">
                  Search
                </button>
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

        {/* Features Bento Grid */}
        <section className="bg-surface-container-low py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl font-headline font-bold mb-4 tracking-tight">Built for Your <span className="text-primary">Hustle</span></h2>
              <p className="text-on-surface-variant">Professional tools, community-centric pricing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature Card 1 - Seamless Booking */}
              <div className="md:col-span-2 bg-surface-container-lowest p-10 rounded-xl flex flex-col justify-between hover:shadow-lg transition-shadow duration-500">
                <div>
                  <div className="w-14 h-14 bg-secondary-container-ds rounded-full flex items-center justify-center text-primary mb-8">
                    <CalendarDays className="size-6" />
                  </div>
                  <h3 className="text-3xl font-headline font-bold mb-4">Seamless Booking Management</h3>
                  <p className="text-on-surface-variant max-w-md text-lg">Automated scheduling, reminders, and cancellations that keep your chairs full without the headache of manual logs.</p>
                </div>
                <div className="mt-12 flex gap-4">
                  <span className="bg-surface-container-low px-4 py-2 rounded-full text-sm font-semibold">Real-time Sync</span>
                  <span className="bg-surface-container-low px-4 py-2 rounded-full text-sm font-semibold">Whatsapp Reminders</span>
                </div>
              </div>

              {/* Feature Card 2 - Low-Cost Subscription */}
              <div className="bg-gradient-to-br from-primary to-primary-container p-10 rounded-xl text-white flex flex-col justify-center">
                <div className="mb-8">
                  <h3 className="text-2xl font-headline font-bold mb-4">Low-Cost Subscription</h3>
                  <p className="opacity-90 leading-relaxed">Forget high commission fees. We believe in keeping the profit in the community with a flat-rate plan that scales with you.</p>
                </div>
                <p className="text-4xl font-black mb-2">From R69/mo</p>
                <p className="text-xs uppercase tracking-widest opacity-70">No hidden fees. Cancel anytime.</p>
              </div>

              {/* Feature Card 3 - Customer Records */}
              <div className="bg-surface-container-lowest p-10 rounded-xl hover:shadow-lg transition-shadow duration-500">
                <div className="w-14 h-14 bg-secondary-container-ds rounded-full flex items-center justify-center text-primary mb-8">
                  <UserRoundSearch className="size-6" />
                </div>
                <h3 className="text-2xl font-headline font-bold mb-4">Customer Records</h3>
                <p className="text-on-surface-variant">Store preferences, allergy alerts, and visit history to provide that personalized &apos;kasi&apos; service every single time.</p>
              </div>

              {/* Feature Card 4 - Dashboard Preview */}
              <div className="md:col-span-2 bg-surface p-1 rounded-xl flex items-center justify-center overflow-hidden">
                <div className="w-full h-64 bg-surface-container-high rounded-lg relative overflow-hidden">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBz8gJecoPGf9wpA_leuy9N33YQQfhdKV7yZ6jS60uc1slUOMR6Ljo6jn3jHTy757Sk10sIOvXGZqWo4U_Vw59w6Qmroc1NgTJ_WaPCnx8P10VvmCxaW4DV01Ysk-6tlauPL4o3wBqK8ypjboLmQ97cmeNR120J8evINfku9wstL1r9PRHJByfCj9N6wj6Alyh3BYmrW00RLR7Pm1OOPfOnGZtuPdf_EPNS8IZ9PpbEDQMQiOA-o41XBlChpworORmNrvmA6726q67H"
                    alt="Salon Dashboard"
                    fill
                    className="object-cover grayscale opacity-50"
                  />
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <button className="bg-white text-primary px-6 py-3 rounded-full font-bold shadow-xl cursor-pointer">Watch Demo</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Salons Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-headline font-bold tracking-tight mb-2">Local <span className="text-primary">Gems</span></h2>
              <p className="text-on-surface-variant">The most booked salons in your neighborhood right now.</p>
            </div>
            <a className="text-primary font-bold flex items-center gap-2 hover:underline underline-offset-4" href="#">
              View All <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Glow Up Bar Soweto",
                type: "Hair & Braiding • Orlando East",
                tag: "LOCAL FAVORITE",
                rating: "4.9",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXM0O7EH2I5M2EeM8gjnv5n4oO_WANC4qSPGgxNq7TcuoICYJVRzCxaCT1sIK88EsyUwB7Fv1URvU9AOPozS6iXD1hNVBgAP0p1pnHdJmCDmnZoAv5m3TnSq1dV2X27DU51Yrs6Ybnb2hu_0AJRnbExQq00mMCiv7JSn0PuPH7jFCtN18QUdhdsh5V_bwMh4TFyD0RP8zKvnDyKX_irilkwq1ex8OPH2wEp6VwEBrCKYBlwpErv9aOQlj7QRZFTxR_7KOF-drPf5pV",
              },
              {
                name: "The Fade Factory",
                type: "Barber Shop • Mamelodi",
                tag: "TOP RATED",
                rating: "4.8",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAauPzPf1rOwH6AVnL2r8Bn3ZJ031zWbw_pDWTuxp2p16zR0WlEuK6DbgB9ZstQM-IV6n-6kmwISvNeH4Oza4UM_fX_D3I7FOtF-dpMBUnkS8cvj0y3nViMVVwzT9iSpSG-x_g7E8JDxazTURhTfB9X2OBbdO7NmloWkfsaqmY8diQ4c6MARpRw-vLhi3wFsWexuFGenB-EuC-jfVl0BnnL7cv0RGY0fcHpCNzuGZmf1PX92C4x0R9vpB3f-KP0pXNEDxdNak-GIz0h",
              },
              {
                name: "Tips & Toes Lounge",
                type: "Nails & Spa • Khayelitsha",
                tag: "NEW ARRIVAL",
                rating: "5.0",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjo-mWxQ0qxMX1NqjoIYYaKI_4H4LWeHBUl0NnpUN_7xHFco0rQJzQuf8t-7w-w4-ARw34HhFatPL1o5j8INwXZWEGxZZkWZ-05eONqeM6QGeoQJuFmEvdTtRAbhNxrttfXVjVPP1xjHOM16LXi9wBBNqPEL4GACYWfQOa7UkEMAhom50RIRoWLsaAl7qf16Zd6uEk4DRXaxs4feUNO6FqovOi5hXVdfUh1vunsnMcslZxst1rQZOJ_G-0wy78HrU3LaX7-N89taMO",
              },
            ].map((salon) => (
              <div key={salon.name} className="group">
                <div className="relative overflow-hidden mb-6 h-[400px]">
                  <Image
                    src={salon.img}
                    alt={salon.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary">{salon.tag}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-headline font-bold group-hover:text-primary transition-colors">{salon.name}</h3>
                    <p className="text-sm text-on-surface-variant">{salon.type}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
                    <Star className="size-3.5 text-primary fill-primary" />
                    <span className="text-sm font-bold">{salon.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        <section className="bg-surface-container py-24 px-6 overflow-hidden relative">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <Quote className="size-16 text-primary/20 mx-auto mb-8" />
            <p className="text-3xl md:text-4xl font-headline font-bold italic leading-tight mb-12">
              &ldquo;Switching to The Beauty App was the best decision for my salon. It brought professional management to my &apos;kasi&apos; business without the massive costs. My bookings have doubled since clients can book even at midnight.&rdquo;
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

        {/* Pricing Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto" id="pricing">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-headline font-bold mb-4">Pricing that respects the <span className="text-primary">community</span></h2>
            <p className="text-on-surface-variant">Choose the plan that fits your current hustle.</p>
          </div>

          <PricingCards />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low w-full py-16 px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-7xl mx-auto text-sm">
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-black mb-4 block font-headline">The Beauty <span className="text-primary">App</span></span>
            <p className="text-on-surface-variant mb-6 max-w-xs">Connecting community talent with local beauty lovers.</p>
            <div className="flex gap-4">
              <a className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors" href="#">
                <Share2 className="size-4" />
              </a>
            </div>
          </div>
          <div>
            <h5 className="font-bold mb-6">Platform</h5>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#">Search</a></li>
              <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#pricing">Pricing</a></li>
              <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#">Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6">Company</h5>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#">About</a></li>
              <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#">Careers</a></li>
              <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6">Legal</h5>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#">Privacy Policy</a></li>
              <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-surface-container-high flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant text-sm">© 2024 The Beauty App. The Elevated Community Standard.</p>
        </div>
      </footer>
    </div>
  );
}
