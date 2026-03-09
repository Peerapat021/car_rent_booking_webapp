

export async function getMaintenance(carId?: number) {
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/maintenance`;

    const url = carId 
        ? `${baseUrl}?car_id=${carId}` 
        : baseUrl;

    const res = await fetch(url, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch maintenance: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

export async function getMaintenanceById(id: number) {
    if (!id) {
        throw new Error("maintenance id is required");
    }

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/maintenance/${id}`;

    const res = await fetch(url, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(
            `Failed to fetch maintenance: ${res.status} ${res.statusText}`
        );
    }

    return res.json();
}
