import CitiesTable from './CitiesTable'
import { getCities } from '@/lib/services/server/cities/get'

export default async function CitiesPage() {
  const cities = await getCities();
  return (
    <section>
      <CitiesTable cities={cities} />
    </section>
  )
}
