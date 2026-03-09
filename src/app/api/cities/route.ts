import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
    try {
        const allCities = await db.select().from(cities).orderBy(desc(cities.city_id));

        return Response.json(allCities);
    } catch (error) {
        console.error("Get cities error:", error);
        return new Response("ไม่สามารถโหลดข้อมูล cities ได้", { status: 500 });
    }
}

