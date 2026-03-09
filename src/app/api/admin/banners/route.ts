import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { notFound } from "next/navigation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "banner-images");

const allowedStatuses = ["draft", "published", "inactive"] as const;

type BannerStatus = (typeof allowedStatuses)[number];


// ========================
// GET (Admin: ดูทั้งหมด)
// ========================
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const data = await db
            .select()
            .from(banners)
            .orderBy(desc(banners.banner_order), desc(banners.banner_id));

        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }

        console.error("GET /api/banners error:", error);
        return NextResponse.json(
            { error: "ไม่สามารถโหลดข้อมูล banners ได้" },
            { status: 500 }
        );
    }
}


// ========================
// POST (สร้าง Banner)
// ========================
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await request.formData();

        const file = formData.get("banner_image") as File | null;

        const banner_title = (formData.get("banner_title") as string)?.trim();
        const banner_content = (formData.get("banner_content") as string)?.trim();
        const banner_status = (formData.get("banner_status") as BannerStatus) ?? "draft";
        const banner_start_date = formData.get("banner_start_date") as string | null;
        const banner_end_date = formData.get("banner_end_date") as string | null;
        const banner_link_url = (formData.get("banner_link_url") as string)?.trim() || null;
        const banner_link_target =
            (formData.get("banner_link_target") as "_self" | "_blank") ?? "_self";
        const banner_button_text =
            (formData.get("banner_button_text") as string)?.trim() || null;
        const banner_order = Number(formData.get("banner_order") ?? 0);

        const createdBy = Number(session.user.id);

        // ========================
        // Validation
        // ========================
        if (!banner_title || !banner_content) {
            return NextResponse.json(
                { error: "กรุณากรอกชื่อและรายละเอียดแบนเนอร์" },
                { status: 400 }
            );
        }

        if (!allowedStatuses.includes(banner_status)) {
            return NextResponse.json(
                { error: "สถานะไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        const startDate = banner_start_date ? new Date(banner_start_date) : null;
        const endDate = banner_end_date ? new Date(banner_end_date) : null;

        if (startDate && endDate && startDate > endDate) {
            return NextResponse.json(
                { error: "วันที่เริ่มต้องน้อยกว่าวันที่สิ้นสุด" },
                { status: 400 }
            );
        }

        // ========================
        // Upload Image
        // ========================
        let imageUrl: string | null = null;

        if (file && file.size > 0) {
            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
            ];

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF" },
                    { status: 400 }
                );
            }

            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "รูปภาพต้องไม่เกิน 5MB" },
                    { status: 400 }
                );
            }

            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const ext = path.extname(file.name);
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filepath, buffer);

            imageUrl = `/banner-images/${filename}`;
        }

        // ========================
        // Insert Database
        // ========================
        const result = await db
            .insert(banners)
            .values({
                banner_title: banner_title,
                banner_content: banner_content,
                banner_image_url: imageUrl,
                banner_link_url: banner_link_url,
                banner_link_target: banner_link_target,
                banner_button_text: banner_button_text,
                banner_order: banner_order,
                banner_start_date: startDate,
                banner_end_date: endDate,
                banner_status: banner_status,
                banner_created_by: createdBy,
            })
            .$returningId();

        const newId = result[0].banner_id;

        const [newBanner] = await db
            .select()
            .from(banners)
            .where(eq(banners.banner_id, newId));

        return NextResponse.json(newBanner, { status: 201 });

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }

        console.error("POST /api/banners error:", error);
        return NextResponse.json(
            { error: "ไม่สามารถเพิ่มแบนเนอร์ได้", details: error.message },
            { status: 500 }
        );
    }
}