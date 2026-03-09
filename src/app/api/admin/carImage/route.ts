// app/api/car-images/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { carImages, cars } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { notFound } from "next/navigation";

// โฟลเดอร์อัปโหลดรูปภาพ
const UPLOAD_DIR = path.join(process.cwd(), "public", "car-images", "gallery");

// ตรวจสอบและสร้างโฟลเดอร์อัตโนมัติ
async function ensureUploadDir() {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function GET() {
    try {
        await requireAdmin();
        const result = await db
            .select({
                car_image_id: carImages.car_image_id,
                car_id: carImages.car_id,
                car_license_plate: cars.car_license_plate,
                car_image_url: carImages.car_image_url,
                car_image_type: carImages.car_image_type,
                uploaded_by: carImages.uploaded_by,
                create_at_car_image: carImages.create_at_car_image,
            })
            .from(carImages)
            .leftJoin(cars, eq(carImages.car_id, cars.car_id))
            .orderBy(carImages.create_at_car_image);

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET car-images error:", error);
        return new NextResponse("โหลดข้อมูลรูปภาพไม่สำเร็จ", { status: 500 });
    }
}

export async function POST(req: NextRequest) {  
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    if (session.user.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

    try {
        await requireAdmin();
        const formData = await req.formData();
        const car_id = Number(formData.get("car_id"));
        const files = formData.getAll("files") as File[];
        const types = formData.getAll("types") as string[];

        // ตรวจสอบข้อมูล
        if (!car_id || files.length === 0 || files.length !== types.length) {
            return NextResponse.json({ error: "ข้อความ error" }, { status: 400 })
        }

        // ตรวจสอบว่ารถมีอยู่จริง
        const [car] = await db.select().from(cars).where(eq(cars.car_id, car_id)).limit(1);
        if (!car) return new NextResponse("ไม่พบรถที่ระบุ", { status: 404 });

        const validTypes = ["front", "back", "left", "right", "interior"] as const;
        await ensureUploadDir();

        const uploadedImages = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const type = types[i];

            if (!validTypes.includes(type as any)) {
                return new NextResponse(`ประเภทรูปไม่ถูกต้อง: ${type}`, { status: 400 });
            }

            // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const ext = path.extname(file.name) || ".jpg";
            const filename = `${car_id}_${type}_${timestamp}_${random}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            // บันทึกไฟล์ลงดิสก์
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(filepath, buffer);

            // URL ที่ frontend จะใช้แสดงรูป
            const imageUrl = `/car-images/gallery/${filename}`;

            // บันทึกลงฐานข้อมูล
            const [newImage] = await db
                .insert(carImages)
                .values({
                    car_id,
                    car_image_url: imageUrl,
                    car_image_type: type as any,
                    uploaded_by: Number(session.user.id),
                })
                .$returningId();

            const [insertedImage] = await db
                .select()
                .from(carImages)
                .where(eq(carImages.car_image_id, newImage.car_image_id))
                .limit(1);

            uploadedImages.push(insertedImage);
        }

        return NextResponse.json(uploadedImages, { status: 201 });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("POST car-images error:", error);
        return new NextResponse(error.message || "เพิ่มรูปภาพไม่สำเร็จ", { status: 500 });
    }
}