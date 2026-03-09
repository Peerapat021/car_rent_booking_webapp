const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function updateBooking(data: {
  booking_id: number;

  booking_start_date?: string;
  booking_end_date?: string;

  pickup_datetime?: string | null;
  expected_return_datetime?: string | null;
  actual_return_datetime?: string | null;

  deposit_amount?: number;
  rental_amount?: number;
  late_fee?: number;
  damage_fee?: number;
  insurance_deducted?: number;
  insurance_refund_amount?: number;

  discount_coupon?: number;
  discount_promo?: number;
  total_discount?: number;

  booking_total_price?: number;
  booking_status?: string;
  internal_note?: string;
  special_request?: string;

  force_pickup_notification?: boolean;
}) {
  const res = await fetch(`${BASE_URL}/api/admin/booking_overview`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "Failed to update booking");
  }

  return result;
}