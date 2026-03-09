import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";

export async function getBranchesServer() {
    await requireAdmin();

    const allBranches = await db.select().from(branches);

    return allBranches;
}