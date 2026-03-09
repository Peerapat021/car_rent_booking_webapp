import CarTable from './CarTable'
import { getCarsServer } from '@/lib/services/server/cars/get'
import { getClassesServer } from '@/lib/services/server/car_classes/get'

export default async function CarPage() {
  const cars = await getCarsServer();
  const carClasses = await getClassesServer();

  return (
    <section>
      <CarTable cars={cars} carClasses={carClasses} />
    </section>
  )
}
