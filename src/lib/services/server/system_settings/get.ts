import { db } from "@/lib/db";
import { systemSettings, company } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type SystemSettingsWithCompany = {
    company: {
        company_id: number;
        company_name: string;
        company_logo: string | null;
        company_phone: string | null;
        company_email: string | null;
        company_description: string | null;
        company_address: string | null;
        tax_id: string | null;
        bank_name: string | null;
        bank_account_name: string | null;
        bank_account_number: string | null;
        promptpay_id: string | null;
        promptpay_qr: string | null;
        website_url: string | null;
    } | null;
    settings: {
        company_id: number;
        require_id_card: boolean;
        require_driver_license: boolean;
        allow_extension: boolean;
        enforce_deposit: boolean;
        full_to_full_policy: boolean;
        min_renter_age: number;
        default_deposit_amount: string; // decimal → string ใน JSON
        late_fee_per_hour: string;
        cancellation_fee: string;
        no_show_fee: string;
        require_pickup_photos: boolean;
        require_return_photos: boolean;
        min_photo_count: number;
        auto_approve_return: boolean;
        require_insurance: boolean;
        maintenance_alert_km: number;
        insurance_alert_days: number;
        tax_alert_days: number;
        enable_cash: boolean;
        enable_credit_card: boolean;
        enable_qr_promptpay: boolean;
        enable_bank_transfer: boolean;
        auto_generate_invoice: boolean;
        vat_percent: string;
        password_min_length: number;
        max_login_attempts: number;
        lockout_duration_minutes: number;
        session_timeout_minutes: number;
        maintenance_mode: boolean;
        updated_at: Date;
    };
};

const DEFAULT_SETTINGS = {
    require_id_card: true,
    require_driver_license: true,
    allow_extension: true,
    enforce_deposit: true,
    full_to_full_policy: true,
    min_renter_age: 18,
    default_deposit_amount: "5000.00",
    late_fee_per_hour: "100.00",
    cancellation_fee: "500.00",
    no_show_fee: "1000.00",
    require_pickup_photos: true,
    require_return_photos: true,
    min_photo_count: 4,
    auto_approve_return: false,
    require_insurance: true,
    maintenance_alert_km: 5000,
    insurance_alert_days: 30,
    tax_alert_days: 30,
    enable_cash: true,
    enable_credit_card: true,
    enable_qr_promptpay: true,
    enable_bank_transfer: true,
    auto_generate_invoice: true,
    vat_percent: "7.00",
    password_min_length: 8,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    session_timeout_minutes: 60,
    maintenance_mode: false,
} as const;

export async function getSystemSettings(companyId: number): Promise<SystemSettingsWithCompany> {
    const rows = await db
        .select({
            company_id: company.company_id,
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

            // settings fields...
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
        .where(eq(systemSettings.company_id, companyId))
        .limit(1);

    if (rows.length === 0) {
        await db.insert(systemSettings).values({
            company_id: companyId,
            ...DEFAULT_SETTINGS,
        });

        // recursive call หรือ query ใหม่
        return getSystemSettings(companyId);
    }

    const r = rows[0];

    return {
        company: r.company_name
            ? {
                company_id: r.company_id!,
                company_name: r.company_name,
                company_logo: r.company_logo,
                company_phone: r.company_phone,
                company_email: r.company_email,
                company_description: r.company_description,
                company_address: r.company_address,
                tax_id: r.tax_id,
                bank_name: r.bank_name,
                bank_account_name: r.bank_account_name,
                bank_account_number: r.bank_account_number,
                promptpay_id: r.promptpay_id,
                promptpay_qr: r.promptpay_qr,
                website_url: r.website_url,
            }
            : null,

        settings: {
            company_id: companyId,

            require_id_card: r.require_id_card ?? DEFAULT_SETTINGS.require_id_card,
            require_driver_license:
                r.require_driver_license ?? DEFAULT_SETTINGS.require_driver_license,
            allow_extension:
                r.allow_extension ?? DEFAULT_SETTINGS.allow_extension,
            enforce_deposit:
                r.enforce_deposit ?? DEFAULT_SETTINGS.enforce_deposit,
            full_to_full_policy:
                r.full_to_full_policy ?? DEFAULT_SETTINGS.full_to_full_policy,
            min_renter_age:
                r.min_renter_age ?? DEFAULT_SETTINGS.min_renter_age,
            default_deposit_amount:
                r.default_deposit_amount ?? DEFAULT_SETTINGS.default_deposit_amount,
            late_fee_per_hour:
                r.late_fee_per_hour ?? DEFAULT_SETTINGS.late_fee_per_hour,
            cancellation_fee:
                r.cancellation_fee ?? DEFAULT_SETTINGS.cancellation_fee,
            no_show_fee:
                r.no_show_fee ?? DEFAULT_SETTINGS.no_show_fee,
            require_pickup_photos:
                r.require_pickup_photos ?? DEFAULT_SETTINGS.require_pickup_photos,
            require_return_photos:
                r.require_return_photos ?? DEFAULT_SETTINGS.require_return_photos,
            min_photo_count:
                r.min_photo_count ?? DEFAULT_SETTINGS.min_photo_count,
            auto_approve_return:
                r.auto_approve_return ?? DEFAULT_SETTINGS.auto_approve_return,
            require_insurance:
                r.require_insurance ?? DEFAULT_SETTINGS.require_insurance,
            maintenance_alert_km:
                r.maintenance_alert_km ?? DEFAULT_SETTINGS.maintenance_alert_km,
            insurance_alert_days:
                r.insurance_alert_days ?? DEFAULT_SETTINGS.insurance_alert_days,
            tax_alert_days:
                r.tax_alert_days ?? DEFAULT_SETTINGS.tax_alert_days,
            enable_cash:
                r.enable_cash ?? DEFAULT_SETTINGS.enable_cash,
            enable_credit_card:
                r.enable_credit_card ?? DEFAULT_SETTINGS.enable_credit_card,
            enable_qr_promptpay:
                r.enable_qr_promptpay ?? DEFAULT_SETTINGS.enable_qr_promptpay,
            enable_bank_transfer:
                r.enable_bank_transfer ?? DEFAULT_SETTINGS.enable_bank_transfer,
            auto_generate_invoice:
                r.auto_generate_invoice ?? DEFAULT_SETTINGS.auto_generate_invoice,
            vat_percent:
                r.vat_percent ?? DEFAULT_SETTINGS.vat_percent,
            password_min_length:
                r.password_min_length ?? DEFAULT_SETTINGS.password_min_length,
            max_login_attempts:
                r.max_login_attempts ?? DEFAULT_SETTINGS.max_login_attempts,
            lockout_duration_minutes:
                r.lockout_duration_minutes ??
                DEFAULT_SETTINGS.lockout_duration_minutes,
            session_timeout_minutes:
                r.session_timeout_minutes ??
                DEFAULT_SETTINGS.session_timeout_minutes,
            maintenance_mode:
                r.maintenance_mode ?? DEFAULT_SETTINGS.maintenance_mode,

            updated_at: r.updated_at!,
        },
    };

}