// app/api/[id]/promotions/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { promotions } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const promotionId = Number(id);

    if (isNaN(promotionId)) {
        return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        await requireAdmin();
        const [image] = await db
            .select({
                promo_id: promotions.promo_id,
                promo_code: promotions.promo_code,
                discount_type: promotions.discount_type,
                discount_value: promotions.discount_value,
                promo_start: promotions.promo_start,
                promo_end: promotions.promo_end,
                promo_status: promotions.promo_status,
                created_by: promotions.created_by,
                updated_by: promotions.updated_by,
                create_at_promotion: promotions.create_at_promotion,
            })
            .from(promotions)
            .where(eq(promotions.promo_id, promotionId))
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
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;


    const { id } = await params;
    if (!id || isNaN(Number(id))) {
        return new Response("Invalid id", { status: 400 });
    }

    try {
        await requireAdmin();
        const {
            promo_code,
            discount_type,
            discount_value,
            promo_start,
            promo_end,
            promo_status,
            updated_by: userId
        } = await req.json();

        // Check required fields
        if (!promo_code || !discount_type || !discount_value || !promo_start || !promo_end || !promo_status) {
            return new Response("Missing required fields", { status: 400 });
        }

        const updateData = {
            promo_code,
            discount_type,
            discount_value,
            promo_start: new Date(promo_start),
            promo_end: new Date(promo_end),
            promo_status,
            updated_by: userId,
        };

        const [result] = await db
            .update(promotions)
            .set(updateData)
            .where(eq(promotions.promo_id, Number(id)));

        if (result.affectedRows === 0) {
            return new Response("Promotion not found", { status: 404 });
        }

        return new Response(
            JSON.stringify({ message: "Promotion updated successfully" }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Update error:", error);
        return new Response("Error updating promotion", { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    if (!id || isNaN(Number(id))) {
        return new Response("Invalid id", { status: 400 });
    }

    try {
        await requireAdmin();
        const [result] = await db
            .delete(promotions)
            .where(eq(promotions.promo_id, Number(id)));

        if (result.affectedRows === 0) {
            return new Response("Promotion not found", { status: 404 });
        }

        return new Response(
            JSON.stringify({ message: "Promotion deleted successfully" }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Delete error:", error);
        return new Response("Error deleting promotion", { status: 500 });
    }
}