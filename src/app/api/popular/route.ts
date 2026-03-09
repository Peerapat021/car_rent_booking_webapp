import { db } from "@/lib/db";
import { bookings, cars, branches } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
    try {
        // นับจำนวนการจองต่อ car_id
        const bookingCounts = await db
            .select({
                car_id: bookings.car_id,
                booking_count: sql<number>`COUNT(*)`.as("booking_count"),
            })
            .from(bookings)
            .groupBy(bookings.car_id)
            .orderBy(sql`COUNT(*) DESC`)
            .limit(10);

        // ดึงข้อมูลรถและสาขาสำหรับรถที่ติด popular
        const carIds = bookingCounts
            .map((b) => b.car_id)
            .filter((id): id is number => id !== null);

        if (carIds.length === 0) {
            return Response.json([]);
        }

        const allCars = await db.select().from(cars);
        const allBranches = await db.select().from(branches);

        const result = bookingCounts
            .map((bc) => {
                const car = allCars.find((c) => c.car_id === bc.car_id);
                if (!car) return null;

                const branch = allBranches.find((br) => br.branch_id === car.branch_id);

                return {
                    car_id: car.car_id,
                    car_brand: car.car_brand,
                    car_model: car.car_model,
                    car_image_cover: car.car_image_cover,
                    seat_count: car.seat_count,
                    fuel_type: car.fuel_type,
                    transmission: car.transmission,
                    branch_name: branch?.branch_name || "ไม่ระบุสาขา",
                    booking_count: bc.booking_count,
                };
            })
            .filter(Boolean);

        return Response.json(result);
    } catch (error) {
        console.error("Get popular cars error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลรถยอดนิยมได้", { status: 500 });
    }
}
