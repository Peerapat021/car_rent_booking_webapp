
export async function getCarDocuments(carId?: number) {
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/car_documents`;

    const url = carId
        ? `${baseUrl}?car_id=${carId}`
        : baseUrl;

    const res = await fetch(url, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch car documents: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

export async function getCarDocumentsById(id: number) {
    if (!id) {
        throw new Error("car document id is required");
    }

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/car-documents/${id}`;

    const res = await fetch(url, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(
            `Failed to fetch car document: ${res.status} ${res.statusText}`
        );
    }

    return res.json();
}
