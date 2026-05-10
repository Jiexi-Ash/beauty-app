import { getAuthToken } from '@/auth';
import BusinessProfile from '@/components/business/business-profile';
import MainLayout from '@/components/main-layout';
import Navbar from '@/components/navbar';
import { api } from '@/convex/_generated/api';
import { preloadQuery } from 'convex/nextjs';

interface ExploreBusinessPageProps {
    params: {
        slug: string;
    };
}

async function ExploreBusinessPage({ params }: ExploreBusinessPageProps) {
    const { slug } = await params;
    const token = await getAuthToken()
    const preloadedBusiness = await preloadQuery(
        api.business.public.getBusinessBySlug,
        { slug: slug },
        { token }
    )
    return (
        <MainLayout>
            <BusinessProfile preloadedBusiness={preloadedBusiness} />
        </MainLayout>
    )




}

export default ExploreBusinessPage