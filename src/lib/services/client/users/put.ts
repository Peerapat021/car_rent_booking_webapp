export async function putUserProfile(data: {
    id: string | number;
    name: string;
    email: string;
    user_phone?: string | null;
    user_role: string;
}) {
    const res = await fetch(`/api/users/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "ไม่สามารถบันทึกข้อมูลได้");
    }

    return res.json();
}
