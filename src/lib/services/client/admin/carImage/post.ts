// lib/services/carImage/post.ts
export async function postCarImages(formData: FormData) {
    const res = await fetch("/api/admin/carImage", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "เพิ่มรูปภาพรถไม่สำเร็จ");
    }

    return await res.json();
}