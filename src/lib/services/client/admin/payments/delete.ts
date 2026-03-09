
export async function deletePayment(id: string) {
    const res = await fetch(`/api/admin/payments/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลการชำระเงินได้");
    }

    return res.json();
}