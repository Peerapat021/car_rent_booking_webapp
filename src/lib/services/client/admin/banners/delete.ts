
export async function deleteBanner(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/banners/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Failed to delete banner');
    }
    return res.json();
}