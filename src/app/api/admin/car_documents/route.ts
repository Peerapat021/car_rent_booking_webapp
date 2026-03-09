// app/api/car-documents/route.ts  
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { carDocuments, cars } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import path from "path";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { notFound } from "next/navigation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "car-documents");

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const car_id = searchParams.get("car_id");

    if (!car_id || isNaN(Number(car_id))) {
        return NextResponse.json({ error: "ต้องระบุ car_id" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const documents = await db
            .select()
            .from(carDocuments)
            .where(eq(carDocuments.car_id, Number(car_id)))
            .orderBy(carDocuments.create_at_car_doc);

        return NextResponse.json(documents);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error(error);
        return NextResponse.json({ error: "ไม่สามารถดึงเอกสารได้" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden – Admin Only" }, { status: 403 });
    }

    try {
        await requireAdmin();
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        // ฟิลด์หลักที่ต้องส่งมา
        const car_id_str        = formData.get("car_id") as string;
        const car_doc_type      = (formData.get("car_doc_type") as string)?.trim(); // เช่น "insurance", "registration", "tax", "photo", ...
        const car_doc_expire_str = formData.get("car_doc_expire") as string; // รูปแบบ YYYY-MM-DD

        // Validation พื้นฐาน
        if (!car_id_str || isNaN(Number(car_id_str))) {
            return NextResponse.json({ error: "ต้องระบุ car_id ที่ถูกต้อง" }, { status: 400 });
        }

        if (!car_doc_type) {
            return NextResponse.json({ error: "ต้องระบุประเภทเอกสาร (car_doc_type)" }, { status: 400 });
        }

        if (!file || !(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: "กรุณาอัปโหลดไฟล์เอกสาร" }, { status: 400 });
        }

        // ตรวจสอบขนาดและประเภทไฟล์ (ปรับได้ตามต้องการ)
        if (file.size > 10 * 1024 * 1024) { // 10MB
            return NextResponse.json({ error: "ไฟล์ต้องไม่เกิน 10MB" }, { status: 400 });
        }

        const allowedTypes = [
            "image/jpeg", "image/jpg", "image/png", "image/webp",
            "application/pdf",
            "image/gif" // ถ้าต้องการอนุญาต
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "รองรับเฉพาะ JPEG, PNG, WebP, PDF" },
                { status: 400 }
            );
        }

        // ตรวจสอบว่ารถคันนี้มีจริง
        const [car] = await db
            .select({ id: cars.car_id })
            .from(cars)
            .where(eq(cars.car_id, Number(car_id_str)))
            .limit(1);

        if (!car) {
            return NextResponse.json({ error: "ไม่พบรถยนต์ที่ระบุ" }, { status: 404 });
        }

        // สร้างโฟลเดอร์ถ้ายังไม่มี
        if (!existsSync(UPLOAD_DIR)) {
            await mkdir(UPLOAD_DIR, { recursive: true });
        }

        // ตั้งชื่อไฟล์ใหม่ (ไม่ใช้ชื่อเดิมเพื่อป้องกันการชนกัน)
        const ext = path.extname(file.name).toLowerCase() || (file.type.includes("pdf") ? ".pdf" : ".jpg");
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filepath, buffer);

        const filePathPublic = `/car-documents/${filename}`;

        // วันหมดอายุ (ถ้ามี)
        let car_doc_expire: Date | null = null;
        if (car_doc_expire_str) {
            car_doc_expire = new Date(car_doc_expire_str);
            if (isNaN(car_doc_expire.getTime())) {
                return NextResponse.json({ error: "รูปแบบวันที่หมดอายุไม่ถูกต้อง (ใช้ YYYY-MM-DD)" }, { status: 400 });
            }
        }

        // บันทึกข้อมูลเอกสารลงตาราง carDocuments
        const [newDoc] = await db
            .insert(carDocuments)
            .values({
                car_id: Number(car_id_str),
                car_doc_type,
                car_doc_expire: car_doc_expire,
                car_doc_file: filePathPublic,
            })
            .$returningId();

        return NextResponse.json(newDoc, { status: 201 });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("POST /api/car-documents error:", error);

        if (error?.code === "ER_DUP_ENTRY" || error?.message?.includes("Duplicate")) {
            return NextResponse.json({ error: "ข้อมูลนี้ซ้ำ" }, { status: 409 });
        }

        return NextResponse.json(
            { error: "ไม่สามารถอัปโหลดเอกสารได้", details: error?.message },
            { status: 500 }
        );
    }
}