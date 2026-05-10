
import { getAuthToken } from '@/auth'
import Explore from '@/components/explore'
import MainLayout from '@/components/main-layout'
import Navbar from '@/components/navbar'
import { api } from '@/convex/_generated/api'
import { preloadQuery } from 'convex/nextjs'
import React from 'react'

async function ExplorePage() {
    const token = await getAuthToken()
    const preloadBusinesses = await preloadQuery(api.business.public.getBusinesses, { limit: 12 }, { token })
    return (
        <MainLayout>
            <Explore preloadedBusinesses={preloadBusinesses} />
        </MainLayout>

    )
}

export default ExplorePage