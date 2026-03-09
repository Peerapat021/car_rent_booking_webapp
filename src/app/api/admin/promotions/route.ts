// app/api/promotions/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { promotions } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET() {
    try {
        await requireAdmin();
        const allPromotions = await db.select().from(promotions).orderBy(desc(promotions.promo_id));

        return Response.json(allPromotions);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get promotions error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลได้", { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
    }

    const userId = Number(session.user.id);
    const body = await request.json();

    const {
        promo_code,
        discount_type,
        discount_value,
        promo_start,
        promo_end,
        promo_status = "active",
    } = body;

    // Validation
    const requiredFields = [
        "promo_code",
        "discount_type",
        "discount_value",
        "promo_start",
        "promo_end",
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
        return new Response(
            `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(", ")}`,
            { status: 400 }
        );
    }

    if (!["percent", "fixed"].includes(discount_type)) {
        return new Response("ประเภทส่วนลดไม่ถูกต้อง", { status: 400 });
    }

    if (!["active", "inactive"].includes(promo_status)) {
        return new Response("สถานะโปรโมชั่นไม่ถูกต้อง", { status: 400 });
    }

    try {
        await requireAdmin();
        const [inserted] = await db
            .insert(promotions)
            .values({
                promo_code,
                discount_type,
                discount_value: discount_value.toString(),
                promo_start: new Date(promo_start),
                promo_end: new Date(promo_end),
                promo_status,
                created_by: userId,
                updated_by: userId,
            })
            .$returningId();

        const [newPromotion] = await db
            .select()
            .from(promotions)
            .where(eq(promotions.promo_id, inserted.promo_id));

        return Response.json(newPromotion, { status: 201 });

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Post promotions error:", error);

        if (
            error.code === "ER_DUP_ENTRY" ||
            error.message?.includes("Duplicate entry")
        ) {
            return new Response("รหัสโปรโมชั่นนี้มีอยู่แล้ว", { status: 409 });
        }

        return new Response(
            "ไม่สามารถสร้างโปรโมชั่นได้: " + (error.message || "เกิดข้อผิดพลาด"),
            { status: 500 }
        );
    }
}
