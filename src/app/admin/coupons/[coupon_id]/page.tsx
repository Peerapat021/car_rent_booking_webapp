// src/app/admin/coupons/[coupon_id]/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getCouponById } from "@/lib/services/client/admin/coupons/get";
import { postCoupon } from "@/lib/services/client/admin/coupons/post";
import { putCoupon } from "@/lib/services/client/admin/coupons/put";

interface CouponFormData {
    coupon_code: string;
    discount_type: "percent" | "fixed";
    discount_value: string;
    max_discount_amount: string;
    min_booking_amount: string;
    usage_limit: string;
    usage_limit_per_user: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export default function CouponFormPage() {
    const router = useRouter();
    const params = useParams();
    const couponId = params.coupon_id as string;
    const isNew = couponId === "new";

    const [formData, setFormData] = useState<CouponFormData>({
        coupon_code: "",
        discount_type: "percent",
        discount_value: "",
        max_discount_amount: "",
        min_booking_amount: "",
        usage_limit: "",
        usage_limit_per_user: "",
        start_date: "",
        end_date: "",
        is_active: true,
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isNew) {
            const fetchCoupon = async () => {
                try {
                    const coupon = await getCouponById(Number(couponId));
                    setFormData({
                        coupon_code: coupon.coupon_code || "",
                        discount_type: coupon.discount_type || "percent",
                        discount_value: coupon.discount_value || "",
                        max_discount_amount: coupon.max_discount_amount || "",
                        min_booking_amount: coupon.min_booking_amount || "",
                        usage_limit: coupon.usage_limit?.toString() || "",
                        usage_limit_per_user: coupon.usage_limit_per_user?.toString() || "",
                        start_date: coupon.start_date ? coupon.start_date.slice(0, 10) : "",
                        end_date: coupon.end_date ? coupon.end_date.slice(0, 10) : "",
                        is_active: coupon.is_active ?? true,
                    });
                    if (coupon.coupon_image) {
                        setImagePreview(coupon.coupon_image);
                    }
                } catch (err: any) {
                    setError("ไม่สามารถโหลดข้อมูลคูปองได้");
                    console.error(err);
                }
            };
            fetchCoupon();
        }
    }, [isNew, couponId]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            submitData.append(key, value.toString());
        });
        if (imageFile) submitData.append("file", imageFile);

        try {
            if (isNew) {
                await postCoupon(submitData);
                alert("เพิ่มคูปองสำเร็จ!");
            } else {
                const confirmed = confirm("คุณต้องการบันทึกการแก้ไขคูปองนี้หรือไม่?");
                if (!confirmed) {
                    setLoading(false);
                    return;
                }
                await putCoupon(Number(couponId), submitData);
                alert("แก้ไขคูปองสำเร็จ!");
            }
            router.push("/admin/coupons");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl"> {/* ปรับจาก max-w-3xl เป็น max-w-5xl เพื่อกว้างขึ้น พอดีจอคอม */}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                        <FaArrowLeft /> กลับไปหน้ารายการ
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {isNew ? "เพิ่มคูปองใหม่" : `แก้ไขคูปอง: ${formData.coupon_code || couponId}`}
                    </h1>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 lg:p-8">

                    {/* โค้ดคูปอง */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            โค้ดคูปอง <span className="text-red-600">*</span>
                        </label>
                        <input
                            name="coupon_code"
                            value={formData.coupon_code}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            placeholder="เช่น SUMMER2025"
                        />
                    </div>

                    {/* ประเภทส่วนลด + มูลค่าส่วนลด (วางคู่กันให้สมส่วน) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                ประเภทส่วนลด <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="discount_type"
                                value={formData.discount_type}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
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
                                value={formData.discount_value}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                                placeholder={formData.discount_type === "percent" ? "เช่น 15" : "เช่น 200"}
                            />
                        </div>
                    </div>

                    {/* ส่วนลดสูงสุด (เฉพาะ %) */}
                    {formData.discount_type === "percent" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                ส่วนลดสูงสุด (บาท)
                            </label>
                            <input
                                name="max_discount_amount"
                                type="number"
                                step="0.01"
                                value={formData.max_discount_amount}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                                placeholder="เช่น 500 (ว่าง = ไม่จำกัด)"
                            />
                        </div>
                    )}

                    {/* ยอดจองขั้นต่ำ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            ยอดจองขั้นต่ำ (บาท)
                        </label>
                        <input
                            name="min_booking_amount"
                            type="number"
                            step="0.01"
                            value={formData.min_booking_amount}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            placeholder="เช่น 1000 (ว่าง = ไม่มีขั้นต่ำ)"
                        />
                    </div>

                    {/* จำกัดการใช้ (ทั้งหมด + ต่อคน) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                จำกัดการใช้ทั้งหมด
                            </label>
                            <input
                                name="usage_limit"
                                type="number"
                                value={formData.usage_limit}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                                placeholder="ว่าง = ไม่จำกัด"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                จำกัดต่อผู้ใช้ 1 คน
                            </label>
                            <input
                                name="usage_limit_per_user"
                                type="number"
                                value={formData.usage_limit_per_user}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                                placeholder="ว่าง = ไม่จำกัด"
                            />
                        </div>
                    </div>

                    {/* วันที่ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                วันที่เริ่มใช้งาน
                            </label>
                            <input
                                name="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                วันที่สิ้นสุด
                            </label>
                            <input
                                name="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* สถานะ */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            เปิดใช้งานคูปองนี้
                        </label>
                    </div>

                    {/* รูปภาพ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            รูปภาพคูปอง (ไม่บังคับ)
                        </label>

                        {imagePreview && (
                            <div className="mb-5 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-h-72 w-auto object-contain"
                                />
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-gray-700 dark:file:text-indigo-300 transition"
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            .jpg, .png, .webp สูงสุด 5MB
                        </p>
                    </div>

                    {/* ปุ่ม */}
                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            disabled={loading}
                            className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <FaSave />
                            {loading ? "กำลังบันทึก..." : isNew ? "สร้างคูปอง" : "บันทึกการแก้ไข"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}