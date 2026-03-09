// app/api/cars/[id]/route.ts
import { db } from "@/lib/db";
import { cars, car_classes, carImages, booking_policies } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {

    try {
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

        console.error(`[API GET /cars] error:`, error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในระบบ" },
            { status: 500 }
        );
    }
}
