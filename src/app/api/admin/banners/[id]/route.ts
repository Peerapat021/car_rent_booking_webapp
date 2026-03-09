// app/api/banners/[id]/route.ts

import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import path from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { unlink } from "fs/promises";
import { notFound } from "next/navigation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "banner-images");


// ────────────────────────────────────────────────
// GET → ดึง banner ตาม id
// ────────────────────────────────────────────────
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const bannerId = Number(id);

    if (isNaN(bannerId)) {
        return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        await requireAdmin();

        const [banner] = await db
            .select()
            .from(banners)
            .where(eq(banners.banner_id, bannerId))
            .limit(1);

        if (!banner) {
            return new NextResponse("ไม่พบแบนเนอร์", { status: 404 });
        }

        return NextResponse.json(banner);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET banner error:", error);
        return new NextResponse("ดึงข้อมูลแบนเนอร์ไม่สำเร็จ", { status: 500 });
    }
}


// ────────────────────────────────────────────────
// PUT → แก้ไข banner
// ────────────────────────────────────────────────
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireAdmin();
    if (result instanceof Response) return result;

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bannerId = Number((await params).id);
    if (isNaN(bannerId)) {
        return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("banner_image") as File | null;

        const [existingBanner] = await db
            .select()
            .from(banners)
            .where(eq(banners.banner_id, bannerId));

        if (!existingBanner) {
            return NextResponse.json({ error: "ไม่พบแบนเนอร์นี้" }, { status: 404 });
        }

        const banner_title = (formData.get("banner_title") as string)?.trim();
        const banner_content = (formData.get("banner_content") as string)?.trim();
        const banner_status = formData.get("banner_status") as
            | "draft"
            | "published"
            | "inactive";

        const banner_start_date = formData.get("banner_start_date") as string | null;
        const banner_end_date = formData.get("banner_end_date") as string | null;

        if (!["draft", "published", "inactive"].includes(banner_status)) {
            return NextResponse.json(
                { error: "สถานะไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        let banner_image_url = existingBanner.banner_image_url;

        // ───── Upload รูปใหม่ ─────
        if (file && file.size > 0) {
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "รูปภาพต้องไม่เกิน 5MB" },
                    { status: 400 }
                );
            }

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
            ];

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: "รองรับเฉพาะ JPEG, PNG, WebP, GIF" },
                    { status: 400 }
                );
            }

            if (!existsSync(UPLOAD_DIR)) {
                await fs.mkdir(UPLOAD_DIR, { recursive: true });
            }

            const ext = path.extname(file.name) || ".jpg";
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(filepath, buffer);

            // ลบรูปเก่า
            if (existingBanner.banner_image_url) {
                const oldPath = path.join(
                    process.cwd(),
                    "public",
                    existingBanner.banner_image_url
                );

                if (existsSync(oldPath)) {
                    await unlink(oldPath).catch(() => { });
                }
            }

            banner_image_url = `/banner-images/${filename}`;
        }

        // ───── Update DB ─────
        await db
            .update(banners)
            .set({
                banner_title,
                banner_content,
                banner_image_url,
                banner_status,
                banner_start_date: banner_start_date
                    ? new Date(banner_start_date)
                    : null,
                banner_end_date: banner_end_date
                    ? new Date(banner_end_date)
                    : null,
            })
            .where(eq(banners.banner_id, bannerId));

        const [updatedBanner] = await db
            .select()
            .from(banners)
            .where(eq(banners.banner_id, bannerId));

        return NextResponse.json(updatedBanner);

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }

        console.error("PUT /api/banners/[id] error:", error);

        return NextResponse.json(
            { error: "ไม่สามารถอัปเดตแบนเนอร์ได้", details: error.message },
            { status: 500 }
        );
    }
}

// ────────────────────────────────────────────────
// PATCH → แก้ไขบางส่วนของ banner
// ────────────────────────────────────────────────
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireAdmin();
    if (result instanceof Response) return result;

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bannerId = Number((await params).id);
    if (isNaN(bannerId)) {
        return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        const [existingBanner] = await db
            .select()
            .from(banners)
            .where(eq(banners.banner_id, bannerId));

        if (!existingBanner) {
            return NextResponse.json({ error: "ไม่พบแบนเนอร์นี้" }, { status: 404 });
        }

        // เตรียม object สำหรับ update แบบ dynamic
        const updateData: Partial<typeof banners.$inferInsert> = {};

        const banner_title = formData.get("banner_title") as string | null;
        const banner_content = formData.get("banner_content") as string | null;
        const banner_status = formData.get("banner_status") as
            | "draft"
            | "published"
            | "inactive"
            | null;

        const banner_start_date = formData.get("banner_start_date") as string | null;
        const banner_end_date = formData.get("banner_end_date") as string | null;

        // ───── เฉพาะ field ที่ส่งมาเท่านั้น ─────
        if (banner_title !== null) {
            updateData.banner_title = banner_title.trim();
        }

        if (banner_content !== null) {
            updateData.banner_content = banner_content.trim();
        }

        if (banner_status !== null) {
            if (!["draft", "published", "inactive"].includes(banner_status)) {
                return NextResponse.json(
                    { error: "สถานะไม่ถูกต้อง" },
                    { status: 400 }
                );
            }
            updateData.banner_status = banner_status;
        }

        if (banner_start_date !== null) {
            updateData.banner_start_date = banner_start_date
                ? new Date(banner_start_date)
                : null;
        }

        if (banner_end_date !== null) {
            updateData.banner_end_date = banner_end_date
                ? new Date(banner_end_date)
                : null;
        }

        // ───── จัดการรูปภาพ (ถ้ามี) ─────
        if (file && file.size > 0) {
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "รูปภาพต้องไม่เกิน 5MB" },
                    { status: 400 }
                );
            }

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
            ];

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: "รองรับเฉพาะ JPEG, PNG, WebP, GIF" },
                    { status: 400 }
                );
            }

            if (!existsSync(UPLOAD_DIR)) {
                await fs.mkdir(UPLOAD_DIR, { recursive: true });
            }

            const ext = path.extname(file.name) || ".jpg";
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(filepath, buffer);

            // ลบรูปเก่า
            if (existingBanner.banner_image_url) {
                const oldPath = path.join(
                    process.cwd(),
                    "public",
                    existingBanner.banner_image_url
                );

                if (existsSync(oldPath)) {
                    await unlink(oldPath).catch(() => { });
                }
            }

            updateData.banner_image_url = `/banner-images/${filename}`;
        }

        // ถ้าไม่มีอะไรให้อัปเดตเลย
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "ไม่มีข้อมูลสำหรับอัปเดต" },
                { status: 400 }
            );
        }

        await db
            .update(banners)
            .set(updateData)
            .where(eq(banners.banner_id, bannerId));

        const [updatedBanner] = await db
            .select()
            .from(banners)
            .where(eq(banners.banner_id, bannerId));

        return NextResponse.json(updatedBanner);

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PATCH /api/banners/[id] error:", error);

        return NextResponse.json(
            { error: "ไม่สามารถอัปเดตแบนเนอร์ได้", details: error.message },
            { status: 500 }
        );
    }
}

// ────────────────────────────────────────────────
// DELETE → ลบ banner
// ────────────────────────────────────────────────
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bannerId = Number((await params).id);

    if (isNaN(bannerId)) {
        return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
    }

    try {
        await requireAdmin();

        const [banner] = await db
            .select()
            .from(banners)
            .where(eq(banners.banner_id, bannerId));

        if (!banner) {
            return NextResponse.json({ error: "ไม่พบแบนเนอร์นี้" }, { status: 404 });
        }

        await db
            .delete(banners)
            .where(eq(banners.banner_id, bannerId));

        return NextResponse.json(
            { message: "ลบแบนเนอร์เรียบร้อยแล้ว" },
            { status: 200 }
        );

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }

        console.error("DELETE /api/banners/[id] error:", error);

        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.message?.includes("foreign key")
        ) {
            return NextResponse.json(
                {
                    error: "ไม่สามารถลบได้ เพราะแบนเนอร์นี้ถูกใช้งานอยู่ในระบบ",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลบแบนเนอร์" },
            { status: 500 }
        );
    }
}