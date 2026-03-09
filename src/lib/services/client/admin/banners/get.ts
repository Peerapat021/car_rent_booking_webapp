export async function getBanners() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/banners`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch banners');
    }
    return res.json();
}

export async function getBannerById(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/banners/${id}`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch banner');
    }
    return res.json();
}
