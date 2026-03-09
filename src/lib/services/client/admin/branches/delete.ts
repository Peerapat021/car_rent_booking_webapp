

export async function deleteBranches(id: string) {
    const res = await fetch(`/api/admin/branches/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลได้");
    }

    return res.json();
}