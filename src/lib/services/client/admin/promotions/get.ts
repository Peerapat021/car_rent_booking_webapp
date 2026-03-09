export async function getPromotions() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/promotions`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch promotions');
    }
    return res.json();
}

export async function getPromotionById(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/promotions/${id}`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch promotions');
    }
    return res.json();
}
