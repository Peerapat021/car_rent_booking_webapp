import CouponTable from './CouponTable'
import { getCouponsServer } from '@/lib/services/server/coupons/get'

export default async function CouponPage() {
  const coupons = await getCouponsServer();
  return (
    <section>
      <CouponTable coupons={coupons} />
    </section>
  )
}
