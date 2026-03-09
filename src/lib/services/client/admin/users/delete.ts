

export async function deleteUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลผู้ใช้ได้");
    }

    return res.json();
}