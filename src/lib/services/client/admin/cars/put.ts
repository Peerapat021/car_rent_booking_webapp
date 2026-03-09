// lib/services/cars/put.ts
export async function putCar(carId: number, formData: FormData) {
    const res = await fetch(`/api/admin/cars/${carId}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "แก้ไขรถไม่สำเร็จ");
    }

    return await res.json();
}