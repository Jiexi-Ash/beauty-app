import { getAuthToken } from '@/auth'
import DashboardContent from '@/components/dashboard/dashboardContent';
import { api } from '@/convex/_generated/api';
import { preloadQuery } from "convex/nextjs";

async function DashboardPage() {
    const token = await getAuthToken();
    const preloadDashboard = await preloadQuery(api.business.admin.getUserBusiness, {}, { token: token })
    return (
        <div className="w-full h-screen justify-center items-center">
            <DashboardContent preloadDashboard={preloadDashboard} />
        </div>
    )
}

export default DashboardPage