
export async function getPopularCars() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/popular`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch popular cars');
    }
    return res.json();
}
