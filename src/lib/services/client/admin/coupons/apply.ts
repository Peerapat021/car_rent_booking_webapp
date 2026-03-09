export async function applyCoupon({
    couponCode,
    bookingAmount,
}: {
    couponCode: string;
    bookingAmount: number | string;
}) {
    try {
        const formData = new FormData();
        formData.append("coupon_code", couponCode.trim().toUpperCase());
        formData.append("booking_amount", String(bookingAmount));

        const response = await fetch("/api/admin/coupons/apply-coupons", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        // throw เฉพาะ server crash
        if (response.status >= 500) {
            throw new Error(result.message || "Server error");
        }

        // business result
        return {
            ok: result.success,
            message: result.message,
            coupon: result.coupon,
            calculated_discount: result.calculated_discount,
            final_amount: result.final_amount,
        };

    } catch (error: any) {
        console.error("Apply coupon service error:", error);
        throw new Error(
            error.message || "เกิดข้อผิดพลาดในการใช้คูปอง"
        );
    }
}
