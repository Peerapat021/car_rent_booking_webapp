export async function updateSystemSettings(id: number, data: Record<string, any>) {
    const res = await fetch(`/api/admin/system_settings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Update failed");
    }

    return res.json();
}