// app/api/car-documents/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { carDocuments } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { notFound } from "next/navigation";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const docId = Number(id);

    if (isNaN(docId)) {
        return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const [document] = await db
            .select()
            .from(carDocuments)
            .where(eq(carDocuments.car_doc_id, docId))
            .limit(1);

        if (!document) {
            return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET /api/car_documents/[id] error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงเอกสาร" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ถ้าต้องการจำกัดเฉพาะ admin
    if (session.user.role !== "admin") {
        return NextResponse.json({ error: "ต้องเป็น admin เท่านั้น" }, { status: 403 });
    }

    const { id } = await params;
    const docId = Number(id);

    if (isNaN(docId)) {
        return NextResponse.json({ error: "ID ไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const body = await req.json();

        // ฟิลด์ที่อนุญาตให้อัปเดต (เลือกเฉพาะที่สมเหตุสมผล)
        const allowedFields = [
            "car_id",
            "car_doc_type",
            "car_doc_expire",
            "car_doc_file",
        ];

        const updateData: Partial<typeof carDocuments.$inferInsert> = {};

        for (const key of allowedFields) {
            if (key in body) {
                // @ts-expect-error - เรารู้ว่าฟิลด์ตรงกัน
                updateData[key] = body[key];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "ไม่มีข้อมูลให้อัปเดต" }, { status: 400 });
        }

        // จัดการวันที่ (ถ้าส่งมาเป็น string ISO หรืออื่น ๆ)
        if ("car_doc_expire" in updateData && updateData.car_doc_expire) {
            const expireDate = new Date(updateData.car_doc_expire);
            if (!isNaN(expireDate.getTime())) {
                updateData.car_doc_expire = expireDate;
            } else {
                return NextResponse.json({ error: "รูปแบบวันที่ car_doc_expire ไม่ถูกต้อง" }, { status: 400 });
            }
        }

        await db
            .update(carDocuments)
            .set(updateData)
            .where(eq(carDocuments.car_doc_id, docId));

        const [updated] = await db
            .select()
            .from(carDocuments)
            .where(eq(carDocuments.car_doc_id, docId))
            .limit(1);

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PUT /api/car_documents/[id] error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดต", details: error?.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const docId = Number(id);
    if (isNaN(docId)) return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });

    try {
        await requireAdmin();
        const [doc] = await db
            .select()
            .from(carDocuments)
            .where(eq(carDocuments.car_doc_id, docId))
            .limit(1);

        if (!doc) return new NextResponse("ไม่พบเอกสาร", { status: 404 });

        // ลบไฟล์จากดิสก์
        const filePath = doc.car_doc_file ? path.join(process.cwd(), "public", doc.car_doc_file) : "";
        if (filePath) {
            await fs.unlink(filePath).catch(() => { }); // ไม่ error ถ้าไฟล์หายไปแล้ว
        }

        // ลบจากฐานข้อมูล
        await db.delete(carDocuments).where(eq(carDocuments.car_doc_id, docId));

        return NextResponse.json({ message: "ลบเอกสารสำเร็จ" });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("DELETE car_document error:", error);
        return new NextResponse("ลบเอกสารไม่สำเร็จ", { status: 500 });
    }
}