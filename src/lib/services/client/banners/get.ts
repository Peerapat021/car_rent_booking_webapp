
export async function getBanners() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/banners`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch banners');
    }
    return res.json();
}