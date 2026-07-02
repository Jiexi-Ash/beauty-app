import { getAuthToken } from '@/auth'
import Favorites from '@/components/favorites'
import { api } from '@/convex/_generated/api'
import { preloadQuery } from 'convex/nextjs'

async function FavoritesPage() {
    const token = await getAuthToken()

    const preloadedFavorites = await preloadQuery(api.users.getUserFavorites, {}, { token })
    return (
        <Favorites preloadedFavorites={preloadedFavorites} />
    )
}

export default FavoritesPage
