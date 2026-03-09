export async function getActivities() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/activities`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch activities');
    }
    return res.json();
}

export async function getActivityById(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/activities/${id}`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch activity');
    }
    return res.json();
}
