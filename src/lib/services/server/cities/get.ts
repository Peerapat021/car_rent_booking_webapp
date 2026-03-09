import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema";

export async function getCities() {
    return await db.select().from(cities);
}
