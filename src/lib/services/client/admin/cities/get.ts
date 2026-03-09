export async function getCities() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/cities`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch cities');
    }
    return res.json();
}

export async function getCityById(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cities/${id}`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch city');
    }
    return res.json();
}