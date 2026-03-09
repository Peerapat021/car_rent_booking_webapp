export async function putUser(data: {
    id: string | number,
    name: string,
    birth_date: string,
    email: string,
    password?: string,
    user_role: string,
    user_phone?: string,
    user_driver_license?: string,
    user_id_card?: string,
    user_driver_license_expiry?: string,
    user_address?: string,
    branch_id?: number | null,
    user_blacklist?: boolean
}) {
    const res = await fetch(`/api/admin/users/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้");
    }

    return res.json();
}
