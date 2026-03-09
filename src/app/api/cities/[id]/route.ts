import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema"; // สมมติว่าชื่อตารางใน schema คือ cities
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// ────────────────────────────────────────────────
// GET → ดึงข้อมูลเมืองเดี่ยว
// ────────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cityId = Number(id);

    if (isNaN(cityId)) {
        return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        const [city] = await db
            .select({
                city_id: cities.city_id,
                city_name: cities.city_name,
                city_code: cities.city_code,
                city_postal_code: cities.city_postal_code,
                city_status: cities.city_status,
                created_at: cities.created_at,
            })
            .from(cities)
            .where(eq(cities.city_id, cityId))
            .limit(1);

        if (!city) {
            return NextResponse.json({ error: "ไม่พบเมืองนี้" }, { status: 404 });
        }

        return NextResponse.json(city);
    } catch (error) {
        console.error("GET /api/cities/[id] error:", error);
        return NextResponse.json(
            { error: "ดึงข้อมูลเมืองไม่สำเร็จ" },
            { status: 500 }
        );
    }
}
