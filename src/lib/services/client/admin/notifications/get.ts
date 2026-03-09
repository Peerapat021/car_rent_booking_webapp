
export async function getNotifications() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/notifications`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch notifications');
    }
    return res.json();
}