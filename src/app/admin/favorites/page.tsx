import FavoritesTable from './FavoritesPage'
import { getFavoritesServer } from '@/lib/services/server/favorites/get'

export default async function CouponPage() {
    const favorites = await getFavoritesServer();
    return (
        <section>
            <FavoritesTable favorites={favorites} />
        </section>
    )
}
