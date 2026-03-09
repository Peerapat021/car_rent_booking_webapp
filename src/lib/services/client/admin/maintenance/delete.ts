
export async function deleteMaintenance(id: string) {
    const res = await fetch(`/api/admin/maintenance/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลการบำรุงรักษาได้");
    }

    return res.json();
}