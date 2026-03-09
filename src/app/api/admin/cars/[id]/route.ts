// app/api/admin/cars/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { cars, car_classes, carImages, booking_policies } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { notFound } from "next/navigation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "car-images", "profile");

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {

    try {
        await requireAdmin();
        const { id } = await params;
        const carId = Number(id);

        if (isNaN(carId)) {
            return NextResponse.json(
                { success: false, message: "รหัสรถไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        console.log(`[API GET /cars/${carId}] กำลัง query car_id = ${carId}`);

        const carResults = await db
            .select({
                car_id: cars.car_id,
                car_brand: cars.car_brand,
                car_model: cars.car_model,
                car_year: cars.car_year,
                car_color: cars.car_color,
                car_license_plate: cars.car_license_plate,
                car_status: cars.car_status,
                car_mileage: cars.car_mileage,
                car_image_cover: cars.car_image_cover,
                branch_id: cars.branch_id,
                class_id: cars.class_id,
                class_name: car_classes.class_name,
                class_description: car_classes.class_description,
                car_vin: cars.car_vin,
                car_engine_number: cars.car_engine_number,
                fuel_type: cars.fuel_type,
                transmission: cars.transmission,
                door_count: cars.door_count,
                car_price_per_day: cars.car_price_per_day,
                car_deposit: cars.car_deposit,
                car_insurance_fee: cars.car_insurance_fee,
                seat_count: cars.seat_count,

                important_notes: booking_policies.important_notes,
                business_hours: booking_policies.business_hours,
                after_hours_service: booking_policies.after_hours_service,
                payment_policy: booking_policies.payment_policy,
                insurance_options: booking_policies.insurance_options,
                extra_equipment: booking_policies.extra_equipment,
                additional_information: booking_policies.additional_information,
            })
            .from(cars)
            .leftJoin(car_classes, eq(cars.class_id, car_classes.class_id))
            .leftJoin(booking_policies, eq(cars.car_id, booking_policies.car_id))
            .where(eq(cars.car_id, carId))
            .limit(1);

        if (carResults.length === 0) {
            return NextResponse.json(
                { success: false, message: "ไม่พบรถคันนี้" },
                { status: 404 }
            );
        }

        const car = carResults[0];

        // 🔍 Debug: ตรวจสอบว่ามี car_image_cover หรือไม่
        console.log(`[API GET /cars/${carId}] car_image_cover:`, car.car_image_cover);

        const images = await db
            .select()
            .from(carImages)
            .where(eq(carImages.car_id, carId))
            .orderBy(carImages.car_image_type, carImages.create_at_car_image);

        return NextResponse.json({
            success: true,
            car,
            images,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }

        console.error(`[API GET /cars] error:`, error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในระบบ" },
            { status: 500 }
        );
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
    const carId = Number(id);
    if (!id || isNaN(carId)) {
        return NextResponse.json({ error: "Invalid car ID" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        // ดึงข้อมูลรถเดิม
        const [existingCar] = await db
            .select()
            .from(cars)
            .where(eq(cars.car_id, carId));

        if (!existingCar) {
            return NextResponse.json({ error: "ไม่พบรถคันนี้" }, { status: 404 });
        }

        // รับค่าจาก FormData
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


        // Validation ครบถ้วนเหมือน POST
        if (
            !class_id ||
            !branch_id ||
            !car_brand ||
            !car_model ||
            !car_license_plate ||
            !car_year ||
            !car_color ||
            !car_status ||
            isNaN(car_year) ||
            isNaN(car_mileage) ||
            isNaN(seat_count) ||
            isNaN(door_count)
        ) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง" },
                { status: 400 }
            );
        }

        let car_image_cover = existingCar.car_image_cover;

        // ถ้ามีไฟล์ใหม่ → อัปโหลด + ลบของเก่า
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

            // ลบรูปเก่า
            if (existingCar.car_image_cover) {
                const oldPath = path.join(process.cwd(), "public", existingCar.car_image_cover);
                if (existsSync(oldPath)) await unlink(oldPath).catch(() => { });
            }

            car_image_cover = `/car-images/profile/${filename}`;
        }

        // อัปเดตฐานข้อมูล
        await db
            .update(cars)
            .set({
                class_id: Number(class_id),
                branch_id: Number(branch_id),
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
            })

            .where(eq(cars.car_id, carId));

        // ดึงข้อมูลล่าสุดกลับ
        const [updatedCar] = await db
            .select()
            .from(cars)
            .where(eq(cars.car_id, carId));

        return NextResponse.json(updatedCar, { status: 200 });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PUT /api/admin/cars/[id] error:", error);

        if (error.message?.includes("Duplicate entry")) {
            return NextResponse.json(
                { error: "ทะเบียนรถนี้มีในระบบแล้ว" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "ไม่สามารถอัปเดตข้อมูลรถได้", details: error.message },
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
    const carId = Number(id);
    if (!id || isNaN(carId)) {
        return NextResponse.json({ error: "Invalid car ID" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const [car] = await db.select().from(cars).where(eq(cars.car_id, carId));
        if (!car) {
            return NextResponse.json({ error: "ไม่พบรถคันนี้" }, { status: 404 });
        }

        // ลบรูปภาพ
        if (car.car_image_cover) {
            const imagePath = path.join(process.cwd(), "public", car.car_image_cover);
            if (existsSync(imagePath)) {
                await unlink(imagePath).catch(() => { });
            }
        }

        await db.delete(cars).where(eq(cars.car_id, carId));

        return NextResponse.json(
            { message: "ลบรถเรียบร้อยแล้ว" },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("DELETE /api/admin/cars/[id] error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลบรถ" },
            { status: 500 }
        );
    }
}