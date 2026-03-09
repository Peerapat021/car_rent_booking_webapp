// app/api/branches/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { notFound } from "next/navigation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "branch-images");


export async function GET() {

    try {
        await requireAdmin();
        const allBranches = await db.select().from(branches);

        return Response.json(allBranches);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get branches error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลได้", { status: 500 });
    }
}

export async function POST(request: NextRequest) {

    const session = await getServerSession(authOptions);

    if (!session) return new Response("Unauthorized", { status: 401 });
    if (session.user?.role !== "admin") return new Response("Forbidden", { status: 403 });

    try {
        await requireAdmin();

        const formData = await request.formData();
        const file = formData.get("image") as File | null;

        const cityId = Number(formData.get("city_id"));
        const branchName = (formData.get("branch_name") as string)?.trim();
        const branchAddress = (formData.get("branch_address") as string)?.trim();
        const branchPhone = (formData.get("branch_phone") as string)?.trim();
        const branchUrl = (formData.get("branch_url") as string)?.trim();

        if (!branchName || !branchAddress || !branchPhone || !cityId) {
            return new Response("กรุณากรอกข้อมูลให้ครบถ้วน", { status: 400 });
        }

        // จัดการรูปภาพ
        let branch_url: string | null = null;
        if (file) {
            if (!(file instanceof File) || file.size === 0) {
                return NextResponse.json({ error: "ไฟล์รูปภาพไม่ถูกต้อง" }, { status: 400 });
            }

            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "รูปภาพต้องไม่เกิน 5MB" }, { status: 400 });
            }

            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF" },
                    { status: 400 }
                );
            }

            // สร้างโฟลเดอร์ถ้ายังไม่มี
            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const ext = path.extname(file.name).toLowerCase() || ".jpg";
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filepath, buffer);

            branch_url = `/branch-images/${filename}`;
        }

        // Insert ข้อมูล
        const result = await db.insert(branches).values({
            branch_name: branchName,
            branch_address: branchAddress,
            branch_phone: branchPhone,
            city_id: cityId,
            branch_url: branch_url,
        }).$returningId();

        // Query ข้อมูลที่เพิ่งสร้างกลับมา
        const [newBranch] = await db
            .select()
            .from(branches)
            .where(eq(branches.branch_id, result[0].branch_id));

        return Response.json(newBranch, { status: 201 });

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Post branches error:", error);
        return new Response("ไม่สามารถเพิ่มสาขาได้", { status: 500 });
    }
}