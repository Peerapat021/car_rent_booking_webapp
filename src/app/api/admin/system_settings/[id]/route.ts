// api/system_settings/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function PATCH(req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const session = await getServerSession(authOptions);

        if (!session) return new Response("Unauthorized", { status: 401 });
        if (session.user?.role !== "admin") return new Response("Forbidden", { status: 403 });

        const body = await req.json();
        //console.log("PATCH body received:", body);
        const { id } = await params;

        // Whitelist – ตรงกับ schema system_settings เท่านั้น
        const allowedFields: Partial<typeof systemSettings.$inferInsert> = {
            require_id_card: body.require_id_card,
            require_driver_license: body.require_driver_license,
            allow_extension: body.allow_extension,
            enforce_deposit: body.enforce_deposit,
            full_to_full_policy: body.full_to_full_policy,
            min_renter_age: body.min_renter_age,
            default_deposit_amount: body.default_deposit_amount,
            late_fee_per_hour: body.late_fee_per_hour,
            cancellation_fee: body.cancellation_fee,
            no_show_fee: body.no_show_fee,
            require_pickup_photos: body.require_pickup_photos,
            require_return_photos: body.require_return_photos,
            min_photo_count: body.min_photo_count,
            auto_approve_return: body.auto_approve_return,
            require_insurance: body.require_insurance,
            maintenance_alert_km: body.maintenance_alert_km,
            insurance_alert_days: body.insurance_alert_days,
            tax_alert_days: body.tax_alert_days,
            enable_cash: body.enable_cash,
            enable_credit_card: body.enable_credit_card,
            enable_qr_promptpay: body.enable_qr_promptpay,
            enable_bank_transfer: body.enable_bank_transfer,
            auto_generate_invoice: body.auto_generate_invoice,
            vat_percent: body.vat_percent,
            password_min_length: body.password_min_length,
            max_login_attempts: body.max_login_attempts,
            lockout_duration_minutes: body.lockout_duration_minutes,
            session_timeout_minutes: body.session_timeout_minutes,
            maintenance_mode: body.maintenance_mode,
        };

        const updateData = Object.fromEntries(
            Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
        ) as Partial<typeof systemSettings.$inferInsert>;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
        }

        await db
            .update(systemSettings)
            .set({ ...updateData, updated_at: new Date() })
            .where(eq(systemSettings.company_id, Number(id)));

        return NextResponse.json({
            message: "Settings updated",
            updatedFields: Object.keys(updateData),
        });
    } catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            notFound();
        }
        console.error("[PATCH /api/system_settings]", err);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}