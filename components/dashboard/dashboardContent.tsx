"use client"

import { Doc } from "@/convex/_generated/dataModel";



interface DashboardContentProps {
    business: Doc<"business">
}
function DashboardContent({ business }: DashboardContentProps) {
    return (
        <div className="min-h-screen w-full">{business.name}</div>
    )
}

export default DashboardContent