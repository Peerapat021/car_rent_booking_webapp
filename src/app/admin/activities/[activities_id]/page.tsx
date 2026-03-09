// src/app/admin/activities/[activities_id]/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getActivityById } from "@/lib/services/client/admin/activities/get";     // ปรับ path ตามโครงสร้างของคุณ
import { postActivity } from "@/lib/services/client/admin/activities/post";
import { putActivity } from "@/lib/services/client/admin/activities/put";

interface ActivityFormData {
    activities_title: string;
    activities_content: string;
    activities_start_date: string;     // YYYY-MM-DD
    activities_end_date: string;       // YYYY-MM-DD หรือว่างได้
    activities_status: "draft" | "published" | "inactive";
}

export default function ActivityFormPage() {
    const router = useRouter();
    const params = useParams();
    const activityId = params.activities_id as string;
    const isNew = activityId === "new";

    const [formData, setFormData] = useState<ActivityFormData>({
        activities_title: "",
        activities_content: "",
        activities_start_date: "",
        activities_end_date: "",
        activities_status: "draft",
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isNew) {
            const fetchActivity = async () => {
                try {
                    const activity = await getActivityById(Number(activityId));

                    setFormData({
                        activities_title: activity.activities_title || "",
                        activities_content: activity.activities_content || "",
                        activities_start_date: activity.activities_start_date
                            ? activity.activities_start_date.slice(0, 10)
                            : "",
                        activities_end_date: activity.activities_end_date
                            ? activity.activities_end_date.slice(0, 10)
                            : "",
                        activities_status: activity.activities_status || "draft",
                    });

                    if (activity.activities_image_url) {
                        setImagePreview(activity.activities_image_url);
                    }
                } catch (err: any) {
                    setError("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
                    console.error(err);
                }
            };
            fetchActivity();
        }
    }, [isNew, activityId]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
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
            submitData.append(key, value);
        });
        if (imageFile) {
            submitData.append("file", imageFile);
        }

        try {
            if (isNew) {
                await postActivity(submitData);
                alert("เพิ่มกิจกรรมสำเร็จ!");
            } else {
                const confirmed = confirm("คุณต้องการบันทึกการแก้ไขกิจกรรมนี้หรือไม่?");
                if (!confirmed) {
                    setLoading(false);
                    return;
                }
                await putActivity(Number(activityId), submitData);
                alert("แก้ไขกิจกรรมสำเร็จ!");
            }
            router.push("/admin/activities");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                        <FaArrowLeft /> กลับไปหน้ารายการ
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {isNew ? "เพิ่มกิจกรรมใหม่" : `แก้ไขกิจกรรม: ${formData.activities_title || activityId}`}
                    </h1>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-7 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 lg:p-8">

                    {/* ชื่อกิจกรรม */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            ชื่อกิจกรรม <span className="text-red-600">*</span>
                        </label>
                        <input
                            name="activities_title"
                            value={formData.activities_title}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            placeholder="เช่น โปรโมชันปีใหม่ 2026 / Summer Flash Sale"
                        />
                    </div>

                    {/* เนื้อหา / รายละเอียด */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            รายละเอียดกิจกรรม <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            name="activities_content"
                            value={formData.activities_content}
                            onChange={handleChange}
                            required
                            rows={8}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition font-mono"
                            placeholder="รายละเอียดเงื่อนไข, รหัสส่วนลด, วิธีใช้, ภาพประกอบเพิ่มเติม..."
                        />
                    </div>

                    {/* วันที่เริ่ม - สิ้นสุด */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                วันที่เริ่มแสดง
                            </label>
                            <input
                                name="activities_start_date"
                                type="date"
                                value={formData.activities_start_date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                วันที่สิ้นสุด (ถ้ามี)
                            </label>
                            <input
                                name="activities_end_date"
                                type="date"
                                value={formData.activities_end_date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* สถานะ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            สถานะการแสดงผล <span className="text-red-600">*</span>
                        </label>
                        <select
                            name="activities_status"
                            value={formData.activities_status}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                        >
                            <option value="draft">แบบร่าง (ยังไม่แสดง)</option>
                            <option value="published">เผยแพร่แล้ว (แสดงในเว็บ)</option>
                            <option value="inactive">ปิดการแสดงผลชั่วคราว</option>
                        </select>
                    </div>

                    {/* รูปภาพหลัก */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            รูปภาพหลักของกิจกรรม (แนะนำขนาด 1200×600 หรือแนวนอน)
                        </label>

                        {imagePreview && (
                            <div className="mb-5 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden inline-block">
                                <img
                                    src={imagePreview}
                                    alt="กิจกรรม Preview"
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
                            {loading ? "กำลังบันทึก..." : isNew ? "สร้างกิจกรรม" : "บันทึกการแก้ไข"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}