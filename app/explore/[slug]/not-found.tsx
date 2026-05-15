import MainLayout from '@/components/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPinPlus, Scissors, ShieldCheck, ThumbsUp, TrendingUp } from 'lucide-react'

function BusinessNotFound() {
  return (
    <MainLayout>
      <div className="w-full min-h-[80vh] flex flex-col justify-center items-center space-y-4">
        <h1 className="text-2xl font-bold mt-10 lg:mt-0">Salon not found</h1>
        <p className="max-w-sm text-center">{"We are expending rapidly to bring local salons onboard. You're favourite salon will be on the map soon."}</p>
        <div className="flex items-center justify-center gap-3">
          <Button className="rounded-sm h-10 px-6 hover:bg-primary/80" size="lg">
            <Scissors className="size-4 text-white" /> List Your Salon
          </Button>
          <Button variant="outline" className="rounded-sm h-10 px-6" size="lg">
            <MapPinPlus className="size-4 text-primary" /> Nominate a Salon
          </Button>
        </div>

        <div className="w-full flex flex-col gap-1 items-start mt-10">
          <h2 className="text-lg font-medium">{"Let's Build"} <span className="text-primary">Together</span></h2>
          <p className="text-sm text-gray-400 max-w-sm">{"Our platform is more than just a directory. It's a community-led movement to empower local salons."}</p>
        </div>
        <div className="w-full grid lg:grid-cols-3 gap-4">
          <Card className="bg-gray-100">
            <CardHeader>
              <div className="flex flex-col gap-6">
                <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center">
                  <ThumbsUp className="size-5 text-primary" />
                </div>

                <CardTitle className="font-bold">You Recommend</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="max-w-xs text-muted-foreground">Submit the names of your salons or beauty salons in your neighbourhood. We prioritise based on community demand.</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-100">
            <CardHeader>
              <div className="flex flex-col gap-6">
                <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center">
                  <ShieldCheck className="size-5 text-primary" />
                </div>

                <CardTitle className="font-bold">We Verify</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="max-w-xs text-muted-foreground">Any nominated salon or business is researched and verified to ensure they meet quality and safety standard before listing.</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-100">
            <CardHeader>
              <div className="flex flex-col gap-6">
                <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center">
                  <TrendingUp className="size-5 text-primary" />
                </div>

                <CardTitle className="font-bold">Grow</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="max-w-xs text-muted-foreground">Salons get access to booking tools, visibility and a wider audience</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </MainLayout>
  )
}

export default BusinessNotFound