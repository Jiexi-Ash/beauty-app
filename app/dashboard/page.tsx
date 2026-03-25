import { getAuthToken } from '@/auth'
import DashboardContent from '@/components/dashboard/dashboardContent';
import { api } from '@/convex/_generated/api';
import { fetchQuery } from "convex/nextjs";
import { CalendarDays, LayoutGrid, Scissors, Users } from 'lucide-react';
import { redirect } from 'next/navigation';

async function DashboardPage() {
    const token = await getAuthToken();
    const business = await fetchQuery(api.business.admin.getUserBusiness, {}, { token })

    if (!business) redirect("/onboarding")
    return (
        <div className="w-full min-h-screen justify-center items-center bg-[#F5F5F5]">
            <DashboardContent business={business} />

            <footer className="sticky bottom-0  border-t border-border grid grid-cols-4 gap-4 p-6">
                <div className="flex flex-col gap-1 items-center text-primary bg-white py-2 px-4 rounded-md shadow-sm">
                    <LayoutGrid className="size-6" strokeWidth={1.5} />
                    <span className="text-xs font-semibold">OVERVIEW</span>
                </div>
                <div className="flex flex-col gap-1 items-center py-2 px-4 text-gray-500">
                    <CalendarDays className="size-6 text-gray-500" />
                    <span className="text-xs text-gray-500">Bookings</span>
                </div>
                <div className="flex flex-col gap-1 items-center py-2 px-4">
                    <Scissors className="size-6 text-gray-500" />
                    <span className="text-xs text-gray-500">Services</span>
                </div>

                <div className="flex flex-col gap-1 items-center py-2 px-4">
                    <Users className="size-6 text-gray-500" />
                    <span className="text-xs text-gray-500">Bookings</span>
                </div>
            </footer>
        </div>
    )
}

export default DashboardPage