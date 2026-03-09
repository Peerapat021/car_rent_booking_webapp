


export async function getCarClasses() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/car_classes`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch car classes');
    }
    return res.json();
}