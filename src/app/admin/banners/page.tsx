import BannersTable from './BannersTable'
import { getBannersServer } from '@/lib/services/server/banners/get'

export default async function BannersPage() {
  const banners = await getBannersServer();
  return (
    <section>
      <BannersTable banners={banners} />
    </section>
  )
}
