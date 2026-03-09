

export async function getCarClasses() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/car_classes`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Failed to fetch car_classes');
    }
    return res.json();
}

export async function getCarClassesById(class_id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/car_classes/${class_id}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error("Failed to fetch class");
    }

    return res.json();
}

