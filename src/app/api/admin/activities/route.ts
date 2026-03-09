// app/api/activities/route.ts

import { db } from "@/lib/db";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { activities } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { notFound } from "next/navigation";

import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "activity-images");

// ======================== GET ========================
export async function GET() {
    try {
        await requireAdmin();
        const allActivities = await db
            .select()
            .from(activities)
            .orderBy(desc(activities.activities_id));

        return NextResponse.json(allActivities);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get activities error:", error);
        return new NextResponse("ไม่สามารถโหลดข้อมูล activities ได้", { status: 500 });
    }
}


// ======================== POST ========================
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

        // ===== ดึงข้อมูล =====
        const activities_title = (formData.get("activities_title") as string)?.trim();
        const activities_content = (formData.get("activities_content") as string)?.trim();
        const activities_status = (formData.get("activities_status") as
            | "draft"
            | "published"
            | "inactive") ?? "draft";

        const start_date = formData.get("activities_start_date") as string | null;
        const end_date = formData.get("activities_end_date") as string | null;

        const created_by = Number(session.user.id);

        // ===== Validation =====
        if (!activities_title || !activities_content) {
            return NextResponse.json(
                { error: "กรุณากรอกชื่อและรายละเอียดกิจกรรม" },
                { status: 400 }
            );
        }

        if (!["draft", "published", "inactive"].includes(activities_status)) {
            return NextResponse.json(
                { error: "สถานะไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        // ===== Upload รูป =====
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

            imageUrl = `/activity-images/${filename}`;
        }

        // ===== Insert DB =====
        const result = await db
            .insert(activities)
            .values({
                activities_title,
                activities_content,
                activities_image_url: imageUrl,
                activities_start_date: start_date ? new Date(start_date) : null,
                activities_end_date: end_date ? new Date(end_date) : null,
                activities_status,
                activities_created_by: created_by,
            })
            .$returningId();

        const newId = result[0].activities_id;

        const [newActivity] = await db
            .select()
            .from(activities)
            .where(eq(activities.activities_id, newId));

        return NextResponse.json(newActivity, { status: 201 });

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("POST /api/activities error:", error);

        return NextResponse.json(
            { error: "ไม่สามารถเพิ่มกิจกรรมได้", details: error.message },
            { status: 500 }
        );
    }
}
