export async function postCarClasses(data: {
    class_code: string;
    class_name: string;
    class_description?: string | null;
    sort_order?: number;
    is_active?: boolean;  // เปลี่ยนเป็น boolean!
}) {
    const res = await fetch(`/api/admin/car_classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...data,
            is_active: data.is_active ?? true, // default เปิดใช้งาน
        }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "ไม่สามารถเพิ่มคลาสรถได้");
    }

    return res.json();
}