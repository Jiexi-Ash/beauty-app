import { getAuthToken } from '@/auth';
import BusinessProfile from '@/components/business/business-profile';
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
    return <div className="w-full min-h-screen bg-stone-50">
        <Navbar />
        <BusinessProfile preloadedBusiness={preloadedBusiness} />
    </div>


}

export default ExploreBusinessPage