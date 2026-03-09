export async function getCouponUsages() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/coupon_usages`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch coupon usages');
    }
    return res.json();
}