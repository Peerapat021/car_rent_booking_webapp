// app/api/coupons/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { notFound } from "next/navigation";

// โฟลเดอร์อัปโหลดรูปภาพคูปอง (จะถูกสร้างอัตโนมัติถ้ายังไม่มี)
const UPLOAD_DIR = path.join(process.cwd(), "public", "coupon-images");

// ======================== GET: ดึงข้อมูลคูปองทั้งหมด ========================
export async function GET() {
    try {
        await requireAdmin();
        const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.coupon_id));
        return NextResponse.json(allCoupons, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET /api/coupons error:", error);
        return new NextResponse("ไม่สามารถโหลดข้อมูลคูปองได้", { status: 500 });
    }
}

// ======================== POST: เพิ่มคูปองใหม่ ========================
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    // ตรวจสอบการล็อกอิน
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์ admin
    if (session.user?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden – Admin Only" }, { status: 403 });
    }

    try {
        await requireAdmin();
        const formData = await request.formData();
        const file = formData.get("file") as File | null; // รูปภาพคูปอง (optional)

        // ดึงข้อมูลจาก FormData
        const coupon_code = (formData.get("coupon_code") as string)?.trim().toUpperCase();
        const discount_type = (formData.get("discount_type") as string)?.trim();
        const discount_value = Number(formData.get("discount_value"));
        const max_discount_amount = formData.get("max_discount_amount") ? Number(formData.get("max_discount_amount")) : null;
        const min_booking_amount = formData.get("min_booking_amount") ? Number(formData.get("min_booking_amount")) : null;
        const usage_limit = formData.get("usage_limit") ? Number(formData.get("usage_limit")) : null;
        const usage_limit_per_user = formData.get("usage_limit_per_user") ? Number(formData.get("usage_limit_per_user")) : null;
        const start_date = formData.get("start_date") as string | null;
        const end_date = formData.get("end_date") as string | null;
        const is_active = formData.get("is_active") === "true" ? true : false;

        // ผู้สร้าง
        const created_by = Number(session.user.id);

        // === Validation ครบถ้วน ===
        if (
            !coupon_code ||
            !discount_type ||
            isNaN(discount_value) ||
            isNaN(created_by) ||
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
            return NextResponse.json(
                { error: "max_discount_amount ต้องเป็นตัวเลขไม่ติดลบ" },
                { status: 400 }
            );
        }

        if (min_booking_amount !== null && (isNaN(min_booking_amount) || min_booking_amount < 0)) {
            return NextResponse.json(
                { error: "min_booking_amount ต้องเป็นตัวเลขไม่ติดลบ" },
                { status: 400 }
            );
        }

        if (usage_limit !== null && (isNaN(usage_limit) || usage_limit < 0)) {
            return NextResponse.json(
                { error: "usage_limit ต้องเป็นตัวเลขไม่ติดลบ" },
                { status: 400 }
            );
        }

        if (usage_limit_per_user !== null && (isNaN(usage_limit_per_user) || usage_limit_per_user < 0)) {
            return NextResponse.json(
                { error: "usage_limit_per_user ต้องเป็นตัวเลขไม่ติดลบ" },
                { status: 400 }
            );
        }

        // จัดการรูปภาพ (optional)
        let coupon_image: string | null = null;
        if (file) {
            if (!(file instanceof File) || file.size === 0) {
                return NextResponse.json({ error: "ไฟล์รูปภาพไม่ถูกต้อง" }, { status: 400 });
            }

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

            // สร้างโฟลเดอร์ถ้ายังไม่มี
            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const ext = path.extname(file.name).toLowerCase() || ".jpg";
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filepath, buffer);

            coupon_image = `/coupon-images/${filename}`;
        }

        // === เพิ่มข้อมูลคูปองลงฐานข้อมูล ===
        const result = await db
            .insert(coupons)
            .values({
                coupon_code,
                coupon_image,
                discount_type: discount_type as "percent" | "fixed",
                discount_value: discount_value.toString(),
                max_discount_amount: max_discount_amount ? max_discount_amount.toString() : null,
                min_booking_amount: min_booking_amount ? min_booking_amount.toString() : null,
                usage_limit,
                usage_limit_per_user,
                used_count: 0,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                is_active,
                created_by,
                created_at: new Date(),
            })
            .$returningId();

        const newCouponId = result[0].coupon_id;

        // ดึงข้อมูลคูปองที่เพิ่งเพิ่มกลับมา
        const [newCoupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.coupon_id, newCouponId));

        return NextResponse.json(newCoupon, { status: 201 });

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("POST /api/coupons error:", error);

        // ตรวจสอบ coupon_code ซ้ำ (unique constraint)
        if (error.message?.includes("Duplicate entry") || error.constraint === "Coupons_coupon_code_unique") {
            return NextResponse.json(
                { error: "รหัสคูปองนี้มีในระบบแล้ว" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "ไม่สามารถเพิ่มคูปองได้", details: error.message },
            { status: 500 }
        );
    }
}