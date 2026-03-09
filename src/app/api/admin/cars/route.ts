// app/api/admin/cars/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { cars, booking_policies, promotionCars, promotions } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { notFound } from "next/navigation";

// โฟลเดอร์อัปโหลดรูปภาพรถ (จะถูกสร้างอัตโนมัติถ้ายังไม่มี)
const UPLOAD_DIR = path.join(process.cwd(), "public", "car-images", "profile");

export async function GET() {
    try {
        await requireAdmin();
        // ─────────────────────────────────────────────
        // 1️⃣ ดึงรถทั้งหมด
        // ─────────────────────────────────────────────
        const allCars = await db
            .select()
            .from(cars);

        if (allCars.length === 0) {
            return NextResponse.json([]);
        }

        // ─────────────────────────────────────────────
        // 2️⃣ ดึงโปรโมชั่นที่ active + ยังไม่หมดอายุ
        // ─────────────────────────────────────────────
        const activePromos = await db
            .select({
                car_id: promotionCars.car_id,
                promo_id: promotions.promo_id,
                promo_code: promotions.promo_code,
                discount_type: promotions.discount_type,
                discount_value: promotions.discount_value,
                promo_start: promotions.promo_start,
                promo_end: promotions.promo_end,
            })
            .from(promotionCars)
            .leftJoin(
                promotions,
                eq(promotionCars.promo_id, promotions.promo_id)
            )
            .where(sql`
                ${promotions.promo_status} = 'active'
                AND ${promotions.promo_end} >= CURRENT_DATE()
                AND ${promotions.promo_start} <= DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)
            `);

        // ─────────────────────────────────────────────
        // 3️⃣ จัดกลุ่มโปรโมชั่นตาม car_id
        // ─────────────────────────────────────────────
        const promoMap: Record<number, any[]> = {};

        for (const promo of activePromos) {
            if (!promoMap[promo.car_id]) {
                promoMap[promo.car_id] = [];
            }

            promoMap[promo.car_id].push({
                promo_id: promo.promo_id,
                promo_code: promo.promo_code,
                discount_type: promo.discount_type,
                discount_value: promo.discount_value,
                promo_start: promo.promo_start instanceof Date
                    ? promo.promo_start.toISOString()
                    : String(promo.promo_start),
                promo_end: promo.promo_end instanceof Date
                    ? promo.promo_end.toISOString()
                    : String(promo.promo_end),
            });
        }

        // ─────────────────────────────────────────────
        // 4️⃣ รวม promotions เข้าแต่ละรถ
        // ─────────────────────────────────────────────
        const formatted = allCars.map((car) => ({
            ...car,
            promotions: (promoMap[car.car_id] || []).map(p => ({
                promo_id: p.promo_id,
                promo_code: p.promo_code,
                discount_type: p.discount_type,
                discount_value: Number(p.discount_value) || 0,  // แปลงเป็น number ทันที
                promo_start: p.promo_start ?? null,
                promo_end: p.promo_end ?? null,     // ส่งเป็น YYYY-MM-DD
            })),
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET /api/admin/cars error:", error);
        return new NextResponse("ไม่สามารถโหลดข้อมูลรถได้", { status: 500 });
    }
}

// ======================== GET: ดึงข้อมูลรถทั้งหมด ========================
export async function getAvailableCars(params: {
    class_id: number;
    branch_id?: number;
    start_date: string;
    end_date: string;
}) {
    await requireAdmin();
    const query = new URLSearchParams({
        class_id: params.class_id.toString(),
        start_date: params.start_date,
        end_date: params.end_date,
    });

    if (params.branch_id !== undefined) {
        query.append('branch_id', params.branch_id.toString());
    }

    if (params.start_date === undefined || params.end_date === undefined) {
        throw new Error('ไม่สามารถดึงรถที่ว่างได้');
    }

    const response = await fetch(`/api/admin/cars/available?${query.toString()}`);
    if (!response.ok) throw new Error('ไม่สามารถดึงรถที่ว่างได้');
    return response.json();
}

// ======================== POST: เพิ่มรถใหม่ ========================
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
        const file = formData.get("file") as File | null;

        // ดึงข้อมูลจาก FormData (ทุก field ต้องส่งมา)
        const class_id = (formData.get("class_id") as string)?.trim();
        const branch_id = (formData.get("branch_id") as string)?.trim();
        const car_brand = (formData.get("car_brand") as string)?.trim();
        const car_model = (formData.get("car_model") as string)?.trim();
        const car_license_plate = (formData.get("car_license_plate") as string)?.trim();
        const car_year = Number(formData.get("car_year"));
        const car_color = (formData.get("car_color") as string)?.trim();
        const car_status = (formData.get("car_status") as string)?.trim() || "available";
        const car_mileage = Number(formData.get("car_mileage"));
        const car_vin = (formData.get("car_vin") as string)?.trim();
        const car_engine_number = (formData.get("car_engine_number") as string)?.trim();
        const fuel_type = (formData.get("fuel_type") as string)?.trim();
        const transmission = (formData.get("transmission") as string)?.trim();
        const seat_count = Number(formData.get("seat_count"));
        const door_count = Number(formData.get("door_count"));
        const car_price_per_day = Number(formData.get("car_price_per_day"));
        const car_deposit = Number(formData.get("car_deposit"));
        const car_insurance_fee = Number(formData.get("car_insurance_fee"));


        // booking policies
        const important_notes_raw = formData.get("important_notes") as string;
        const business_hours = (formData.get("business_hours") as string)?.trim();
        const after_hours_service = (formData.get("after_hours_service") as string)?.trim();
        const payment_policy = (formData.get("payment_policy") as string)?.trim();
        const insurance_options = (formData.get("insurance_options") as string)?.trim();
        const extra_equipment = (formData.get("extra_equipment") as string)?.trim();
        const additional_information = (formData.get("additional_information") as string)?.trim();



        // ผู้สร้าง (ต้องเป็น number)
        const car_created_by = Number(session.user.id);

        // === Validation ครบถ้วน ===
        if (
            !class_id ||
            !branch_id ||
            !car_brand ||
            !car_model ||
            !car_license_plate ||
            !car_year ||
            !car_color ||
            !car_price_per_day ||
            !car_deposit ||
            !car_insurance_fee ||
            isNaN(car_year) ||
            isNaN(car_mileage) ||
            isNaN(car_created_by) ||
            !file
        ) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง" },
                { status: 400 }
            );
        }

        if (
            !fuel_type ||
            !transmission ||
            isNaN(seat_count) ||
            isNaN(door_count)
        ) {
            return NextResponse.json(
                { error: "ข้อมูลสเปครถไม่ครบถ้วน" },
                { status: 400 }
            );
        }

        // ตรวจสอบไฟล์
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: "กรุณาอัปโหลดรูปภาพรถ" }, { status: 400 });
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

        // บันทึกรูปภาพ
        const ext = path.extname(file.name).toLowerCase() || ".jpg";
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filepath, buffer);

        const car_image_cover = `/car-images/profile/${filename}`;

        // === เพิ่มข้อมูลรถลงฐานข้อมูล ===
        const result = await db
            .insert(cars)
            .values({
                class_id: Number(class_id),
                car_brand,
                car_model,
                car_license_plate,
                car_year,
                car_color,
                car_status: car_status as any,
                car_mileage,

                car_vin,
                car_engine_number,
                fuel_type: fuel_type as any,
                transmission: transmission as any,
                seat_count,
                door_count,

                car_price_per_day: String(car_price_per_day),
                car_deposit: String(car_deposit) || '0.00',
                car_insurance_fee: String(car_insurance_fee) || '0.00',

                car_image_cover,
                branch_id: Number(branch_id),
                car_created_by,
                create_at_car: new Date(),
            })
            .$returningId();

        const newCarId = result[0].car_id;

        let important_notes: string[] = [];

        try {
            important_notes = JSON.parse(important_notes_raw || "[]");
        } catch {
            important_notes = [];
        }

        await db.insert(booking_policies).values({
            car_id: newCarId,
            important_notes,
            business_hours,
            after_hours_service,
            payment_policy,
            insurance_options,
            extra_equipment,
            additional_information,
        });

        // ดึงข้อมูลรถที่เพิ่งเพิ่มกลับมา 
        const [newCar] = await db
            .select()
            .from(cars)
            .where(eq(cars.car_id, newCarId));

        return NextResponse.json(newCar, { status: 201 });

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("POST /api/admin/cars error:", error);

        // ตรวจสอบทะเบียนซ้ำ
        if (error.message?.includes("Duplicate entry")) {
            return NextResponse.json(
                { error: "ทะเบียนรถนี้มีในระบบแล้ว" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "ไม่สามารถเพิ่มรถได้", details: error.message },
            { status: 500 }
        );
    }
}