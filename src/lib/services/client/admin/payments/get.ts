
export async function getPayments() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/payments`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch payments');
    }
    return res.json();
}

