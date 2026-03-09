// app/api/admin/system_settings/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { systemSettings, company } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const session = await getServerSession(authOptions);

        if (!session) return new Response("Unauthorized", { status: 401 });
        if (session.user?.role !== "admin") return new Response("Forbidden", { status: 403 });

        const rows = await db
            .select({
                // Company – เฉพาะ field ที่จำเป็นจริง ๆ (ลด payload)
                company_name: company.company_name,
                company_logo: company.company_logo,
                company_phone: company.company_phone,
                company_email: company.company_email,
                company_description: company.company_description,
                company_address: company.company_address,
                tax_id: company.tax_id,
                bank_name: company.bank_name,
                bank_account_name: company.bank_account_name,
                bank_account_number: company.bank_account_number,
                promptpay_id: company.promptpay_id,
                promptpay_qr: company.promptpay_qr,
                website_url: company.website_url,

                // system_settings – ทุก field
                require_id_card: systemSettings.require_id_card,
                require_driver_license: systemSettings.require_driver_license,
                allow_extension: systemSettings.allow_extension,
                enforce_deposit: systemSettings.enforce_deposit,
                full_to_full_policy: systemSettings.full_to_full_policy,
                min_renter_age: systemSettings.min_renter_age,
                default_deposit_amount: systemSettings.default_deposit_amount,
                late_fee_per_hour: systemSettings.late_fee_per_hour,
                cancellation_fee: systemSettings.cancellation_fee,
                no_show_fee: systemSettings.no_show_fee,
                require_pickup_photos: systemSettings.require_pickup_photos,
                require_return_photos: systemSettings.require_return_photos,
                min_photo_count: systemSettings.min_photo_count,
                auto_approve_return: systemSettings.auto_approve_return,
                require_insurance: systemSettings.require_insurance,
                maintenance_alert_km: systemSettings.maintenance_alert_km,
                insurance_alert_days: systemSettings.insurance_alert_days,
                tax_alert_days: systemSettings.tax_alert_days,
                enable_cash: systemSettings.enable_cash,
                enable_credit_card: systemSettings.enable_credit_card,
                enable_qr_promptpay: systemSettings.enable_qr_promptpay,
                enable_bank_transfer: systemSettings.enable_bank_transfer,
                auto_generate_invoice: systemSettings.auto_generate_invoice,
                vat_percent: systemSettings.vat_percent,
                password_min_length: systemSettings.password_min_length,
                max_login_attempts: systemSettings.max_login_attempts,
                lockout_duration_minutes: systemSettings.lockout_duration_minutes,
                session_timeout_minutes: systemSettings.session_timeout_minutes,
                maintenance_mode: systemSettings.maintenance_mode,
                updated_at: systemSettings.updated_at,
            })
            .from(systemSettings)
            .leftJoin(company, eq(company.company_id, systemSettings.company_id))
            .limit(1);
        // console.log("API data:", rows[0]);


        if (rows.length === 0) {
            return NextResponse.json(
                { status: 404 }
            );
        }

        return NextResponse.json(rows[0]);
    } catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            notFound();
        }
        console.error("[GET /api/system_settings]", err);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}


