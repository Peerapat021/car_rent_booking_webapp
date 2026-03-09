"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * บันทึก car_id ลง localStorage เมื่อผู้ใช้เข้าดูหน้ารายละเอียดรถ
 * เก็บสูงสุด 10 คัน เรียงจากล่าสุดไปเก่าสุด
 * แยกประวัติตาม user_id (ถ้า login แล้ว)
 */
export default function SaveLastViewed() {
    const params = useParams();
    const { data: session } = useSession();
    const carId = Number(
        Array.isArray(params.car_id) ? params.car_id[0] : params.car_id
    );

    useEffect(() => {
        if (!carId || Number.isNaN(carId)) return;

        try {
            const userId = session?.user?.id || "guest";
            const KEY = `lastViewedCars_${userId}`;
            const prev: number[] = JSON.parse(localStorage.getItem(KEY) || "[]");
            const updated = [carId, ...prev.filter((id) => id !== carId)].slice(0, 10);
            localStorage.setItem(KEY, JSON.stringify(updated));
        } catch { }
    }, [carId, session]);

    return null;
}
