"use client"

import { api } from "@/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react"
import Onboarding from "../onboarding";
import { useState } from "react";

interface DashboardContentProps {
    preloadDashboard: Preloaded<typeof api.business.admin.getUserBusiness>;
}
function DashboardContent({ preloadDashboard }: DashboardContentProps) {
    const business = usePreloadedQuery(preloadDashboard)

    if (!business) {
        return <div className="w-full h-full flex justify-center items-center">
            <Onboarding open={!business}/>
        </div>
    }
    return (
        <div>DashboardContent</div>
    )
}

export default DashboardContent