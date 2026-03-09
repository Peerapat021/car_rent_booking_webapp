// lib/services/activities/post.ts
export async function postActivity(formData: FormData) {
    const res = await fetch("/api/admin/activities", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "เพิ่มกิจกรรมไม่สำเร็จ");
    }

    return await res.json();
}