export async function postMaintenance(formData: FormData) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/maintenance`,
        {
            method: "POST",
            body: formData,  // ไม่ต้อง set Content-Type เอง (browser จะจัดการ multipart)
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "ไม่สามารถเพิ่มการบำรุงรักษาได้");
    }

    return res.json();
}