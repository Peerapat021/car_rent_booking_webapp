import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";

export async function getActivities() {
    return await db.select().from(activities);
}
