


export async function deleteCarImage(id: string, imageUrl: string) {
    const res = await fetch(`/api/admin/carImage/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลรูปภาพรถได้");
    }

    return res.json();
}