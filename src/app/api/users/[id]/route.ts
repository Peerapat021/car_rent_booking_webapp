// app/api/users/[id]/route.ts
import { db } from "@/lib/db";
import { users, systemSettings } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const userId = Number(params.id);

    if (isNaN(userId)) {
        return Response.json(
            { error: "รหัสผู้ใช้งานไม่ถูกต้อง" },
            { status: 400 }
        );
    }

    try {
        const result = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                birth_date: users.birth_date,
                user_phone: users.user_phone,
                user_id_card: users.user_id_card,
                user_driver_license: users.user_driver_license,
                user_driver_license_expiry: users.user_driver_license_expiry,
                user_address: users.user_address,
                user_role: users.user_role,
                user_blacklist: users.user_blacklist,
                branch_id: users.branch_id,
                create_at_user: users.create_at_user,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (result.length === 0) {
            return Response.json(
                { error: "ไม่พบข้อมูลผู้ใช้งาน" },
                { status: 404 }
            );
        }

        return Response.json(result[0]);
    } catch (error) {
        console.error("Get user by id error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลผู้ใช้งานได้", {
            status: 500,
        });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    if (!id || isNaN(Number(id))) {
        return new NextResponse("Invalid id", { status: 400 });
    }

    try {
        const { name, birth_date, email, password, user_role, user_phone, user_driver_license, user_driver_license_expiry, user_address, branch_id, user_blacklist } = await req.json();

        const settingsResult = await db.select().from(systemSettings);
        const settings = settingsResult[0];

        // เช็คเฉพาะฟิลด์ที่จำเป็น
        if (!name || !email || !user_role) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if ((user_role === "admin" || user_role === "staff") && !branch_id) {
            return new NextResponse("พนักงานต้องมีสาขา", { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new NextResponse("รูปแบบอีเมลไม่ถูกต้อง", { status: 400 });
        }

        // เตรียมข้อมูลสำหรับ update
        const updateData: any = {
            name,
            birth_date,
            email,
            password,
            user_role,
            user_phone,
            user_driver_license,
            user_address,
            user_blacklist,
            branch_id: branch_id ?? null
        };

        // แปลงวันที่จาก ISO string เป็น YYYY-MM-DD
        if (user_driver_license_expiry) {
            const date = new Date(user_driver_license_expiry);
            updateData.user_driver_license_expiry = date.toISOString().split('T')[0];
        }

        // ถ้ามีการส่ง password มา ให้ hash ก่อน
        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const [result] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, Number(id)));

        if (result.affectedRows === 0) {
            return new NextResponse("User not found", { status: 404 });
        }

        return new NextResponse(JSON.stringify({ message: "User updated successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Update error:", error);
        return new NextResponse("Error updating user", { status: 500 });
    }
}