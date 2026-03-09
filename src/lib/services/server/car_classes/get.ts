import { db } from "@/lib/db";
import { car_classes } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";

export async function getClassesServer() {
    await requireAdmin();

    const allCarClasses = await db.select().from(car_classes);

    return allCarClasses;
}