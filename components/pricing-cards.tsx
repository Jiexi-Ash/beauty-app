"use client"
import { CheckCircle } from "@phosphor-icons/react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

type PricingPlan = {
  name: string
  description: string
  price: string
  priceSuffix: string
  features: { text: string; bold?: boolean }[]
  cta: string
  popular?: boolean
  comingSoon?: boolean
}

const plans: PricingPlan[] = [
  {
    name: "Community Free",
    description: "For solo artists just getting started.",
    price: "FREE",
    priceSuffix: "/forever",
    features: [
      { text: "Unlimited bookings" },
      { text: "Up to 10 services listed" },
      { text: "Basic profile listing" },
      { text: "Automated WhatsApp reminders" },
      { text: "10% commission per booking" },
    ],
    cta: "Start for free",
  },
  {
    name: "Pro",
    description: "Full suite for solo operators growing fast.",
    price: "R69",
    priceSuffix: "/mo",
    popular: true,
    features: [
      { text: "Zero commission — keep every rand", bold: true },
      { text: "Unlimited bookings" },
      { text: "Unlimited services listed" },
      { text: "Verified badge" },
      { text: "Customer loyalty analytics" },
    ],
    cta: "Coming soon",
    comingSoon: true,
  },
  {
    name: "Premium",
    description: "For salons, barbershops and clinics with a team.",
    price: "R149",
    priceSuffix: "/mo",
    features: [
      { text: "Everything in Pro", bold: true },
      { text: "Multiple staff / specialist seats" },
      { text: "Per-specialist bookings & schedules" },
      { text: "Full business analytics dashboard" },
      { text: "Priority support" },
    ],
    cta: "Coming soon",
    comingSoon: true,
  },
]

export default function PricingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "relative rounded-2xl p-8 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            plan.popular
              ? "bg-primary text-white shadow-[0_24px_60px_rgba(221,39,94,0.22)] hover:-translate-y-1"
              : "bg-surface-container-lowest border border-outline-variant/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5",
          )}
        >
          {/* Inline recommended eyebrow — replaces the floating badge */}
          {plan.popular && (
            <div className="inline-flex w-fit items-center bg-white/20 text-white rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.15em] font-semibold mb-5">
              Recommended
            </div>
          )}

          {/* Name + description block — consistent height via min-h */}
          <div className="min-h-[72px] mb-6">
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className={cn("text-sm", plan.popular ? "text-white/75" : "text-on-surface-variant")}>
              {plan.description}
            </p>
          </div>

          {/* Price */}
          <div className={cn("pb-6 mb-6 border-b", plan.popular ? "border-white/15" : "border-outline-variant/20")}>
            <p className="text-5xl font-black">
              {plan.price}
              <span className={cn("text-base font-medium ml-1", plan.popular ? "text-white/60" : "text-on-surface-variant")}>
                {plan.priceSuffix}
              </span>
            </p>
          </div>

          {/* Feature list — flex-1 pins button to bottom */}
          <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2.5">
                <CheckCircle
                  size={16}
                  weight="fill"
                  className={cn("shrink-0 mt-0.5", plan.popular ? "text-white/70" : "text-primary")}
                />
                <span
                  className={cn(
                    "text-sm leading-snug",
                    feature.bold ? "font-bold" : "",
                    plan.popular ? "text-white/90" : "",
                  )}
                >
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA — pill shape, always at bottom */}
          <Button
            disabled={plan.comingSoon}
            className={cn(
              "w-full h-12 rounded-full font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]",
              plan.comingSoon
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer",
              plan.popular
                ? "bg-white text-primary hover:bg-white/90"
                : "border-2 border-primary text-primary hover:bg-primary hover:text-white",
            )}
            variant={plan.popular ? "default" : "outline"}
          >
            {plan.cta}
          </Button>
        </div>
      ))}
    </div>
  )
}
