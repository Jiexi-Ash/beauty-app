import PricingCards from '@/components/pricing-cards'

function Pricing() {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto" id="pricing">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-headline font-bold mb-4">Pricing that respects the <span className="text-primary">community</span></h2>
                <p className="text-on-surface-variant">Choose the plan that fits your current hustle.</p>
            </div>

            <PricingCards />
        </section>
    )
}

export default Pricing