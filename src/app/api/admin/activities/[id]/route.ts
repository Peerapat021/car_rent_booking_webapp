// app/api/activities/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
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

const UPLOAD_DIR = path.join(process.cwd(), "public", "activity-images");


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const activityId = Number(id);

    if (isNaN(activityId)) {
        return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        await requireAdmin();
        const [activity] = await db
            .select({
                activities_id: activities.activities_id,
                activities_title: activities.activities_title,
                activities_content: activities.activities_content,
                activities_image_url: activities.activities_image_url,
                activities_start_date: activities.activities_start_date,
                activities_end_date: activities.activities_end_date,
                activities_status: activities.activities_status,
                activities_created_by: activities.activities_created_by,
                activities_created_at: activities.activities_created_at,
                activities_updated_at: activities.activities_updated_at,
            })
            .from(activities)
            .where(eq(activities.activities_id, activityId))
            .limit(1);

        if (!activity) {
            return new NextResponse("ไม่พบกิจกรรม", { status: 404 });
        }

        return NextResponse.json(activity);
    } catch (error) {
        console.error("GET activity error:", error);
        return new NextResponse("ดึงข้อมูลกิจกรรมไม่สำเร็จ", { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireAdmin();

    if (result instanceof Response) {
        return result;
    }
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activityId = Number((await params).id);
    if (isNaN(activityId)) {
        return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        const [existingActivity] = await db
            .select()
            .from(activities)
            .where(eq(activities.activities_id, activityId));

        if (!existingActivity) {
            return NextResponse.json({ error: "ไม่พบกิจกรรมนี้" }, { status: 404 });
        }

        const activities_title = (formData.get("activities_title") as string)?.trim();
        const activities_content = (formData.get("activities_content") as string)?.trim();
        const activities_status = formData.get("activities_status") as
            | "draft"
            | "published"
            | "inactive";

        const activities_start_date = formData.get("activities_start_date") as string | null;
        const activities_end_date = formData.get("activities_end_date") as string | null;

        if (!["draft", "published", "inactive"].includes(activities_status)) {
            return NextResponse.json(
                { error: "สถานะไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        let activities_image_url = existingActivity.activities_image_url;

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
            if (existingActivity.activities_image_url) {
                const oldPath = path.join(
                    process.cwd(),
                    "public",
                    existingActivity.activities_image_url
                );

                if (existsSync(oldPath)) {
                    await unlink(oldPath).catch(() => { });
                }
            }

            activities_image_url = `/activity-images/${filename}`;
        }

        // ───────────── Update DB ─────────────
        await db
            .update(activities)
            .set({
                activities_title,
                activities_content,
                activities_image_url,
                activities_status,
                activities_start_date: activities_start_date
                    ? new Date(activities_start_date)
                    : null,
                activities_end_date: activities_end_date
                    ? new Date(activities_end_date)
                    : null,
            })
            .where(eq(activities.activities_id, activityId));

        const [updatedActivity] = await db
            .select()
            .from(activities)
            .where(eq(activities.activities_id, activityId));

        return NextResponse.json(updatedActivity);
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PUT /api/activities/[id] error:", error);

        return NextResponse.json(
            { error: "ไม่สามารถอัปเดตกิจกรรมได้", details: error.message },
            { status: 500 }
        );
    }
}


// ────────────────────────────────────────────────
// DELETE → ลบกิจกรรม
// ────────────────────────────────────────────────
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activityId = Number((await params).id);

    if (isNaN(activityId)) {
        return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const [activity] = await db
            .select()
            .from(activities)
            .where(eq(activities.activities_id, activityId));

        if (!activity) {
            return NextResponse.json({ error: "ไม่พบกิจกรรมนี้" }, { status: 404 });
        }

        await db
            .delete(activities)
            .where(eq(activities.activities_id, activityId));

        return NextResponse.json(
            { message: "ลบกิจกรรมเรียบร้อยแล้ว" },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("DELETE /api/activities/[id] error:", error);

        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.message?.includes("foreign key")
        ) {
            return NextResponse.json(
                {
                    error:
                        "ไม่สามารถลบได้ เพราะมีกิจกรรมนี้ถูกใช้งานอยู่ในระบบ",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลบกิจกรรม" },
            { status: 500 }
        );
    }
}
