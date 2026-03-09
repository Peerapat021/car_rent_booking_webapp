// src/lib/services/client/admin/booking_overview/return.ts

interface ReturnBookingData {
    actual_return_datetime?: string;
    damage_fee?: number;
    late_fee?: number;
    expected_return_datetime?: string;
    insurance_deducted?: number;
    insurance_refund_amount?: number;
}

export async function returnBooking(
    booking_id: number,
    data: ReturnBookingData = {}
) {
    try {
        const response = await fetch(`/api/admin/booking_overview/${booking_id}/return`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            credentials: "include",
        });

        if (!response.ok) {
            let errorMessage = `การคืนรถล้มเหลว (${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage += errorData.error ? `: ${errorData.error}` : "";
            } catch {

                errorMessage += `: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("returnBooking failed:", error);
        throw error;
    }
}