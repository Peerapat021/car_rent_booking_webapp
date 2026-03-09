export async function putCity(id: number, formData: FormData) {
    const res = await fetch(`/api/admin/cities/${id}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "แก้ไขเมืองไม่สำเร็จ");   
    }

    return await res.json();
}