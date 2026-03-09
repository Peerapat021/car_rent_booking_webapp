
export async function putPayment(
  data: { payment_id: string } & Partial<{
    payment_amount: string;
    payment_method: string;
    payment_status: string;
    paid_at: string | null;
  }>
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/payments/${data.payment_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("ไม่สามารถอัปเดตข้อมูลการชำระเงินได้");
  }

  return res.json();
}