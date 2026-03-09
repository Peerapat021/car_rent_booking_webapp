// app/api/cities/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET() {
    try {
        await requireAdmin();
        const allCities = await db.select().from(cities).orderBy(desc(cities.city_id));

        return Response.json(allCities);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get cities error:", error);
        return new Response("ไม่สามารถโหลดข้อมูล cities ได้", { status: 500 });
    }
}

