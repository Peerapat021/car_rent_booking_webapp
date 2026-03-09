const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function createBooking(data: {
  user_id: number;
  car_id: number;

  booking_start_date: string;
  booking_end_date: string;

  pickup_datetime?: string | null;
  expected_return_datetime?: string | null;

  deposit_amount: number;
  rental_amount: number;

  discount_coupon?: number;
  discount_promo?: number;
  total_discount?: number;

  booking_total_price: number;
}) {
  const res = await fetch(`${BASE_URL}/api/admin/booking_overview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "Failed to create booking");
  }

  return result;
}