

export async function postBranches(formData: FormData) {
    const res = await fetch(`/api/admin/branches`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "ไม่สามารถเพิ่มสาขาได้");
    }

    return res.json();
}