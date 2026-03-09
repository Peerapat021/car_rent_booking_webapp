//app/api/company/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { company } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { notFound } from "next/navigation";

// โฟลเดอร์เก็บโลโก้บริษัท
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "company-logo");

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // ถ้าใช้ [id] folder
    // หรือลบ params ออกถ้าใช้ route แบบไม่ dynamic
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    // ถ้าใช้ dynamic route [id]
    const { id } = await params;
    const companyId = Number(id);

    // ถ้าใช้ route เดียวแบบ PUT /api/company (ส่ง id ใน body)
    // const formData = await req.formData();
    // const companyId = Number(formData.get("company_id"));

    if (!companyId || isNaN(companyId)) {
        return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const formData = await req.formData();
        const file = formData.get("logo") as File | null; // ใช้ชื่อ field ว่า "logo"

        // ดึงข้อมูลบริษัทเดิม
        const [existingCompany] = await db
            .select()
            .from(company)
            .where(eq(company.company_id, companyId));

        if (!existingCompany) {
            return NextResponse.json({ error: "ไม่พบข้อมูลบริษัท" }, { status: 404 });
        }

        // รับค่าจาก FormData
        const company_name = (formData.get("company_name") as string)?.trim();
        const company_description = (formData.get("company_description") as string)?.trim() || null;
        const company_phone = (formData.get("company_phone") as string)?.trim() || null;
        const company_email = (formData.get("company_email") as string)?.trim() || null;
        const company_address = (formData.get("company_address") as string)?.trim() || null;
        const tax_id = (formData.get("tax_id") as string)?.trim() || null;

        const bank_name = (formData.get("bank_name") as string)?.trim() || null;
        const bank_account_name = (formData.get("bank_account_name") as string)?.trim() || null;
        const bank_account_number = (formData.get("bank_account_number") as string)?.trim() || null;

        const promptpay_id = (formData.get("promptpay_id") as string)?.trim() || null;
        // promptpay_qr จะอัปเดตจาก file แยก (ถ้ามี)

        const facebook_url = (formData.get("facebook_url") as string)?.trim() || null;
        const instagram_url = (formData.get("instagram_url") as string)?.trim() || null;
        const tiktok_url = (formData.get("tiktok_url") as string)?.trim() || null;
        const line_id = (formData.get("line_id") as string)?.trim() || null;
        const website_url = (formData.get("website_url") as string)?.trim() || null;
        const map_url = (formData.get("map_url") as string)?.trim() || null;
        const business_hours = (formData.get("business_hours") as string)?.trim() || null;

        // Validation หลัก ๆ
        if (!company_name) {
            return NextResponse.json({ error: "กรุณากรอกชื่อบริษัท" }, { status: 400 });
        }

        let company_logo = existingCompany.company_logo;
        let promptpay_qr = existingCompany.promptpay_qr;

        // อัปโหลดโลโก้บริษัท (ถ้ามีไฟล์ใหม่)
        if (file && file instanceof File && file.size > 0) {
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "โลโก้ต้องไม่เกิน 5MB" }, { status: 400 });
            }

            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: "โลโก้รองรับเฉพาะ JPEG, PNG, WebP, GIF" },
                    { status: 400 }
                );
            }

            // สร้างโฟลเดอร์ถ้ายังไม่มี
            if (!existsSync(UPLOAD_DIR)) {
                await mkdir(UPLOAD_DIR, { recursive: true });
            }

            const ext = path.extname(file.name).toLowerCase() || ".png";
            const filename = `${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filepath, buffer);

            // ลบโลโก้เก่า
            if (existingCompany.company_logo) {
                const oldPath = path.join(process.cwd(), "public", existingCompany.company_logo);
                if (existsSync(oldPath)) {
                    await unlink(oldPath).catch(() => { });
                }
            }

            company_logo = `/uploads/company-logo/${filename}`;
        }

        // ถ้าอยากให้อัปโหลด PromptPay QR แยก (optional)
        const promptpayFile = formData.get("promptpay_qr") as File | null;
        if (promptpayFile && promptpayFile instanceof File && promptpayFile.size > 0) {
            // ตรวจสอบขนาดและประเภทเหมือนด้านบน...
            if (promptpayFile.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "QR Code ต้องไม่เกิน 5MB" }, { status: 400 });
            }
            const allowed = ["image/jpeg", "image/jpg", "image/png"];
            if (!allowed.includes(promptpayFile.type)) {
                return NextResponse.json({ error: "QR Code รองรับเฉพาะ JPG, PNG" }, { status: 400 });
            }

            const ext = path.extname(promptpayFile.name).toLowerCase() || ".png";
            const filename = `promptpay-${randomUUID()}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);
            await writeFile(filepath, Buffer.from(await promptpayFile.arrayBuffer()));

            if (existingCompany.promptpay_qr) {
                const oldQr = path.join(process.cwd(), "public", existingCompany.promptpay_qr);
                if (existsSync(oldQr)) await unlink(oldQr).catch(() => { });
            }

            promptpay_qr = `/uploads/company-logo/${filename}`;
        }

        // อัปเดตข้อมูลบริษัท
        await db
            .update(company)
            .set({
                company_name,
                company_description,
                company_phone,
                company_email,
                company_address,
                tax_id,
                bank_name,
                bank_account_name,
                bank_account_number,
                promptpay_id,
                promptpay_qr,
                facebook_url,
                instagram_url,
                tiktok_url,
                line_id,
                website_url,
                map_url,
                business_hours,
                company_logo,
                updated_at: new Date(),
                updated_by: Number(session.user.id), // ถ้ามี user id
            })
            .where(eq(company.company_id, companyId));

        // ดึงข้อมูลล่าสุดกลับ
        const [updatedCompany] = await db
            .select()
            .from(company)
            .where(eq(company.company_id, companyId));

        return NextResponse.json({
            message: "อัปเดตข้อมูลบริษัทเรียบร้อย",
            company: updatedCompany
        }, { status: 200 });

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PUT /api/company error:", error);
        return NextResponse.json(
            { error: "ไม่สามารถอัปเดตข้อมูลบริษัทได้", details: error.message },
            { status: 500 }
        );
    }
}