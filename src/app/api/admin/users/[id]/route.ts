// app/api/admin/users/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { users, systemSettings } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { notFound } from "next/navigation";

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
        await requireAdmin();
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

        const passwordMinLength = settings.password_min_length || 8;
        if (password.length < passwordMinLength) {
            return new NextResponse(
                `รหัสผ่านต้องอย่างน้อย ${passwordMinLength} ตัวอักษร`,
                { status: 400 }
            );
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
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Update error:", error);
        return new NextResponse("Error updating user", { status: 500 });
    }
}

export async function DELETE(
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
        await requireAdmin();
        const [result] = await db.delete(users)
            .where(eq(users.id, Number(id)));

        if (result.affectedRows === 0) {
            return new NextResponse("User not found", { status: 404 });
        }

        return new NextResponse(JSON.stringify({ message: "User deleted successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Delete error:", error);
        return new NextResponse("Error deleting user", { status: 500 });
    }
}



//======================= เพิ่ม method GET ID =======================//
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const userId = Number(id);

    if (isNaN(userId)) {
        return new Response("Invalid user ID", { status: 400 });
    }

    // แก้จุด error ตรงนี้
    const isOwnProfile = Number(session.user.id) === userId;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isOwnProfile) {
        return new Response("Forbidden: You can only view your own profile", { status: 403 });
    }

    try {
        await requireAdmin();
        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                password: users.password,
                user_phone: users.user_phone,
                birth_date: users.birth_date,
                user_driver_license: users.user_driver_license,
                user_driver_license_expiry: users.user_driver_license_expiry,
                user_address: users.user_address,
                user_role: users.user_role,
                user_blacklist: users.user_blacklist,
                create_at_user: users.create_at_user,
                branch_id: users.branch_id,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            return new Response("User not found", { status: 404 });
        }

        return Response.json(user);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get user error:", error);
        return new Response("ไม่สามารถดึงข้อมูลผู้ใช้ได้", { status: 500 });
    }
}