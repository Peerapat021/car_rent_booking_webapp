



export async function getBranches() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/branches`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch branches');
    }
    return res.json();
}