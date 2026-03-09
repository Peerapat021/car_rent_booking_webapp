// app/api/coupons/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { notFound } from "next/navigation";

// โฟลเดอร์อัปโหลดรูปภาพคูปอง
const UPLOAD_DIR = path.join(process.cwd(), "public", "coupon-images");

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
        await requireAdmin();
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
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET car-image error:", error);
        return new NextResponse("ดึงข้อมูลคูปองไม่สำเร็จ", { status: 500 });
    }
}

export async function PUT(
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
        await requireAdmin();
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        // ดึงข้อมูลคูปองเดิม
        const [existingCoupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.coupon_id, couponId));

        if (!existingCoupon) {
            return NextResponse.json({ error: "ไม่พบคูปองนี้" }, { status: 404 });
        }

        // รับค่าจาก FormData
        const coupon_code = (formData.get("coupon_code") as string)?.trim().toUpperCase();
        const discount_type = (formData.get("discount_type") as string)?.trim();
        const discount_value = Number(formData.get("discount_value"));
        const max_discount_amount = formData.get("max_discount_amount")
            ? Number(formData.get("max_discount_amount"))
            : null;
        const min_booking_amount = formData.get("min_booking_amount")
            ? Number(formData.get("min_booking_amount"))
            : null;
        const usage_limit = formData.get("usage_limit")
            ? Number(formData.get("usage_limit"))
            : null;
        const usage_limit_per_user = formData.get("usage_limit_per_user")
            ? Number(formData.get("usage_limit_per_user"))
            : null;
        const start_date = formData.get("start_date") as string | null;
        const end_date = formData.get("end_date") as string | null;
        const is_active = formData.get("is_active") === "true" || formData.get("is_active") === "on";

        // === Validation ===
        if (
            !coupon_code ||
            !discount_type ||
            isNaN(discount_value) ||
            discount_value <= 0
        ) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง" },
                { status: 400 }
            );
        }

        if (!["percent", "fixed"].includes(discount_type)) {
            return NextResponse.json(
                { error: "discount_type ต้องเป็น 'percent' หรือ 'fixed' เท่านั้น" },
                { status: 400 }
            );
        }

        if (discount_type === "percent" && (discount_value < 0 || discount_value > 100)) {
            return NextResponse.json(
                { error: "ส่วนลดแบบเปอร์เซ็นต์ต้องอยู่ระหว่าง 0-100" },
                { status: 400 }
            );
        }

        if (max_discount_amount !== null && (isNaN(max_discount_amount) || max_discount_amount < 0)) {
            return NextResponse.json({ error: "ส่วนลดสูงสุดต้องไม่ติดลบ" }, { status: 400 });
        }

        if (min_booking_amount !== null && (isNaN(min_booking_amount) || min_booking_amount < 0)) {
            return NextResponse.json({ error: "ยอดจองขั้นต่ำต้องไม่ติดลบ" }, { status: 400 });
        }

        if (usage_limit !== null && (isNaN(usage_limit) || usage_limit < 0)) {
            return NextResponse.json({ error: "จำนวนครั้งที่ใช้ได้ต้องไม่ติดลบ" }, { status: 400 });
        }

        if (usage_limit_per_user !== null && (isNaN(usage_limit_per_user) || usage_limit_per_user < 0)) {
            return NextResponse.json({ error: "จำกัดต่อคน" }, { status: 400 });
        }

        let coupon_image = existingCoupon.coupon_image;

        // ถ้ามีไฟล์รูปใหม่ → อัปโหลด + ลบของเก่า
        if (file && file instanceof File && file.size > 0) {
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "รูปภาพต้องไม่เกิน 5MB" }, { status: 400 });
            }

            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF" },
                    { status: 400 }
                );
            }

            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const ext = path.extname(file.name).toLowerCase() || ".jpg";
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filepath, buffer);

            // ลบรูปเก่า (ถ้ามี)
            if (existingCoupon.coupon_image) {
                const oldPath = path.join(process.cwd(), "public", existingCoupon.coupon_image);
                if (existsSync(oldPath)) {
                    await unlink(oldPath).catch(() => { });
                }
            }

            coupon_image = `/coupon-images/${filename}`;
        }

        // อัปเดตฐานข้อมูล
        await db
            .update(coupons)
            .set({
                coupon_code,
                coupon_image,
                discount_type: discount_type as "percent" | "fixed",
                discount_value: discount_value.toString(),
                max_discount_amount: max_discount_amount !== null ? max_discount_amount.toString() : null,
                min_booking_amount: min_booking_amount !== null ? min_booking_amount.toString() : null,
                usage_limit,
                usage_limit_per_user,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                is_active,
            })
            .where(eq(coupons.coupon_id, couponId));

        // ดึงข้อมูลที่อัปเดตแล้วกลับมา
        const [updatedCoupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.coupon_id, couponId));

        return NextResponse.json(updatedCoupon, { status: 200 });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PUT /api/coupons/[id] error:", error);

        if (error.message?.includes("Duplicate entry") || error.constraint === "Coupons_coupon_code_unique") {
            return NextResponse.json(
                { error: "รหัสคูปองนี้มีในระบบแล้ว" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "ไม่สามารถอัปเดตคูปองได้", details: error.message },
            { status: 500 }
        );
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
        await requireAdmin();
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
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("DELETE /api/coupons/[id] error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลบคูปอง" },
            { status: 500 }
        );
    }
}