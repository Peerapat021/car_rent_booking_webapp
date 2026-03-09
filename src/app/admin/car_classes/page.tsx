import CarClassesTable from './CarClassesTable'
import { getClassesServer } from '@/lib/services/server/car_classes/get'

export default async function BookingPage() {
  const car_classes = await getClassesServer();
  return (
    <section>
      <CarClassesTable car_classes={car_classes} />
    </section>
  )
}
