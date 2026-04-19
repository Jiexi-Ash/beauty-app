
import { getAuthToken } from '@/auth'
import Explore from '@/components/explore'
import Navbar from '@/components/navbar'
import { api } from '@/convex/_generated/api'
import { preloadQuery } from 'convex/nextjs'
import React from 'react'

async function ExplorePage() {
    const token = await getAuthToken()
    const preloadBusinesses = await preloadQuery(api.business.public.getBusinesses, { limit: 12 }, { token })
    return (
        <div className="w-full min-h-screen bg-stone-50">
            <Navbar />
            <Explore preloadedBusinesses={preloadBusinesses} />
        </div>
    )
}

export default ExplorePage