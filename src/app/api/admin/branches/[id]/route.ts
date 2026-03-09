// app/api/users/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { notFound } from "next/navigation";

const UPLOAD_DIR = path.join(process.cwd(), "public", "branch-images");

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    const { id } = await params;
    const branchId = Number(id);

    if (isNaN(branchId)) {
        return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const [cls] = await db
            .select()
            .from(branches)
            .where(eq(branches.branch_id, branchId));

        if (!cls) {
            return NextResponse.json({ error: "ไม่พบสาขา" }, { status: 404 });
        }

        return NextResponse.json(cls);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Error fetching car class:", error);
        return NextResponse.json(
            { error: "ไม่สามารถโหลดข้อมูลได้" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const branchId = Number(id);
    if (isNaN(branchId)) {
        return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    try {
        await requireAdmin();
        // 🔥 ดึงข้อมูลเก่าก่อน
        const [existingBranch] = await db
            .select()
            .from(branches)
            .where(eq(branches.branch_id, branchId));

        if (!existingBranch) {
            return NextResponse.json({ message: "Branch not found" }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get("image") as File | null;

        const branchName = formData.get("branch_name") as string;
        const branchAddress = formData.get("branch_address") as string;
        const branchPhone = formData.get("branch_phone") as string;
        const cityId = Number(formData.get("city_id"));

        let branchUrl = existingBranch.branch_url;

        // ✅ ถ้ามีไฟล์ใหม่
        if (file && file.size > 0) {
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { message: "รูปภาพต้องไม่เกิน 5MB" },
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
                    { message: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF" },
                    { status: 400 }
                );
            }

            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const ext = path.extname(file.name) || ".jpg";
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filepath, buffer);

            // 🔥 ลบไฟล์เก่า
            if (existingBranch.branch_url) {
                const oldPath = path.join(
                    process.cwd(),
                    "public",
                    existingBranch.branch_url
                );

                if (existsSync(oldPath)) {
                    await unlink(oldPath).catch(() => { });
                }
            }

            branchUrl = `/branch-images/${filename}`;
        }

        await db
            .update(branches)
            .set({
                branch_name: branchName,
                branch_address: branchAddress,
                branch_phone: branchPhone,
                city_id: cityId,
                branch_url: branchUrl,
            })
            .where(eq(branches.branch_id, branchId));

        return NextResponse.json({
            message: "Branch updated successfully",
        });

    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Update error:", error);
        return NextResponse.json(
            { message: "Error updating branch" },
            { status: 500 }
        );
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
        const [result] = await db.delete(branches)
            .where(eq(branches.branch_id, Number(id)));

        if (result.affectedRows === 0) {
            return new Response("branches not found", { status: 404 });
        }

        return new Response(JSON.stringify({ message: "branches deleted successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Delete error:", error);
        return new Response("Error deleting branches", { status: 500 });
    }
}