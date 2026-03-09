// src/app/api/maintenance/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { maintenance } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const car_id = searchParams.get('car_id');

    let where = {};
    if (car_id) {
        where = { car_id: Number(car_id) };
    }

    try {
        await requireAdmin();
        const images = await db.select().from(maintenance).where(eq(maintenance.car_id, Number(car_id)));
        return NextResponse.json(images);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// app/api/maintenance/route.ts  (สำหรับ POST)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });
    if (session.user?.role !== "admin") return new Response("Forbidden", { status: 403 });

    try {
        await requireAdmin();
        const formData = await request.formData();

        const car_id          = formData.get('car_id');
        const maintenance_detail = formData.get('maintenance_detail');
        const maintenance_cost   = formData.get('maintenance_cost');
        const maintenance_date   = formData.get('maintenance_date');
        const recorded_by        = formData.get('recorded_by');

        if (!car_id || !maintenance_detail || !maintenance_cost || !maintenance_date || !recorded_by) {
            return new Response("ข้อมูลไม่ครบถ้วน", { status: 400 });
        }

        const [newRecord] = await db.insert(maintenance).values({
            car_id: Number(car_id),
            maintenance_detail: String(maintenance_detail),
            maintenance_cost: String(maintenance_cost),
            maintenance_date: new Date(String(maintenance_date)),
            recorded_by: Number(recorded_by),
            created_at_maintenance: new Date(),
        }).$returningId();

        return Response.json({ record: newRecord }, { status: 201 });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("POST maintenance error:", error);
        return new Response("เกิดข้อผิดพลาดในการเพิ่มข้อมูล", { status: 500 });
    }
}