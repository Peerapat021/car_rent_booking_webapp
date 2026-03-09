import { db } from "@/lib/db";
import { company } from "@/lib/db/schema";

export async function getCompany() {
    return await db.select().from(company);
}
