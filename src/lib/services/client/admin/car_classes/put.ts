export async function putCarClasses(
    id: number | string,
    data: {
        class_code: string;
        class_name: string;
        class_description?: string;
        sort_order?: number;
        is_active?: boolean;  // boolean เท่านั้น!
    }
) {
    const res = await fetch(`/api/admin/car_classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "ไม่สามารถอัปเดตคลาสรถได้");
    }

    return res.json();
}