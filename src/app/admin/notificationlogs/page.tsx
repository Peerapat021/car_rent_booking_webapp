import NotificationTable from './NotificationLogsTable'
import { getNotificationLogs } from '@/lib/services/server/notificationLogs/get'

export default async function NotificationPage() {
  const notificationlogs = await getNotificationLogs();
  return (
    <section>
      <NotificationTable notificationlogs={notificationlogs} />
    </section>
  )
}
