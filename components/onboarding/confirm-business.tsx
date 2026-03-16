"use client"
import { useBusinessStore } from '@/stores/use-business'
import { Card, CardContent } from '../ui/card'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, CreditCard, ImageIcon, MapPin, Store } from 'lucide-react'
import { Button } from '../ui/button'

function ConfirmBusiness() {
    const { step, business, payment, setSteps } = useBusinessStore()


    const coverImage = business?.coverImage
        ? URL.createObjectURL(business.coverImage)
        : null;
    return (

        <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-foreground">Almost there! Review your store details below.</p>
            </div>
            <Card className="border-border overflow-hidden">
                {business?.coverImage && coverImage && <Image src={coverImage} width={100} height={110} alt="Store" className="w-full h-28 object-cover" />}
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Details</span>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="text-sm font-semibold text-foreground">{business?.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Description</p>
                            <p className="text-sm text-foreground">{business?.description}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Address</p>
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                <p className="text-sm text-foreground">{business?.address}</p>
                            </div>
                        </div>
                        {!business?.coverImage && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <p className="text-xs italic">No store image uploaded</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Card className="border-border">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</span>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">PayFast Merchant ID</p>
                        <p className="text-sm font-mono font-semibold text-foreground">{payment?.merchantId}</p>
                    </div>
                </CardContent>
            </Card>


            {business && payment || step === "confirm" ? (
                <div className="py-4 border-t border-border flex justify-between">
                    <Button variant="outline" className="h-10 px-4 py-2" onClick={() => setSteps("payment")}>
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                    <Button className="h-10 px-4 py-2"  >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Launch Store
                    </Button>
                </div>
            ) : <div />}
        </div>

    )
}

export default ConfirmBusiness