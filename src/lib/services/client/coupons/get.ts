export async function getCoupons() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/coupons`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch coupons');
    }
    return res.json();
}

export async function getCouponById(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/coupons/${id}`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch coupons');
    }
    return res.json();
}
