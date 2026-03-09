import NotificationTable from './NotificationTable'
import { getNotifications } from '@/lib/services/server/notifications/get'

export default async function NotificationPage() {
  const initialNotifications = await getNotifications();
  return (
    <section>
      <NotificationTable initialNotifications={initialNotifications} />
    </section>
  )
}
