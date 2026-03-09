

export async function getBookings() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bookings`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch bookings');
    }
    return res.json();
}

export async function getBookingById(booking_id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bookings/${booking_id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error("Failed to fetch booking");
  }

  return res.json();
}
