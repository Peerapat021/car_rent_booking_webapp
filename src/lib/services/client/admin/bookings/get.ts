export interface PickupBooking {
  booking_id: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  special_request: string;
  internal_note: string;
  booking_start_date: string;
  booking_end_date: string;
  car_brand: string;
  car_model: string;
  car_license_plate: string;
  class_name: string;
  booking_total_price: string;
  deposit_amount: string;
  car_id?: number;
}

/* ======================= GET LIST ======================= */
export async function getBookings() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/bookings`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch bookings');
  }
  return res.json();
}

/* ======================= GET BY ID ======================= */
export async function getBookingById(booking_id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/bookings/${booking_id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error("Failed to fetch booking");
  }

  return res.json();
}

export async function searchPickupBookings(search: string): Promise<PickupBooking[]> {
  if (!search.trim()) return [];

  const res = await fetch(`/api/bookings/pickup?search=${encodeURIComponent(search)}`);

  if (!res.ok) {
    throw new Error("ไม่สามารถค้นหาการจองได้");
  }

  return await res.json();
}