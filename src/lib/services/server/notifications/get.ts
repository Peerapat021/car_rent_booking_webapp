import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

export async function getNotifications() {
    return await db.select().from(notifications);
}
