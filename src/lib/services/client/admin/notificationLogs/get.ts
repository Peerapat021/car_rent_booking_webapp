export async function getNotificationLogs() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/notificationLogs`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch notification logs');
    }
    return res.json();
}