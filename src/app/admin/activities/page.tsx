import ActivitiesTable from './ActivitiesTable'
import { getActivities } from '@/lib/services/server/activities/get'

export default async function ActivitiesPage() {
  const activities = await getActivities();
  return (
    <section>
      <ActivitiesTable activities={activities} />
    </section>
  )
}
