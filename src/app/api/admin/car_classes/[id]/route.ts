// app/api/users/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { car_classes } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const classId = Number(id);

    if (isNaN(classId)) {
        return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const [cls] = await db
            .select()
            .from(car_classes)
            .where(eq(car_classes.class_id, classId));

        if (!cls) {
            return NextResponse.json({ error: "ไม่พบประเภทรถ" }, { status: 404 });
        }

        return NextResponse.json(cls);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Error fetching car class:", error);
        return NextResponse.json(
            { error: "ไม่สามารถโหลดข้อมูลได้" },
            { status: 500 }
        );
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

    const { id } = await params;
    if (!id || isNaN(Number(id))) {
        return new Response("Invalid id", { status: 400 });
    }

    try {
        await requireAdmin();
        const { class_code, class_name, class_description, sort_order, is_active } = await req.json();

        // เตรียมข้อมูลสำหรับ update
        const updateData: any = {
            class_code,
            class_name,
            class_description,
            sort_order,
            is_active
        };

        const [result] = await db.update(car_classes)
            .set(updateData)
            .where(eq(car_classes.class_id, Number(id)));

        if (result.affectedRows === 0) {
            return new Response("car_classes not found", { status: 404 });
        }

        return new Response(JSON.stringify({ message: "car_classes updated successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Update error:", error);
        return new Response("Error updating car_classes", { status: 500 });
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
        const [result] = await db.delete(car_classes)
            .where(eq(car_classes.class_id, Number(id)));

        if (result.affectedRows === 0) {
            return new Response("car_classes not found", { status: 404 });
        }

        return new Response(JSON.stringify({ message: "car_classes deleted successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Delete error:", error);
        return new Response("Error deleting car_classes", { status: 500 });
    }
}