// app/api/coupon-usages/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { couponUsages } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { notFound } from "next/navigation";


// ======================== GET: ดึงประวัติการใช้งานคูปอง ========================
export async function GET() {
    try {
        await requireAdmin();
        const allCouponUsages = await db.select().from(couponUsages);
        return NextResponse.json(allCouponUsages, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET /api/coupon-usages error:", error);
        return new NextResponse("ไม่สามารถโหลดประวัติการใช้งานคูปองได้", { status: 500 });
    }
}
