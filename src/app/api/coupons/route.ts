
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

// ======================== GET: ดึงข้อมูลคูปองทั้งหมด ========================
export async function GET() {
    try {
        const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.coupon_id));
        return NextResponse.json(allCoupons, { status: 200 });
    } catch (error) {
        console.error("GET /api/coupons error:", error);
        return new NextResponse("ไม่สามารถโหลดข้อมูลคูปองได้", { status: 500 });
    }
}