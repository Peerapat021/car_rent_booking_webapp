



export async function getCompany() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/company`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch company');
    }
    return res.json();
}