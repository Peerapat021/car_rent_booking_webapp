// lib/services/car_documents/put.ts

export async function putCarDocument(formData: FormData) {
    const res = await fetch(`/api/admin/car_documents/${formData.get('car_doc_id')}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "แก้ไขเอกสารไม่สำเร็จ");
    }

    return await res.json();
}