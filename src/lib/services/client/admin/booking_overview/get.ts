
export async function getBookingOverview() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/booking_overview`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch booking_overview');
    }
    return res.json();
}

export async function getBookingOverviewById(bookingId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/booking_overview?id=${bookingId}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch booking_overview by id');
  }

  return res.json();
}
