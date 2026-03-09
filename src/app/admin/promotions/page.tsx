import PromotionTable from './PromotionTable'
import { getPromotionsServer } from '@/lib/services/server/promotions/get'

export default async function PaymentPage() {
  const promotions = await getPromotionsServer();
  return (
    <section>
      <PromotionTable promotions={promotions} />
    </section>
  )
}
