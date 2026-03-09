
import Team_members from './Team_MemberTable'
import { getEmployeeServer } from '@/lib/services/server/users/getEmployee'

export default async function TeamMemberpage() {
  const users = await getEmployeeServer();
  return (
    <section>
      <Team_members users={users} />
    </section>
  )
}
