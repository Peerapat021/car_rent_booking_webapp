// app/api/favorites/route.ts
import { db } from "@/lib/db";
import { favorites, cars } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { eq, and, desc } from "drizzle-orm";
import { NextRequest } from "next/server";

// ===============================
// Helper: ตรวจสอบ car_id
// ===============================
function validateCarId(car_id: any) {
    const parsed = Number(car_id);
    if (!parsed || isNaN(parsed)) return null;
    return parsed;
}

// ===============================
// GET - ดูรายการโปรดของตัวเอง
// ===============================
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    try {
        const myFavorites = await db
            .select({
                favorite_id: favorites.favorite_id,
                created_at: favorites.created_at,
                car_id: cars.car_id,
                car_brand: cars.car_brand,
                car_model: cars.car_model,
                car_color: cars.car_color,
                car_image_cover: cars.car_image_cover,
                transmission: cars.transmission,
            })
            .from(favorites)
            .innerJoin(cars, eq(favorites.car_id, cars.car_id))
            .where(eq(favorites.user_id, userId))
            .orderBy(desc(favorites.created_at));

        return Response.json({
            success: true,
            data: myFavorites,
        });

    } catch (error) {
        console.error("GET favorites error:", error);
        return Response.json(
            { success: false, message: "โหลดรายการโปรดไม่สำเร็จ" },
            { status: 500 }
        );
    }
}

// ===============================
// POST - เพิ่มรายการโปรด
// ===============================
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await request.json();
    const parsedCarId = validateCarId(body.car_id);

    if (!parsedCarId) {
        return Response.json(
            { success: false, message: "car_id ไม่ถูกต้อง" },
            { status: 400 }
        );
    }

    try {
        // เช็คว่ารถมีอยู่จริงไหม
        const carExists = await db
            .select({ id: cars.car_id })
            .from(cars)
            .where(eq(cars.car_id, parsedCarId))
            .limit(1);

        if (!carExists.length) {
            return Response.json(
                { success: false, message: "ไม่พบรถคันนี้" },
                { status: 404 }
            );
        }

        const [inserted] = await db
            .insert(favorites)
            .values({
                user_id: userId,
                car_id: parsedCarId,
            })
            .$returningId();

        return Response.json(
            {
                success: true,
                favorite_id: inserted.favorite_id,
            },
            { status: 201 }
        );

    } catch (error: any) {

        if (error.code === "ER_DUP_ENTRY") {
            return Response.json(
                { success: false, message: "รถคันนี้อยู่ในรายการโปรดแล้ว" },
                { status: 400 }
            );
        }

        console.error("POST favorite error:", error);
        return Response.json(
            { success: false, message: "ไม่สามารถเพิ่มรายการโปรดได้" },
            { status: 500 }
        );
    }
}

// ===============================
// DELETE - ลบรายการโปรด
// ===============================
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await request.json();
    const parsedCarId = validateCarId(body.car_id);

    if (!parsedCarId) {
        return Response.json(
            { success: false, message: "car_id ไม่ถูกต้อง" },
            { status: 400 }
        );
    }

    try {
        const existing = await db
            .select({ id: favorites.favorite_id })
            .from(favorites)
            .where(
                and(
                    eq(favorites.user_id, userId),
                    eq(favorites.car_id, parsedCarId)
                )
            )
            .limit(1);

        if (!existing.length) {
            return Response.json(
                { success: false, message: "ไม่พบรายการโปรดนี้" },
                { status: 404 }
            );
        }

        // ลบ
        await db
            .delete(favorites)
            .where(
                and(
                    eq(favorites.user_id, userId),
                    eq(favorites.car_id, parsedCarId)
                )
            );

        return Response.json({
            success: true,
            message: "ลบรายการโปรดเรียบร้อยแล้ว",
        });

    } catch (error) {
        console.error("DELETE favorite error:", error);
        return Response.json(
            { success: false, message: "ลบรายการโปรดไม่สำเร็จ" },
            { status: 500 }
        );
    }
}