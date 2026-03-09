
export async function postPromotionCar(data: { promo_id: number; car_id: number }) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/promotionCars`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to create promotion car');
    }
    return res.json();
}