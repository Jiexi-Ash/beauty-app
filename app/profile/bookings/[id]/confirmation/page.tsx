"use client"
import Image from 'next/image'
import { Calendar, Clock, MapPin, Check } from 'lucide-react'
import Navbar from '@/components/navbar'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { formatBookingTime } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import Footer from '@/components/footer'
import { BookingConfirmationSkeleton } from '@/components/skeletons/booking-confirmation'

function BookingConfirmationPage() {
    const { id } = useParams()
    const { data, isLoading } = useQuery({
        ...convexQuery(api.booking.queries.getUserBookingById, { bookingId: id as Id<"booking"> }),
    });

    if (isLoading) return <BookingConfirmationSkeleton />

    if (!data) return <p>no booking</p>

    const price = ((data.paymentDetails.amountPaid ?? 0) / 100).toFixed(2)

    return (
        <div className="w-full min-h-screen relative">
            <Navbar />


            <div className="absolute inset-0 z-0">
                <Image
                    src="/salon-image-placeholder.jpg"
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-white/80" />
            </div>

            <div className="relative z-10 flex flex-col items-center px-4 py-12">


                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6 shadow-lg">
                    <Check className="text-white w-8 h-8 stroke-[3]" />
                </div>


                <h1 className="text-5xl font-bold text-gray-900 text-center mb-3">
                    See you soon!
                </h1>
                <p className="text-gray-600 text-center max-w-sm mb-10">
                    Your appointment at
                    <span className="text-primary font-medium mx-1">{data.business.name}</span>
                    is confirmed.
                </p>


                <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/60">
                        {/* Status + amount */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold tracking-widest text-green-500 border border-green-300 rounded-full px-3 py-1 uppercase">
                                {data?.status}
                            </span>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">
                                    Amount Paid (<span>{data.paymentDetails.paymentType}</span>)
                                </p>
                                <p className="text-xl font-bold text-primary">R{price}</p>
                            </div>
                        </div>

                        {/* Service name */}
                        <h2 className="text-2xl font-bold text-gray-900 mb-5 leading-tight uppercase">
                            {data.service.name}
                        </h2>

                        {/* Date & Time */}
                        <div className="flex gap-8 mb-6">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Date</p>
                                    <p className="text-sm font-semibold text-gray-800">{data.startDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-gray-400">Time</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {formatBookingTime(data.time, data.business.timezone)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 mb-5" />

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button className="flex-1 bg-primary text-white font-semibold py-3 rounded-full hover:bg-primary/90 transition-colors">
                                Add to Calendar
                            </button>
                            <button className="flex-1 border-2 border-primary text-primary font-semibold py-3 rounded-full hover:bg-primary/5 transition-colors">
                                View Directions
                            </button>
                        </div>
                    </div>
                </div>

                <Card className="w-full max-w-3xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden p-0">
                    <CardContent className="p-0 flex flex-col">

                        <div className="relative w-full h-48 md:h-56">
                            <Image
                                src={data.business.coverImage ?? ""}
                                fill
                                alt="business cover image"
                                className="object-cover"
                            />
                        </div>

                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{data.business.name}</h3>
                            <div className="flex items-center gap-1">
                                <MapPin className="text-gray-400 size-4 shrink-0" />
                                <p className="text-gray-500 text-sm">{data.business.location}</p>
                            </div>
                            {data.business.tags && data.business.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {data.business.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-500 capitalize"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="relative z-10">
                <Footer />
            </div>

        </div>
    )
}

export default BookingConfirmationPage