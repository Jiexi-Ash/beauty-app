import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function ServiceHighlight() {
  return (
    <Card className="rounded lg:w-[300px] bg-primary">
      <CardHeader>
        <CardTitle className="text-primary-foreground font-bold">
          Service Highlight
        </CardTitle>
        <CardDescription className="text-muted text-xs">{`box braids is your top performing service this week with 14 bookings`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/25 flex items-center justify-between p-2 rounded-lg">
          <span className="text-muted font-medium">Box Braids</span>
          <Badge className="bg-primary">14 Bookings</Badge>
        </div>
        <div className="bg-white/25 flex items-center justify-between p-2 rounded-lg">
          <span className="text-muted font-medium">Sticth Braids</span>
          <Badge className="bg-primary">8 Bookings</Badge>
        </div>
        <div className="bg-white/25 flex items-center justify-between p-2 rounded-lg">
          <span className="text-muted font-medium">Fade Cut</span>
          <Badge className="bg-primary">6 Bookings</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default ServiceHighlight;
