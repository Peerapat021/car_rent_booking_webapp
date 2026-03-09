

export async function cancelBooking(id: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            status: "cancelled",
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("Cancel error:", err);
        throw new Error("Cancel booking failed");
    }

    return res.json();
}
