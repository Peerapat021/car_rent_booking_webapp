

export async function deleteCarClasses(id: string) {
    const res = await fetch(`/api/admin/car_classes/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลได้");
    }

    return res.json();
}