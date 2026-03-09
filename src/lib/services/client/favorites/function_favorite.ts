// ===============================
// GET
// ===============================
export async function getFavorites() {
    const res = await fetch("/api/favorites", {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch favorites");
    }

    return res.json();
}


// ===============================
// POST
// ===============================
export async function postFavorite(carId: string | number) {
    const res = await fetch("/api/favorites", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ car_id: Number(carId) }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to add favorite");
    }

    return data;
}


// ===============================
// DELETE
// ===============================
export async function deleteFavorite(carId: string | number) {
    const res = await fetch("/api/favorites", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ car_id: Number(carId) }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to delete favorite");
    }

    return data;
}