import Navbar from "@/components/navbar";
import Hero from "@/components/home/hero";
import PopularSalons from "@/components/home/popular-salons";
import BusinessTeaser from "@/components/home/business-teaser";
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
        <PopularSalons preloadedBusinesses={preloadedBusinesses} />
        <BusinessTeaser />
      </main>
      <Footer />
    </div>
  );
}
