import { getAuthToken } from '@/auth'
import PreloadedUserBookings from '@/components/user-bookings'
import { api } from '@/convex/_generated/api'
import { preloadQuery } from 'convex/nextjs'
import React from 'react'

async function UserBookingsPage() {

    const token = await getAuthToken()

    const preloadBookings = await preloadQuery(api.booking.user.getUserBookings, {}, { token })
    return (
        <PreloadedUserBookings preloadedBookings={preloadBookings} />
    )
}

export default UserBookingsPage