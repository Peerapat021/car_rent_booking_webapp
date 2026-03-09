// lib/services/carImage/put.ts
export async function putCarImages(carId: number, formData: FormData) {
    const res = await fetch(`/api/admin/carImage/${carId}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "แก้ไขรูปภาพรถไม่สำเร็จ");
    }

    return await res.json();
}