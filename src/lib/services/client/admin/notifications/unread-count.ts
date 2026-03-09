
export async function getUnreadCount() {
    const res = await fetch("/api/admin/notifications/unread-count");

    if (!res.ok) throw new Error();

    return res.json();
}
