import { db } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function getNotificationLogs() {
    return await db.select().from(notificationLogs).orderBy(desc(notificationLogs.notif_id));
}
