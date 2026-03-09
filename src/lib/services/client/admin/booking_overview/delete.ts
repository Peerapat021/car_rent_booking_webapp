const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function deleteBooking(booking_id: number) {
  const res = await fetch(
    `${BASE_URL}/api/admin/booking_overview?id=${booking_id}`,
    {
      method: "DELETE",
    }
  );

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "Failed to delete booking");
  }

  return result;
}