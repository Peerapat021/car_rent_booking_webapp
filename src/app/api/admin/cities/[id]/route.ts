// app/api/cities/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema"; // สมมติว่าชื่อตารางใน schema คือ cities
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// ────────────────────────────────────────────────
// GET → ดึงข้อมูลเมืองเดี่ยว
// ────────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cityId = Number(id);

    if (isNaN(cityId)) {
        return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        await requireAdmin();
        const [city] = await db
            .select({
                city_id: cities.city_id,
                city_name: cities.city_name,
                city_code: cities.city_code,
                city_postal_code: cities.city_postal_code,
                city_status: cities.city_status,
                created_at: cities.created_at,
            })
            .from(cities)
            .where(eq(cities.city_id, cityId))
            .limit(1);

        if (!city) {
            return NextResponse.json({ error: "ไม่พบเมืองนี้" }, { status: 404 });
        }

        return NextResponse.json(city);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET /api/cities/[id] error:", error);
        return NextResponse.json(
            { error: "ดึงข้อมูลเมืองไม่สำเร็จ" },
            { status: 500 }
        );
    }
}

// ────────────────────────────────────────────────
// PUT → อัปเดตข้อมูลเมือง
// ────────────────────────────────────────────────

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const cityId = Number(id);

    if (isNaN(cityId)) {
        return NextResponse.json({ error: "Invalid city ID" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const formData = await req.formData();

        // รับค่าจาก FormData
        const city_name = (formData.get("city_name") as string)?.trim();
        const city_code = (formData.get("city_code") as string)?.trim().toUpperCase();
        const city_postal_code = (formData.get("city_postal_code") as string)?.trim() || null;
        const city_status = (formData.get("city_status") as string)?.trim();

        // === Validation ===
        if (!city_name || city_name.length < 2) {
            return NextResponse.json(
                { error: "กรุณากรอกชื่อเมือง (อย่างน้อย 2 ตัวอักษร)" },
                { status: 400 }
            );
        }

        if (city_code && city_code.length > 10) {
            return NextResponse.json(
                { error: "รหัสเมืองต้องไม่เกิน 10 ตัวอักษร" },
                { status: 400 }
            );
        }

        if (!["active", "inactive"].includes(city_status)) {
            return NextResponse.json(
                { error: "city_status ต้องเป็น 'active' หรือ 'inactive' เท่านั้น" },
                { status: 400 }
            );
        }

        // ตรวจสอบว่ามีเมืองนี้อยู่จริง
        const [existingCity] = await db
            .select()
            .from(cities)
            .where(eq(cities.city_id, cityId));

        if (!existingCity) {
            return NextResponse.json({ error: "ไม่พบเมืองนี้" }, { status: 404 });
        }

        // อัปเดตฐานข้อมูล
        await db
            .update(cities)
            .set({
                city_name,
                city_code: city_code || null, // ถ้าไม่ส่งมาก็ให้เป็น null ได้
                city_postal_code,
                city_status: city_status as "active" | "inactive",
            })
            .where(eq(cities.city_id, cityId));

        // ดึงข้อมูลล่าสุดกลับมา
        const [updatedCity] = await db
            .select()
            .from(cities)
            .where(eq(cities.city_id, cityId));

        return NextResponse.json(updatedCity, { status: 200 });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PUT /api/cities/[id] error:", error);

        // จับกรณี duplicate city_code (ถ้ามี unique constraint)
        if (error.message?.includes("Duplicate entry") || error.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { error: "รหัสเมืองนี้มีอยู่ในระบบแล้ว" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "ไม่สามารถอัปเดตข้อมูลเมืองได้", details: error.message },
            { status: 500 }
        );
    }
}

// ────────────────────────────────────────────────
// DELETE → ลบเมือง
// ────────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const cityId = Number(id);

    if (isNaN(cityId)) {
        return NextResponse.json({ error: "Invalid city ID" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const [city] = await db
            .select()
            .from(cities)
            .where(eq(cities.city_id, cityId));

        if (!city) {
            return NextResponse.json({ error: "ไม่พบเมืองนี้" }, { status: 404 });
        }

        await db.delete(cities).where(eq(cities.city_id, cityId));

        return NextResponse.json(
            { message: "ลบเมืองเรียบร้อยแล้ว" },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("DELETE /api/cities/[id] error:", error);

        // ถ้ามี foreign key violation เป็นต้น
        if (error.code === "ER_ROW_IS_REFERENCED_2" || error.message?.includes("foreign key")) {
            return NextResponse.json(
                { error: "ไม่สามารถลบได้ เพราะมีการใช้งานเมืองนี้ในระบบ (เช่น มีการจองหรือข้อมูลอื่นอ้างอิง)" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการลบเมือง" },
            { status: 500 }
        );
    }
}