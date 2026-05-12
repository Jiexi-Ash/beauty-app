import { getAuthToken } from '@/auth'
import MainLayout from '@/components/main-layout'
import UserProfile from '@/components/user/user-profile'
import { api } from '@/convex/_generated/api'
import { fetchQuery } from 'convex/nextjs'
import React from 'react'

async function ProfilePage() {
  const token = await getAuthToken()

  const userDetails = await fetchQuery(api.users.getUserProfileDetails, {}, { token: token })
  return (
    <MainLayout>
      <UserProfile profileDetails={userDetails} />
    </MainLayout>
  )
}

export default ProfilePage