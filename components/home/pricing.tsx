"use client"
import PricingCards from "@/components/pricing-cards"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

function Pricing() {
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="py-24 px-6 max-w-7xl mx-auto" id="pricing">
      <div
        className={cn(
          "text-center mb-16 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
          inView ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
        )}
      >
        <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold mb-4">
          — Simple, fair pricing —
        </div>
        <h2 className="text-4xl font-headline font-bold mb-4">
          Pricing that respects the <span className="text-primary">community</span>
        </h2>
        <p className="text-on-surface-variant">Choose the plan that fits your current hustle.</p>
      </div>

      <div
        className={cn(
          "transition-all duration-700 delay-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
          inView ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
        )}
      >
        <PricingCards />
      </div>
    </section>
  )
}

export default Pricing
