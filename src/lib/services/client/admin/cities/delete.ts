
export async function deleteCity(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/cities/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Failed to delete city');
    }
    return res.json();
}