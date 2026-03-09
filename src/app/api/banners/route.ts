import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// ========================
// GET (ดูทั้งหมด)
// ========================
export async function GET() {
    try {
        const data = await db
            .select()
            .from(banners)
            .orderBy(desc(banners.banner_order), desc(banners.banner_id));

        return NextResponse.json(data);
    } catch (error) {
        console.error("GET /api/banners error:", error);
        return NextResponse.json(
            { error: "ไม่สามารถโหลดข้อมูล banners ได้" },
            { status: 500 }
        );
    }
}
