// src/app/admin/cities/[city_id]/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getCityById } from "@/lib/services/client/admin/cities/get";
import { putCity } from "@/lib/services/client/admin/cities/put";

interface CityFormData {
    city_name: string;
    city_code: string;
    city_postal_code: string;
    city_status: "active" | "inactive";
}

export default function CityFormPage() {
    const router = useRouter();
    const params = useParams();
    const cityId = params.city_id as string;
    const isNew = cityId === "new";

    const [formData, setFormData] = useState<CityFormData>({
        city_name: "",
        city_code: "",
        city_postal_code: "",
        city_status: "active",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isNew) {
            const fetchCity = async () => {
                try {
                    const city = await getCityById(Number(cityId));
                    setFormData({
                        city_name: city.city_name || "",
                        city_code: city.city_code || "",
                        city_postal_code: city.city_postal_code || "",
                        city_status: city.city_status || "active",
                    });
                } catch (err: any) {
                    setError("ไม่สามารถโหลดข้อมูลเมืองได้");
                    console.error(err);
                }
            };
            fetchCity();
        }
    }, [isNew, cityId]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation ง่าย ๆ ฝั่ง client
        if (!formData.city_name.trim()) {
            setError("กรุณากรอกชื่อเมือง");
            setLoading(false);
            return;
        }

        if (formData.city_code && formData.city_code.length > 10) {
            setError("รหัสเมืองต้องไม่เกิน 10 ตัวอักษร");
            setLoading(false);
            return;
        }

        if (!["active", "inactive"].includes(formData.city_status)) {
            setError("สถานะไม่ถูกต้อง");
            setLoading(false);
            return;
        }

        const submitData = new FormData();
        submitData.append("city_name", formData.city_name.trim());
        submitData.append("city_code", formData.city_code.trim());
        submitData.append("city_postal_code", formData.city_postal_code.trim());
        submitData.append("city_status", formData.city_status);

        try {
            if (isNew) {
                await putCity(Number(cityId), submitData);
                alert("แก้ไขข้อมูลเมืองสำเร็จ!");
            } else {
                const confirmed = confirm("คุณต้องการบันทึกการแก้ไขข้อมูลเมืองนี้หรือไม่?");
                if (!confirmed) {
                    setLoading(false);
                    return;
                }
                await putCity(Number(cityId), submitData);
                alert("แก้ไขข้อมูลเมืองสำเร็จ!");
            }
            router.push("/admin/cities");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                        <FaArrowLeft /> กลับไปหน้ารายการ
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {isNew ? "เพิ่มเมืองใหม่" : `แก้ไขเมือง: ${formData.city_name || cityId}`}
                    </h1>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 lg:p-8">

                    {/* ชื่อเมือง */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            ชื่อเมือง <span className="text-red-600">*</span>
                        </label>
                        <input
                            name="city_name"
                            value={formData.city_name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            placeholder="เช่น กรุงเทพมหานคร, เชียงใหม่"
                        />
                    </div>

                    {/* รหัสเมือง */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            รหัสเมือง (เช่น BKK, CNX)
                        </label>
                        <input
                            name="city_code"
                            value={formData.city_code}
                            onChange={handleChange}
                            maxLength={10}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition font-mono uppercase"
                            placeholder="เช่น BKK, CNX, HKT (ว่างได้)"
                        />
                    </div>

                    {/* รหัสไปรษณีย์หลัก */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            รหัสไปรษณีย์หลัก
                        </label>
                        <input
                            name="city_postal_code"
                            value={formData.city_postal_code}
                            onChange={handleChange}
                            maxLength={10}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            placeholder="เช่น 10100, 50000 (ว่างได้)"
                        />
                    </div>

                    {/* สถานะ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            สถานะ
                        </label>
                        <select
                            name="city_status"
                            value={formData.city_status}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                        >
                            <option value="active">ใช้งานได้ (active)</option>
                            <option value="inactive">ปิดใช้งาน (inactive)</option>
                        </select>
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
                            {loading ? "กำลังบันทึก..." : isNew ? "สร้างเมือง" : "บันทึกการแก้ไข"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}