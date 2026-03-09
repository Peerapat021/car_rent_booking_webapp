export async function postUser(data: {
    name: string;
    birth_date?: string | null;
    email: string;
    password: string;
    user_role: "customer" | "staff" | "admin";
    user_phone?: string | null;
    user_driver_license?: string | null;
    user_id_card?: string | null;
    user_driver_license_expiry?: string | null;
    user_address?: string | null;
    branch_id?: number | null;
    user_blacklist?: boolean;
}) {
    const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "ไม่สามารถเพิ่มข้อมูลผู้ใช้ได้");
    }

    return res.json();
}