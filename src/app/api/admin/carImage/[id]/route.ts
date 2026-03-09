// app/api/car-images/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { carImages, cars, car_classes } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { notFound } from "next/navigation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "car-images", "gallery");

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    
    const { id } = await params;
    const imageId = Number(id);

    if (isNaN(imageId)) {
        return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        await requireAdmin();
        const [image] = await db
            .select({
                car_image_id: carImages.car_image_id,
                car_id: carImages.car_id,
                car_image_url: carImages.car_image_url,
                car_image_type: carImages.car_image_type,
            })
            .from(carImages)
            .where(eq(carImages.car_image_id, imageId))
            .limit(1);

        if (!image) {
            return new NextResponse("ไม่พบรูปภาพ", { status: 404 });
        }

        return NextResponse.json(image);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET car-image error:", error);
        return new NextResponse("ดึงข้อมูลรูปภาพไม่สำเร็จ", { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const imageId = Number(id);
    if (isNaN(imageId)) return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });

    try {
        await requireAdmin();
        const formData = await req.formData();
        const newFile = formData.get("file") as File | null;
        const newType = formData.get("type") as string | null;

        // ดึงข้อมูลรูปเก่า
        const [oldImage] = await db
            .select()
            .from(carImages)
            .where(eq(carImages.car_image_id, imageId))
            .limit(1);

        if (!oldImage) return new NextResponse("ไม่พบรูปภาพ", { status: 404 });

        let imageUrl = oldImage.car_image_url || "";
        let imageType = oldImage.car_image_type;

        // ถ้ามีไฟล์ใหม่ → อัปเดตไฟล์ + URL
        if (newFile) {
            // ลบไฟล์เก่าออกจากดิสก์
            const oldFilePath = path.join(process.cwd(), "public", imageUrl);
            await fs.unlink(oldFilePath).catch(() => { }); // ไม่ error ถ้าไฟล์หายไปแล้ว

            // บันทึกไฟล์ใหม่
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const ext = path.extname(newFile.name) || ".jpg";
            const filename = `${oldImage.car_id}_${newType || oldImage.car_image_type}_${timestamp}_${random}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            const buffer = Buffer.from(await newFile.arrayBuffer());
            await fs.writeFile(filepath, buffer);

            imageUrl = `/car-images/gallery/${filename}`;
        }

        // ถ้ามี type ใหม่ → อัปเดต type
        if (newType) {
            const validTypes = ["front", "back", "left", "right", "interior"] as const;
            if (!validTypes.includes(newType as any)) {
                return new NextResponse("ประเภทรูปไม่ถูกต้อง", { status: 400 });
            }
            imageType = newType as any;
        }

        // อัปเดตฐานข้อมูล
        await db
            .update(carImages)
            .set({
                car_image_url: imageUrl,
                car_image_type: imageType,
            })
            .where(eq(carImages.car_image_id, imageId));

        // ดึงข้อมูลที่อัปเดต (แทน returning)
        const [updated] = await db
            .select()
            .from(carImages)
            .where(eq(carImages.car_image_id, imageId))
            .limit(1);

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PUT car-image error:", error);
        return new NextResponse("แก้ไขรูปภาพไม่สำเร็จ", { status: 500 });
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
    const imageId = Number(id);
    if (isNaN(imageId)) return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });

    try {
        await requireAdmin();
        const [image] = await db
            .select()
            .from(carImages)
            .where(eq(carImages.car_image_id, imageId))
            .limit(1);

        if (!image) return new NextResponse("ไม่พบรูปภาพ", { status: 404 });

        // ลบไฟล์จากดิสก์
        const filePath = image.car_image_url ? path.join(process.cwd(), "public", image.car_image_url) : "";
        if (filePath) {
            await fs.unlink(filePath).catch(() => { }); // ไม่ error ถ้าไฟล์หายไปแล้ว
        }

        // ลบจากฐานข้อมูล
        await db.delete(carImages).where(eq(carImages.car_image_id, imageId));

        return NextResponse.json({ message: "ลบรูปภาพสำเร็จ" });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("DELETE car-image error:", error);
        return new NextResponse("ลบรูปภาพไม่สำเร็จ", { status: 500 });
    }
}