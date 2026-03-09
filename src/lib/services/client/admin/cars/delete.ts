


export async function deleteCar(id: string) {
    const res = await fetch(`/api/admin/cars/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลรถได้");
    }

    return res.json();
}