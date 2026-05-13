import { CalendarDays, UserRoundSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function Features() {
    return (
        <section className="bg-surface-container-low py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <h2 className="text-4xl font-headline font-bold mb-4 tracking-tight">Built for Your <span className="text-primary">Hustle</span></h2>
                    <p className="text-on-surface-variant">Professional tools, community-centric pricing.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Seamless Booking */}
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

                    {/*  Low-Cost Subscription */}
                    <div className="bg-gradient-to-br from-primary to-primary-container p-10 rounded-xl text-white flex flex-col justify-center">
                        <div className="mb-8">
                            <h3 className="text-2xl font-headline font-bold mb-4">Low-Cost Subscription</h3>
                            <p className="opacity-90 leading-relaxed">Forget high commission fees. We believe in keeping the profit in the community with a flat-rate plan that scales with you.</p>
                        </div>
                        <p className="text-4xl font-black mb-2">From R69/mo</p>
                        <p className="text-xs uppercase tracking-widest opacity-70">No hidden fees. Cancel anytime.</p>
                    </div>

                    {/* Customer Records */}
                    <div className="bg-surface-container-lowest p-10 rounded-xl hover:shadow-lg transition-shadow duration-500">
                        <div className="w-14 h-14 bg-secondary-container-ds rounded-full flex items-center justify-center text-primary mb-8">
                            <UserRoundSearch className="size-6" />
                        </div>
                        <h3 className="text-2xl font-headline font-bold mb-4">Customer Records</h3>
                        <p className="text-on-surface-variant">Store preferences, allergy alerts, and visit history to provide that personalized service every single time.</p>
                    </div>

                    {/*  CTA */}
                    <div className="md:col-span-2 bg-gradient-to-br from-primary to-primary-container p-10 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-headline font-bold text-white mb-2">Ready to grow your business?</h3>
                            <p className="text-white/80 text-sm">Join thousands of local entrepreneurs scaling their salon today.</p>
                        </div>
                        <Link href="/onboarding" className="shrink-0">
                            <Button className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-6 rounded-full text-sm whitespace-nowrap">
                                List Your Business
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Features