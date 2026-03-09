import CouponUsageTable from './CouponUsagestale'
import { getCouponUsagesServer } from '@/lib/services/server/couponUsages/get'

export default async function CouponPage() {
  const couponUsages = await getCouponUsagesServer();
  return (
    <section>
      <CouponUsageTable couponUsages={couponUsages} />
    </section>
  )
}
