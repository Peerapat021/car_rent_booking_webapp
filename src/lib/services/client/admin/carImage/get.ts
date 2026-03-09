export async function getCarImages(carId?: number) {
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/carImage`;

    const url = carId
        ? `${baseUrl}?car_id=${carId}`
        : baseUrl;

    const res = await fetch(url, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch car images: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

export async function getCarImageById(id: number) {
    if (!id) {
        throw new Error("image id is required");
    }

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/car-images/${id}`;

    const res = await fetch(url, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(
            `Failed to fetch car image: ${res.status} ${res.statusText}`
        );
    }

    return res.json();
}
