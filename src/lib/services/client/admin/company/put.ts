// lib/services/company/put.ts

export async function putCompany(data: {
    id: string;
    company_name?: string;
    company_description?: string | null;
    company_phone?: string | null;
    company_email?: string | null;
    company_address?: string | null;
    website_url?: string | null;
    map_url?: string | null;
    business_hours?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    line_id?: string | null;
    tax_id?: string | null;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    promptpay_id?: string | null;

    // ไฟล์ใหม่ (optional)
    logoFile?: File | null;           // โลโก้บริษัท
    promptpayQrFile?: File | null;    // QR Code PromptPay
    is_active?: boolean;
}) {
    const { id, logoFile, promptpayQrFile, ...formFields } = data;

    const formData = new FormData();

    // เพิ่มข้อมูล text ทั้งหมด
    Object.entries(formFields).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            // ส่งเป็น string ว่าง หรือไม่ส่งก็ได้ (ขึ้นกับ backend)
            formData.append(key, "");
        } else {
            formData.append(key, String(value));
        }
    });

    // เพิ่มไฟล์โลโก้ (ถ้ามี)
    if (logoFile) {
        formData.append("logo", logoFile); // ต้องตรงกับชื่อใน API: formData.get("logo")
    }

    // เพิ่มไฟล์ PromptPay QR (ถ้ามี)
    if (promptpayQrFile) {
        formData.append("promptpay_qr", promptpayQrFile);
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/company/${id}`, {
        method: "PUT",
        body: formData,
        // สำคัญ: ห้ามตั้ง Content-Type มือ! ให้ browser ตั้งเองเป็น multipart/form-data
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "ไม่สามารถอัปเดตข้อมูลบริษัทได้");
    }

    return await res.json();
}