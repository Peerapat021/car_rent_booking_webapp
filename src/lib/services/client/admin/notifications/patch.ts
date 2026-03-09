export async function patchNotification(id: number) {
    const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "PATCH",
    });

    if (!response.ok) {
        throw new Error("patch failed");
    }

    return await response.json();
}

export async function patchAllNotifications() {
    const response = await fetch(
        "/api/admin/notifications/mark-all-read",
        {
            method: "PATCH",
        }
    );

    if (!response.ok) {
        throw new Error("patch all failed");
    }

    return await response.json();
}
