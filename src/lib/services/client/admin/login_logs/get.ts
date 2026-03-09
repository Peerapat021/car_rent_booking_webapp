export async function getLoginLogs() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/login_logs`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch login logs');
    }
    return res.json();
}