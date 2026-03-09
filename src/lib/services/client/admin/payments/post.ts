// lib/services/payments/post.ts

type UIPaymentMethod = 'promptpay' | 'credit' | 'transfer';  // ยังคงไว้ถ้าต้องการใช้ภายหลัง

export type PaymentCreateData = {
    booking_id?: number;
    payment_amount: number;
    payment_method: 'cash' | 'qr' | 'credit_card';
    payment_type: 'deposit' | 'full' | 'insurance' | 'remaining' | 'extra' | 'refund';
    payment_status?: 'paid' | 'pending' | 'refunded';
    paid_at?: string;
    payment_note?: string;

    // เพิ่ม field นี้เพื่อบอก backend ว่าเป็นการชำระตอนรับรถจริงหรือไม่
    is_pickup_payment?: boolean;
};

export async function postPayment(data: PaymentCreateData) {
    const res = await fetch(`/api/admin/payments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "ไม่สามารถบันทึกการชำระเงินได้");
    }

    return await res.json();
}