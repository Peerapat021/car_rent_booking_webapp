

export async function getUsers() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch users');
    }
    return res.json();
}