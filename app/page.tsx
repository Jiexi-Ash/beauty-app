import Navbar from "@/components/navbar";
import Hero from "@/components/home/hero";
import Features from "@/components/home/features";
import PopularSalons from "@/components/home/popular-salons";
import Testimonials from "@/components/home/testimonials";
import Pricing from "@/components/home/pricing";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <PopularSalons />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
