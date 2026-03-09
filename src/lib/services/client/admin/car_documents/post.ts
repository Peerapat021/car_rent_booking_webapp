



export async function postCarDocument(formData: FormData) {
    const res = await fetch(`/api/admin/car_documents`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถเพิ่มข้อมูลเอกสารได้");
    }

    return res.json();
}
