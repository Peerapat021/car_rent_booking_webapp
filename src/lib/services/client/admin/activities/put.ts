export async function putActivity(id: number, formData: FormData) {
    const res = await fetch(`/api/admin/activities/${id}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "แก้ไขกิจกรรมไม่สำเร็จ");
    }

    return await res.json();
}