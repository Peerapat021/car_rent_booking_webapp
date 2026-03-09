// app/api/users/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { users, systemSettings } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { notFound } from "next/navigation";

export async function GET() {
    try {
        await requireAdmin();
        const allUsers = await db.select().from(users);

        return Response.json(allUsers);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get users error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลผู้ใช้ได้", { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    // =============================
    // AUTH
    // =============================
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user?.role !== "admin") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        await requireAdmin();
        const body = await request.json();

        const {
            name,
            birth_date,
            email,
            password,
            user_role,
            user_phone,
            user_driver_license,
            user_driver_license_expiry,
            user_id_card,
            user_address,
            branch_id,
            user_blacklist,
        } = body;

        // =============================
        // LOAD SYSTEM SETTINGS (Single Company)
        // =============================
        const settingsResult = await db.select().from(systemSettings);
        const settings = settingsResult[0];

        if (!settings) {
            return new NextResponse("ยังไม่ได้ตั้งค่า system settings", {
                status: 500,
            });
        }

        // =============================
        // REQUIRED FIELDS
        // =============================
        if (!name || !email || !password || !user_role) {
            return new NextResponse("กรุณากรอกข้อมูลให้ครบถ้วน", {
                status: 400,
            });
        }

        // =============================
        // ROLE VALIDATION
        // =============================
        const allowedRoles = ["customer", "staff", "admin"];
        if (!allowedRoles.includes(user_role)) {
            return new NextResponse("Role ไม่ถูกต้อง", { status: 400 });
        }

        if ((user_role === "staff" || user_role === "admin") && !branch_id) {
            return new NextResponse("พนักงานต้องมีสาขา", { status: 400 });
        }

        // =============================
        // EMAIL VALIDATION
        // =============================
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new NextResponse("รูปแบบอีเมลไม่ถูกต้อง", { status: 400 });
        }

        // =============================
        // PASSWORD POLICY
        // =============================
        const passwordMinLength = settings.password_min_length || 8;
        if (password.length < passwordMinLength) {
            return new NextResponse(
                `รหัสผ่านต้องอย่างน้อย ${passwordMinLength} ตัวอักษร`,
                { status: 400 }
            );
        }

        // =============================
        // CUSTOMER VALIDATION
        // =============================
        if (user_role === "customer") {
            if (!birth_date) {
                return new NextResponse("กรุณาระบุวันเกิด", { status: 400 });
            }

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

            // ID Card Policy
            if (settings.require_id_card && !user_id_card) {
                return new NextResponse("ต้องระบุเลขบัตรประชาชน", {
                    status: 400,
                });
            }

            // Driver License Policy
            if (settings.require_driver_license) {
                if (!user_driver_license) {
                    return new NextResponse("ต้องระบุเลขใบขับขี่", {
                        status: 400,
                    });
                }

                if (!user_driver_license_expiry) {
                    return new NextResponse("กรุณาระบุวันหมดอายุใบขับขี่", {
                        status: 400,
                    });
                }

                if (new Date(user_driver_license_expiry) < new Date()) {
                    return new NextResponse("ใบขับขี่หมดอายุแล้ว", {
                        status: 400,
                    });
                }
            }
        }

        // =============================
        // HASH PASSWORD
        // =============================
        const hashedPassword = await bcrypt.hash(password, 10);

        // =============================
        // INSERT USER
        // =============================
        const result = await db
            .insert(users)
            .values({
                name,
                birth_date: birth_date ?? null,
                email,
                password: hashedPassword,
                user_role,
                user_phone: user_phone ?? null,
                user_driver_license: user_driver_license ?? null,
                user_driver_license_expiry:
                    user_driver_license_expiry ?? null,
                user_id_card: user_id_card ?? null,
                user_address: user_address ?? null,
                user_blacklist: user_blacklist ?? false,
                branch_id:
                    user_role === "customer" ? null : branch_id,
                create_at_user: new Date(),
            })
            .$returningId();

        return NextResponse.json(
            { id: result[0].id },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Post users error:", error);

        if (error.message?.includes("Duplicate entry")) {
            return new NextResponse("อีเมลนี้มีในระบบแล้ว", {
                status: 409,
            });
        }

        return new NextResponse("ไม่สามารถเพิ่มผู้ใช้ได้", {
            status: 500,
        });
    }
}