
import UserTable from './UserTable'
import { getUsersServer } from '@/lib/services/server/users/get'

export default async function UserPage() {
  const users = await getUsersServer();
  return (
    <section>
      <UserTable users={users} />
    </section>
  )
}
