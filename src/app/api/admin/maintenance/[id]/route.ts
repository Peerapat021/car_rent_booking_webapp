// src/app/api/maintenance/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { maintenance, cars } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, ne, sql } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const maintenanceId = Number(id);
    if (isNaN(maintenanceId)) {
        return new Response("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        await requireAdmin();
        const [record] = await db
            .select({
                maintenance_id: maintenance.maintenance_id,
                car_id: maintenance.car_id,
                maintenance_detail: maintenance.maintenance_detail,
                maintenance_cost: maintenance.maintenance_cost,
                maintenance_date: maintenance.maintenance_date,
                recorded_by: maintenance.recorded_by,
                created_at_maintenance: maintenance.created_at_maintenance,
            })
            .from(maintenance)
            .where(eq(maintenance.maintenance_id, maintenanceId))
            .limit(1);

        if (!record) {
            return new Response("ไม่พบรายการซ่อมบำรุง", { status: 404 });
        }

        return NextResponse.json(record);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET maintenance error:", error);
        return new Response("ดึงข้อมูลไม่สำเร็จ", { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new Response("Unauthorized", { status: 401 });
    if (session.user.role !== "admin") return new Response("Forbidden", { status: 403 });

    const { id } = await params;
    const maintenanceId = Number(id);
    if (isNaN(maintenanceId)) return new Response("ID ไม่ถูกต้อง", { status: 400 });

    try {
        await requireAdmin();
        const formData = await req.formData();

        const updateData: Partial<typeof maintenance.$inferInsert> = {};

        if (formData.has('car_id')) updateData.car_id = Number(formData.get('car_id'));
        if (formData.has('maintenance_detail')) updateData.maintenance_detail = String(formData.get('maintenance_detail'));
        if (formData.has('maintenance_cost')) updateData.maintenance_cost = String(formData.get('maintenance_cost'));
        if (formData.has('maintenance_date')) updateData.maintenance_date = new Date(String(formData.get('maintenance_date')));
        if (formData.has('recorded_by')) updateData.recorded_by = Number(formData.get('recorded_by'));

        if (Object.keys(updateData).length === 0) {
            return new Response("ไม่มีข้อมูลให้อัปเดต", { status: 400 });
        }

        const [updated] = await db
            .update(maintenance)
            .set(updateData)
            .where(eq(maintenance.maintenance_id, maintenanceId))
            .execute();

        if (!updated) {
            return new Response("ไม่พบรายการที่ต้องการอัปเดต", { status: 404 });
        }

        return NextResponse.json({ record: updated });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PUT maintenance error:", error);
        return new Response("เกิดข้อผิดพลาดในการอัปเดต", { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new Response("Unauthorized", { status: 401 });
    if (session.user.role !== "admin") return new Response("Forbidden", { status: 403 });

    const { id } = await params;
    const maintenanceId = Number(id);
    if (isNaN(maintenanceId)) return new Response("Invalid id", { status: 400 });

    try {
        await requireAdmin();
        // ดึง car_id ก่อนลบ (เพราะหลังลบจะหาไม่ได้)
        const [record] = await db
            .select({ car_id: maintenance.car_id })
            .from(maintenance)
            .where(eq(maintenance.maintenance_id, maintenanceId));

        if (!record) {
            return new Response("Maintenance record not found", { status: 404 });
        }

        // ลบ record
        await db
            .delete(maintenance)
            .where(eq(maintenance.maintenance_id, maintenanceId));

        // ถ้าไม่มี car_id หรือ car_id เป็น null → ข้าม logic เปลี่ยนสถานะรถ
        if (!record.car_id) {
            return NextResponse.json({ message: "Deleted (no car linked)" });
        }

        // เช็คว่ายังมีรายการซ่อมคันนี้เหลืออยู่ไหม (ไม่นับตัวที่เพิ่งลบไปแล้ว)
        const [remaining] = await db
            .select({ count: sql<number>`count(*)` })
            .from(maintenance)
            .where(
                and(
                    eq(maintenance.car_id, record.car_id),
                    ne(maintenance.maintenance_id, maintenanceId) // ไม่นับตัวเอง
                )
            );

        // ถ้าไม่มีรายการซ่อมเหลือเลย → เปลี่ยนรถเป็น available
        if (remaining.count === 0) {
            await db
                .update(cars)
                .set({ car_status: "available" })
                .where(eq(cars.car_id, record.car_id));
        }

        return NextResponse.json({
            message: "Maintenance record deleted successfully",
            car_status_updated: remaining.count === 0,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Delete maintenance error:", error);
        return new Response("Error deleting record", { status: 500 });
    }
}