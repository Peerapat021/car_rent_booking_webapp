

export async function getPromotionCars() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/promotionCars`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch promotion cars');
    }
    return res.json();
}