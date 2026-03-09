// src/app/api/admin/cars/available/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { cars, car_classes, bookings } from "@/lib/db/schema";
import { eq, and, notInArray, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

export async function GET(request: Request) {
    
    const { searchParams } = new URL(request.url);

    const class_id = searchParams.get("class_id");
    const branch_id = searchParams.get("branch_id");
    const start_date_str = searchParams.get("start_date");
    const end_date_str = searchParams.get("end_date");

    if (!start_date_str || !end_date_str) {
        return NextResponse.json(
            { error: "ต้องระบุ start_date และ end_date" },
            { status: 400 }
        );
    }

    // ✅ แปลง string → Date
    const startDate = new Date(start_date_str);
    const endDate = new Date(end_date_str);

    // ✅ ตรวจสอบวันที่ valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
            { error: "รูปแบบวันที่ไม่ถูกต้อง" },
            { status: 400 }
        );
    }

    try {
        await requireAdmin();
        const bookedCarIdsSubquery = db
            .select({ car_id: bookings.car_id })
            .from(bookings)
            .where(
                and(
                    lte(bookings.booking_start_date, endDate),
                    gte(bookings.booking_end_date, startDate),
                    notInArray(bookings.booking_status, [
                        "cancelled",
                        "completed",
                        "returned",
                    ])
                )
            );

        const availableCars = await db
            .select({
                car_id: cars.car_id,
                branch_id: cars.branch_id,
                car_brand: cars.car_brand,
                car_model: cars.car_model,
                car_license_plate: cars.car_license_plate,
                car_year: cars.car_year,
                car_color: cars.car_color,
                car_price_per_day: cars.car_price_per_day,
                car_image_cover: cars.car_image_cover,
                class_name: car_classes.class_name,
                car_deposit: cars.car_deposit,
                car_insurance_fee: cars.car_insurance_fee,
            })
            .from(cars)
            .innerJoin(
                car_classes,
                eq(cars.class_id, car_classes.class_id)
            )
            .where(
                and(
                    eq(cars.car_status, "available"),
                    class_id
                        ? eq(cars.class_id, Number(class_id))
                        : undefined,
                    branch_id
                        ? eq(cars.branch_id, Number(branch_id))
                        : undefined,
                    notInArray(cars.car_id, bookedCarIdsSubquery)
                )
            )
            .orderBy(cars.car_brand, cars.car_model);

        return NextResponse.json(availableCars);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Error fetching available cars:", error);
        return NextResponse.json(
            { error: "ไม่สามารถโหลดรถว่างได้" },
            { status: 500 }
        );
    }
}
