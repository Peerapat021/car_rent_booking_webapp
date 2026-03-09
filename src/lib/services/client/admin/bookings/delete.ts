/* ======================= DELETE ======================= */
export async function deleteBooking(id: string) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถลบข้อมูลการจองได้");
    }

    return res.json();
}


/* ======================= CANCEL ======================= */
export async function cancelBooking(id: number) {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "cancelled",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Cancel error:", err);
    throw new Error("Cancel booking failed");
  }

  return res.json();
}
