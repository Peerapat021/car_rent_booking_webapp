// lib/services/cars/post.ts
export async function postCar(formData: FormData) {
    const res = await fetch("/api/admin/cars", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "เพิ่มรถไม่สำเร็จ");
    }

    return await res.json();
}