import { CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

type PricingPlan = {
  name: string;
  description: string;
  price: string;
  priceSuffix: string;
  features: { text: string; bold?: boolean }[];
  cta: string;
  popular?: boolean;
};

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
      { text: "Manual reminders on client login" },
      { text: "10% commission per booking" },
    ],
    cta: "Start for Free",
  },
  {
    name: "Pro Growth",
    description: "Full suite for solo operators growing fast.",
    price: "R69",
    priceSuffix: "/mo",
    popular: true,
    features: [
      { text: "Zero commission — keep every rand", bold: true },
      { text: "Unlimited bookings" },
      { text: "Unlimited services listed" },
      { text: "Verified badge" },
      { text: "Automated WhatsApp reminders" },
      { text: 'Priority "Kasi Gem" placement' },
      { text: "Customer loyalty analytics" },
    ],
    cta: "Get Pro Access",
  },
  {
    name: "Business",
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
    cta: "Get Business Access",
  },
];

export default function PricingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={
            plan.popular
              ? "bg-surface-container-lowest p-7 rounded-xl border-2 border-primary relative shadow-2xl flex flex-col"
              : "bg-surface-container-lowest p-7 rounded-xl border border-outline-variant/20 hover:border-primary/40 transition-colors flex flex-col"
          }
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap">
              Most Popular
            </div>
          )}
          <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
          <p className="text-on-surface-variant text-sm mb-5">{plan.description}</p>
          <p className="text-4xl font-black mb-6">
            {plan.price}
            <span className="text-base font-medium text-on-surface-variant">{plan.priceSuffix}</span>
          </p>
          <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span className={`text-sm leading-snug ${feature.bold ? "font-bold" : ""}`}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant={plan.popular ? "default" : "outline"}
            className={
              plan.popular
                ? "w-full h-12 py-3.5 rounded-lg font-bold bg-primary text-white hover:bg-primary-container shadow-lg shadow-primary/20 transition-all cursor-pointer text-sm"
                : "w-full h-12 py-3.5 rounded-lg font-bold border-2 text-primary border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer text-sm"
            }
          >
            {plan.cta}
          </Button>
        </div>
      ))}
    </div>
  );
}
