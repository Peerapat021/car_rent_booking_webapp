

export async function getFavorites() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/favorites`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch favorites');
    }
    return res.json();
}