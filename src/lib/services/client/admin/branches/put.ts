

export async function putBranches(id: number | string, formData: FormData) {
    const res = await fetch(`/api/admin/branches/${id}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "ไม่สามารถอัปเดตสาขาได้");
    }

    return res.json();
}