'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    FaCar,
    FaInfoCircle,
    FaFileAlt,
    FaArrowLeft,
    FaSave,
    FaTrash,
    FaExclamationTriangle,
    FaTimes,
    FaPlus,
} from 'react-icons/fa';

import { getCarClassesById } from '@/lib/services/client/admin/car_classes/get';
import { postCarClasses } from '@/lib/services/client/admin/car_classes/post';
import { putCarClasses } from '@/lib/services/client/admin/car_classes/put';
import { deleteCarClasses } from '@/lib/services/client/admin/car_classes/delete';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CarClass {
    class_id: number;
    class_code: string;
    class_name: string;
    class_description: string | null;
    sort_order: number | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

type Tab = 'general' | 'related-cars'; // ถ้ามี tab อื่นเพิ่มได้

export default function CarClassDetailPage() {
    const params = useParams<{ class_id: string }>();
    const router = useRouter();
    const isNew = params.class_id === 'new';
    const classIdFromUrl = isNew ? null : Number(params.class_id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('general');

    const [formData, setFormData] = useState({
        class_code: '',
        class_name: '',
        class_description: '',
        sort_order: 0,
        is_active: true,
    });

    // สำหรับ tab related-cars (ถ้าต้องการแสดงรถที่ใช้คลาสนี้)
    const [relatedCars, setRelatedCars] = useState<any[]>([]); // สมมติมี API ดึงรถที่ใช้ class_id นี้

    useEffect(() => {
        async function init() {
            try {
                if (!isNew && classIdFromUrl) {
                    const data = await getCarClassesById(classIdFromUrl); // สมมติ API คืน { class: {...} }
                    const cls = data.class || data;
                    setFormData({
                        class_code: cls.class_code || '',
                        class_name: cls.class_name || '',
                        class_description: cls.class_description || '',
                        sort_order: cls.sort_order ?? 0,
                        is_active: cls.is_active ?? true,
                    });

                    // ถ้ามี API ดึงรถที่เกี่ยวข้อง
                    // const carsRes = await fetch(`/api/admin/cars?class_id=${classIdFromUrl}`);
                    // setRelatedCars(await carsRes.json());
                }
            } catch (err: any) {
                setError(err.message || 'โหลดข้อมูลคลาสรถล้มเหลว');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [classIdFromUrl, isNew]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type, checked } = e.target as any;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : name === 'sort_order' ? Number(value) || 0 : value,
        }));
    };

    const handleSave = async () => {
        if (!formData.class_code.trim() || !formData.class_name.trim()) {
            return alert('กรุณากรอกรหัสย่อและชื่อคลาส');
        }

        if (!confirm(isNew ? 'ยืนยันการเพิ่มคลาสรถใหม่?' : 'ยืนยันการบันทึกการเปลี่ยนแปลง?')) return;

        setSaving(true);
        setError(null);

        try {
            const payload = {
                class_code: formData.class_code.toUpperCase().trim(),
                class_name: formData.class_name.trim(),
                class_description: formData.class_description.trim() || undefined,
                sort_order: formData.sort_order,
                is_active: formData.is_active,
            };

            let res;
            if (isNew) {
                res = await postCarClasses(payload);
                const newId = res.class_id || res.id;
                if (newId) {
                    router.replace(`/admin/car-classes/${newId}`, { scroll: false });
                    alert('เพิ่มคลาสรถสำเร็จ!');
                }
            } else {
                res = await putCarClasses(classIdFromUrl!, payload);
                alert('บันทึกสำเร็จ');
            }
        } catch (err: any) {
            setError(err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!classIdFromUrl) return;
        const confirmText = `คุณแน่ใจหรือไม่ที่จะลบคลาส "${formData.class_name}" ?\n\nการลบจะกระทบรถที่ใช้คลาสนี้ (ถ้ามี)`;
        if (!confirm(confirmText)) return;

        setSaving(true);
        try {
            await deleteCarClasses(String(classIdFromUrl));
            alert('ลบคลาสสำเร็จ');
            router.push('/admin/car-classes');
        } catch (err: any) {
            alert('ลบไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">กำลังโหลดข้อมูลคลาสรถ...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600 text-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Tabs */}
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <div className="px-6 py-5 border-b bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <FaCar size={28} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {isNew ? 'เพิ่มคลาสรถใหม่' : `คลาส: ${formData.class_name || '—'}`}
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        {formData.class_code ? formData.class_code.toUpperCase() : '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => router.back()}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                                >
                                    <FaArrowLeft /> กลับ
                                </button>
                                {!isNew && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={saving}
                                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <FaTrash /> ลบคลาส
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`px-6 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition ${saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    <FaSave />
                                    {saving ? 'กำลังบันทึก...' : isNew ? 'เพิ่มคลาส' : 'บันทึก'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b overflow-x-auto bg-gray-50">
                        {[
                            { id: 'general', label: 'ข้อมูลหลัก', icon: FaInfoCircle },
                            { id: 'related-cars', label: 'รถที่ใช้คลาสนี้', icon: FaCar, disabled: isNew },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.disabled) {
                                        alert('กรุณาบันทึกคลาสก่อน จึงจะดูรถที่เกี่ยวข้องได้');
                                        return;
                                    }
                                    setActiveTab(tab.id as Tab);
                                }}
                                disabled={tab.disabled}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-700 bg-white'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow border p-6 lg:p-8 space-y-10">

                    {activeTab === 'general' && (
                        <section className="space-y-8">
                            <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
                                <FaInfoCircle className="text-blue-600" /> ข้อมูลคลาสรถ
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        รหัสย่อ <span className="text-red-500 text-lg">*</span>
                                    </label>
                                    <input
                                        name="class_code"
                                        value={formData.class_code}
                                        onChange={handleChange}
                                        className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm uppercase"
                                        placeholder="เช่น ECO, STD, LUX, SUV"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อคลาส <span className="text-red-500 text-lg">*</span>
                                    </label>
                                    <input
                                        name="class_name"
                                        value={formData.class_name}
                                        onChange={handleChange}
                                        className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        placeholder="เช่น Economy, Standard, Luxury, SUV"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับการแสดง</label>
                                    <input
                                        type="number"
                                        name="sort_order"
                                        value={formData.sort_order}
                                        onChange={handleChange}
                                        min={0}
                                        className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">ยิ่งค่าน้อยยิ่งแสดงก่อน</p>
                                </div>

                                <div className="md:col-span-2 lg:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย / คุณสมบัติ</label>
                                    <textarea
                                        name="class_description"
                                        value={formData.class_description}
                                        onChange={handleChange}
                                        rows={5}
                                        className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        placeholder="เช่น รถขนาดเล็ก ประหยัดน้ำมัน เหมาะสำหรับการเดินทางในเมือง 1-4 คน..."
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label className="text-sm font-medium text-gray-700">
                                        เปิดใช้งานคลาสนี้ (แสดงในระบบ)
                                    </label>
                                </div>
                            </div>

                            {/* Warning ถ้าปิดใช้งาน */}
                            {!formData.is_active && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                                    <FaExclamationTriangle className="text-amber-600 text-xl mt-0.5" />
                                    <div>
                                        <p className="font-medium text-amber-800">คลาสนี้ถูกปิดใช้งาน</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            รถที่ใช้คลาสนี้จะยังคงใช้งานได้ แต่จะไม่แสดงเป็นตัวเลือกใหม่ในการเพิ่มรถ
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'related-cars' && !isNew && (
                        <section className="space-y-8">
                            <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
                                <FaCar className="text-indigo-600" /> รถที่กำลังใช้คลาสนี้
                            </h2>

                            {relatedCars.length === 0 ? (
                                <div className="text-center py-16 text-gray-500 border border-dashed rounded-xl">
                                    ยังไม่มีรถคันใดใช้คลาสนี้
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {relatedCars.map((car) => (
                                        <div
                                            key={car.car_id}
                                            className="border rounded-lg p-5 hover:shadow-md transition bg-white"
                                        >
                                            <div className="font-medium text-lg">
                                                {car.car_brand} {car.car_model}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                ทะเบียน: {car.car_license_plate}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                สถานะ: {car.car_status === 'available' ? 'พร้อมใช้งาน' : 'อื่นๆ'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}