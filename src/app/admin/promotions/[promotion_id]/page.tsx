// src/app/admin/promotions/[promotion_id]/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getPromotionById } from "@/lib/services/client/admin/promotions/get"; // สมมติว่ามีฟังก์ชันนี้ (single promotion)
import { postPromotion } from "@/lib/services/client/admin/promotions/post";
import { putPromotion } from "@/lib/services/client/admin/promotions/put";

interface PromotionForm {
    promo_code: string;
    discount_type: "percent" | "fixed";
    discount_value: string;
    promo_start: string;
    promo_end: string;
    promo_status: "active" | "inactive";
    // เพิ่ม field อื่น ๆ ถ้ามี เช่น max_discount_amount, min_purchase, etc.
}

export default function PromotionFormPage() {
    const router = useRouter();
    const params = useParams();
    const promotionId = params.promotion_id as string;
    const isNew = promotionId === "new";

    const [form, setForm] = useState<PromotionForm>({
        promo_code: "",
        discount_type: "percent",
        discount_value: "",
        promo_start: "",
        promo_end: "",
        promo_status: "active",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(!isNew);

    useEffect(() => {
        if (!isNew) {
            const loadPromotion = async () => {
                try {
                    const promo = await getPromotionById(Number(promotionId));
                    console.log("Loaded promotion:", promo); // debug

                    setForm({
                        promo_code: promo.promo_code || "",
                        discount_type: promo.discount_type || "percent",
                        discount_value: promo.discount_value?.toString() || "",
                        promo_start: promo.promo_start ? promo.promo_start.slice(0, 16) : "", // สำหรับ input datetime-local
                        promo_end: promo.promo_end ? promo.promo_end.slice(0, 16) : "",
                        promo_status: promo.promo_status || "active",
                    });
                } catch (err: any) {
                    setError("ไม่สามารถโหลดข้อมูลโปรโมชั่นได้");
                    console.error(err);
                } finally {
                    setIsDataLoading(false);
                }
            };
            loadPromotion();
        } else {
            setIsDataLoading(false);
        }
    }, [isNew, promotionId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // แปลงวันที่เป็น timestamp
        const payload: any = {
            promo_code: form.promo_code,
            discount_type: form.discount_type,
            discount_value: form.discount_value,
            promo_start: form.promo_start ? new Date(form.promo_start).getTime() : null,
            promo_end: form.promo_end ? new Date(form.promo_end).getTime() : null,
            promo_status: form.promo_status,
        };

        // ✅ ส่ง promo_id เฉพาะตอนแก้ไขเท่านั้น
        if (!isNew) {
            payload.promo_id = Number(promotionId);
        }

        try {
            if (isNew) {
                await postPromotion(payload);
                alert("สร้างโปรโมชั่นสำเร็จ!");
            } else {
                const confirmed = confirm("คุณต้องการบันทึกการแก้ไขโปรโมชั่นนี้หรือไม่?");
                if (!confirmed) {
                    setLoading(false);
                    return;
                }

                await putPromotion(Number(promotionId), payload);
                alert("แก้ไขโปรโมชั่นสำเร็จ!");
            }

            router.push("/admin/promotions");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                        <FaArrowLeft /> กลับไปหน้ารายการ
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {isNew ? "เพิ่มโปรโมชั่นใหม่" : `แก้ไขโปรโมชั่น: ${form.promo_code || promotionId}`}
                    </h1>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 lg:p-8">

                    {/* โค้ดโปรโมชั่น */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            โค้ดโปรโมชั่น <span className="text-red-600">*</span>
                        </label>
                        <input
                            name="promo_code"
                            value={form.promo_code}
                            onChange={handleChange}
                            required
                            disabled={isDataLoading}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition disabled:bg-gray-100 dark:disabled:bg-gray-700"
                            placeholder="เช่น PROMO2026"
                        />
                    </div>

                    {/* ประเภท + มูลค่า */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                ประเภทส่วนลด <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="discount_type"
                                value={form.discount_type}
                                onChange={handleChange}
                                required
                                disabled={isDataLoading}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition disabled:bg-gray-100 dark:disabled:bg-gray-700"
                            >
                                <option value="percent">เปอร์เซ็นต์ (%)</option>
                                <option value="fixed">จำนวนเงินคงที่ (บาท)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                มูลค่าส่วนลด <span className="text-red-600">*</span>
                            </label>
                            <input
                                name="discount_value"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.discount_value}
                                onChange={handleChange}
                                required
                                disabled={isDataLoading}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition disabled:bg-gray-100 dark:disabled:bg-gray-700"
                                placeholder={form.discount_type === "percent" ? "เช่น 20" : "เช่น 500"}
                            />
                        </div>
                    </div>

                    {/* วันที่เริ่ม - สิ้นสุด */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                วันที่และเวลาเริ่มโปรโมชั่น
                            </label>
                            <input
                                name="promo_start"
                                type="datetime-local"
                                value={form.promo_start}
                                onChange={handleChange}
                                disabled={isDataLoading}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition disabled:bg-gray-100 dark:disabled:bg-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                วันที่และเวลา สิ้นสุดโปรโมชั่น
                            </label>
                            <input
                                name="promo_end"
                                type="datetime-local"
                                value={form.promo_end}
                                onChange={handleChange}
                                disabled={isDataLoading}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition disabled:bg-gray-100 dark:disabled:bg-gray-700"
                            />
                        </div>
                    </div>

                    {/* สถานะ */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="promo_status"
                            id="promo_status"
                            checked={form.promo_status === "active"}
                            onChange={(e) => setForm(prev => ({
                                ...prev,
                                promo_status: e.target.checked ? "active" : "inactive"
                            }))}
                            disabled={isDataLoading}
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                        />
                        <label htmlFor="promo_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            เปิดใช้งานโปรโมชั่นนี้ (Active)
                        </label>
                    </div>

                    {/* ปุ่ม */}
                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            disabled={loading || isDataLoading}
                            className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isDataLoading}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <FaSave />
                            {loading ? "กำลังบันทึก..." : isNew ? "สร้างโปรโมชั่น" : "บันทึกการแก้ไข"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}