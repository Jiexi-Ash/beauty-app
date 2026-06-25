import { getAuthToken } from '@/auth';
import BusinessSettings from '@/components/business/business-settings';
import { api } from '@/convex/_generated/api';
import { preloadQuery } from 'convex/nextjs';

async function DashboardSettings() {
    const token = await getAuthToken();
    const preloadedBusiness = await preloadQuery(
        api.business.admin.getUserBusiness,
        {},
        { token },
    );

    return <BusinessSettings preloadedBusiness={preloadedBusiness} />
}

export default DashboardSettings
