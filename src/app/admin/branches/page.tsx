import BranchesTable from './BranchesTable'
import { getBranchesServer } from '@/lib/services/server/branches/get'

export default async function BranchesPage() {
  const branches = await getBranchesServer();
  return (
    <section>
      <BranchesTable branches={branches} />
    </section>
  )
}
