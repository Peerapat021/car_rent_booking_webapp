


export async function deleteCarDocument(id: string) {
    const res = await fetch(`/api/admin/car_documents/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลเอกสารได้");
    }

    return res.json();
}