// app/api/payments/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

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
        const { payment_amount, payment_method, payment_status, paid_at, payment_created_by, create_at_payment } = await req.json();

        // เช็คเฉพาะฟิลด์ที่จำเป็น
        if (!payment_amount || !payment_method || !payment_status || !paid_at || !payment_created_by) {
            return new Response("Missing required fields", { status: 400 });
        }

        // เตรียมข้อมูลสำหรับ update
        const updateData: any = {
            payment_amount,
            payment_method,
            payment_status,
            paid_at,
            payment_created_by,
            create_at_payment,
        };

        // แปลงวันที่จาก ISO string เป็น YYYY-MM-DD
        if (create_at_payment) {
            const date = new Date(create_at_payment);
            updateData.create_at_payment = date.toISOString().split('T')[0];
        }

        const [result] = await db.update(payments)
            .set(updateData)
            .where(eq(payments.payment_id, Number(id)));

        if (result.affectedRows === 0) {
            return new Response("Payments not found", { status: 404 });
        }

        return new Response(JSON.stringify({ message: "Payments updated successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Update error:", error);
        return new Response("Error updating payments", { status: 500 });
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
        const [result] = await db.delete(payments)
            .where(eq(payments.payment_id, Number(id)));

        if (result.affectedRows === 0) {
            return new Response("Payments not found", { status: 404 });
        }

        return new Response(JSON.stringify({ message: "Payments deleted successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Delete error:", error);
        return new Response("Error deleting payments", { status: 500 });
    }
}