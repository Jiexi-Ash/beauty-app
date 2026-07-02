import Navbar from "@/components/navbar";
import Hero from "@/components/home/hero";
import Features from "@/components/home/features";
import PopularSalons from "@/components/home/popular-salons";
import Testimonials from "@/components/home/testimonials";
import Pricing from "@/components/home/pricing";
import Footer from "@/components/footer";
import { getAuthToken } from "@/auth";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";

export default async function Home() {
  const token = await getAuthToken();
  const preloadedBusinesses = await preloadQuery(
    api.business.public.getBusinesses,
    { limit: 3, sortByRating: true },
    { token },
  );

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-white">
      <Navbar />
      <main id="main-content">
        <Hero />
        <Features />
        <PopularSalons preloadedBusinesses={preloadedBusinesses} />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
