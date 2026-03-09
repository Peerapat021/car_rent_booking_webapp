import { db } from "@/lib/db";
import { users, systemSettings } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            name,
            birth_date,
            email,
            password,
            user_phone,
            user_address,
        } = body;

        // =============================
        // REQUIRED FIELDS
        // =============================
        if (!name || !email || !password || !birth_date) {
            return new NextResponse("กรุณากรอกข้อมูลให้ครบถ้วน", {
                status: 400,
            });
        }

        // =============================
        // LOAD SYSTEM SETTINGS
        // =============================
        const settingsResult = await db.select().from(systemSettings);
        const settings = settingsResult[0];

        if (!settings) {
            return new NextResponse("ยังไม่ได้ตั้งค่า system settings", {
                status: 500,
            });
        }

        // =============================
        // EMAIL VALIDATION
        // =============================
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new NextResponse("รูปแบบอีเมลไม่ถูกต้อง", {
                status: 400,
            });
        }

        // =============================
        // PASSWORD POLICY
        // =============================
        const passwordMinLength = settings.password_min_length ?? 8;

        if (password.length < passwordMinLength) {
            return new NextResponse(
                `รหัสผ่านต้องอย่างน้อย ${passwordMinLength} ตัวอักษร`,
                { status: 400 }
            );
        }

        // =============================
        // AGE VALIDATION
        // =============================
        const today = new Date();
        const birth = new Date(birth_date);

        const age =
            today.getFullYear() -
            birth.getFullYear() -
            (today <
                new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
                ? 1
                : 0);

        const minAge = settings.min_renter_age ?? 18;

        if (age < minAge) {
            return new NextResponse(
                `อายุไม่ถึงขั้นต่ำ ${minAge} ปี`,
                { status: 400 }
            );
        }

        // =============================
        // CHECK DUPLICATE EMAIL
        // =============================
        const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (existing.length > 0) {
            return new NextResponse("อีเมลนี้มีในระบบแล้ว", {
                status: 409,
            });
        }

        // =============================
        // HASH PASSWORD
        // =============================
        const hashedPassword = await bcrypt.hash(password, 10);

        // =============================
        // INSERT CUSTOMER
        // =============================
        const result = await db
            .insert(users)
            .values({
                name,
                birth_date,
                email,
                password: hashedPassword,
                user_role: "customer",
                user_phone: user_phone ?? null,
                user_address: user_address ?? null,
                user_blacklist: false,
                branch_id: null,
                create_at_user: new Date(),
            })
            .$returningId();

        return NextResponse.json(
            {
                message: "สมัครสมาชิกสำเร็จ",
                id: result[0].id,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register error:", error);
        return new NextResponse("ไม่สามารถสมัครสมาชิกได้", {
            status: 500,
        });
    }
}