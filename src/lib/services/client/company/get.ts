
export async function getCompany() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/company`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch bookings');
    }
    return res.json();
}