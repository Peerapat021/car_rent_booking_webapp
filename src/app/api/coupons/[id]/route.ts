

import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const couponId = Number(id);

    if (isNaN(couponId)) {
        return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        const [image] = await db
            .select({
                coupon_id: coupons.coupon_id,
                coupon_code: coupons.coupon_code,
                coupon_image: coupons.coupon_image,
                discount_type: coupons.discount_type,
                discount_value: coupons.discount_value,
                max_discount_amount: coupons.max_discount_amount,
                min_booking_amount: coupons.min_booking_amount,
                usage_limit: coupons.usage_limit,
                usage_limit_per_user: coupons.usage_limit_per_user,
                used_count: coupons.used_count,
                start_date: coupons.start_date,
                end_date: coupons.end_date,
                is_active: coupons.is_active,
            })
            .from(coupons)
            .where(eq(coupons.coupon_id, couponId))
            .limit(1);

        if (!image) {
            return new NextResponse("ไม่พบคูปอง", { status: 404 });
        }

        return NextResponse.json(image);
    } catch (error) {
        console.error("GET car-image error:", error);
        return new NextResponse("ดึงข้อมูลคูปองไม่สำเร็จ", { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const couponId = Number(id);
    if (!id || isNaN(couponId)) {
        return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    try {
        const [coupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.coupon_id, couponId));

        if (!coupon) {
            return NextResponse.json({ error: "ไม่พบคูปองนี้" }, { status: 404 });
        }

        // ลบรูปภาพถ้ามี
        if (coupon.coupon_image) {
            const imagePath = path.join(process.cwd(), "public", coupon.coupon_image);
            if (existsSync(imagePath)) {
                await unlink(imagePath).catch(() => { });
            }
        }

        // ลบข้อมูลจากฐานข้อมูล
        await db.delete(coupons).where(eq(coupons.coupon_id, couponId));

        return NextResponse.json(
            { message: "ลบคูปองเรียบร้อยแล้ว" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("DELETE /api/coupons/[id] error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลบคูปอง" },
            { status: 500 }
        );
    }
}