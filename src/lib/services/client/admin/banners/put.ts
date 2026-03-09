
export async function putBanner(id: number, formData: FormData) {
    const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "แก้ไขแบนเนอร์ไม่สำเร็จ");
    }

    return await res.json();
}