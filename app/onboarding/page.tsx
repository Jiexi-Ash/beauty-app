import { getAuthToken } from '@/auth'
import Onboarding from '@/components/onboarding/onboarding'
import { api } from '@/convex/_generated/api'
import { fetchQuery } from 'convex/nextjs'
import { redirect } from 'next/navigation'


async function OnboardingPage() {
    const token = await getAuthToken()
    const business = await fetchQuery(api.business.admin.getUserBusiness, {}, { token })

    if (business) redirect("/dashboard")

    return (
        <Onboarding />
    )
}

export default OnboardingPage