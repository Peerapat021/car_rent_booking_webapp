'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaDownload,
    FaSearch,
    FaBuilding,
    FaChevronLeft,
    FaChevronRight,
    FaImage,
} from 'react-icons/fa';

import { getCities } from '@/lib/services/client/admin/cities/get';
import { postBranches } from '@/lib/services/client/admin/branches/post';
import { putBranches } from '@/lib/services/client/admin/branches/put';
import { deleteBranches } from '@/lib/services/client/admin/branches/delete';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Branch {
    branch_id: number;
    branch_name: string;
    branch_address: string;
    branch_phone?: string | null;
    branch_url?: string | null;
    city_id: number;
}

interface City {
    city_id: number;
    city_name: string;
}

type FormValues = {
    branch_name: string;
    branch_address: string;
    branch_phone: string;
    city_id: number;
};

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    accent: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
            </div>
        </div>
    );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
    current,
    total,
    onChange,
}: {
    current: number;
    total: number;
    onChange: (p: number) => void;
}) {
    if (total <= 1) return null;

    const pages: (number | '...')[] = [];
    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current > 3) pages.push('...');
        for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
        if (current < total - 2) pages.push('...');
        pages.push(total);
    }

    const pageBtn = (
        key: string,
        content: React.ReactNode,
        onClick: () => void,
        active = false,
        disabled = false,
    ) => (
        <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            className={`
        min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all
        ${active
                    ? 'bg-gray-900 text-white shadow-sm'
                    : disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                }
      `}
        >
            {content}
        </button>
    );

    return (
        <div className="flex items-center gap-1">
            {pageBtn('prev', <FaChevronLeft size={12} />, () => onChange(current - 1), false, current === 1)}
            {pages.map((p, i) =>
                p === '...'
                    ? <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                    : pageBtn(`page-${p}`, p, () => onChange(p as number), p === current)
            )}
            {pageBtn('next', <FaChevronRight size={12} />, () => onChange(current + 1), false, current === total)}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function BranchesPage({ branches }: { branches: Branch[] }) {
    const router = useRouter();
    const [cities, setCities] = useState<City[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);

    const [formValues, setFormValues] = useState<FormValues>({
        branch_name: '',
        branch_address: '',
        branch_phone: '',
        city_id: 0,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [stats, setStats] = useState({ total: 0 });

    const itemsPerPage = 10;

    const loadData = useCallback(async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const citiesRes = await getCities();
            setCities(citiesRes || []);
            setStats({ total: branches.length });
        } catch (err) {
            console.error(err);
            setErrorMsg('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    }, [branches.length]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredBranches = branches.filter((b) =>
        `${b.branch_name} ${b.branch_address} ${b.branch_phone || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase().trim())
    );

    const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
    const currentItems = filteredBranches.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const resetForm = () => {
        setFormValues({
            branch_name: '',
            branch_address: '',
            branch_phone: '',
            city_id: cities.length > 0 ? cities[0].city_id : 0,
        });
        setImageFile(null);
        setImagePreview(null);
        setErrorMsg(null);
    };

    const openCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEdit = (branch: Branch) => {
        setFormValues({
            branch_name: branch.branch_name,
            branch_address: branch.branch_address,
            branch_phone: branch.branch_phone || '',
            city_id: branch.city_id,
        });
        setImagePreview(branch.branch_url || null);
        setCurrentBranch(branch);
        setIsEditOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setErrorMsg('ไฟล์ใหญ่เกิน 5MB');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setErrorMsg('รองรับเฉพาะ .jpg, .png, .webp');
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent, isEdit = false) => {
        e.preventDefault();
        if (submitting) return;

        if (formValues.city_id === 0) {
            setErrorMsg('กรุณาเลือกจังหวัด/เมือง');
            return;
        }
        if (!formValues.branch_name.trim() || !formValues.branch_address.trim()) {
            setErrorMsg('กรุณากรอกชื่อสาขาและที่อยู่ให้ครบ');
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);

        try {
            const payload = new FormData();
            payload.append('branch_name', formValues.branch_name.trim());
            payload.append('branch_address', formValues.branch_address.trim());
            payload.append('branch_phone', formValues.branch_phone.trim());
            payload.append('city_id', formValues.city_id.toString());

            if (imageFile) {
                payload.append('image', imageFile);
            }

            if (isEdit && currentBranch) {
                await putBranches(currentBranch.branch_id, payload);
            } else {
                await postBranches(payload);
            }

            await loadData();
            setIsCreateOpen(false);
            setIsEditOpen(false);
            resetForm();
        } catch (err: any) {
            setErrorMsg(err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!currentBranch) return;
        try {
            await deleteBranches(currentBranch.branch_id.toString());
            await loadData();
            setIsDeleteOpen(false);
            setCurrentBranch(null);
        } catch (err: any) {
            setErrorMsg('ไม่สามารถลบได้ อาจมีข้อมูลอื่นผูกอยู่');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูลสาขา...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">

                {/* ── Header ── */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">จัดการสาขา</h1>
                        <p className="text-sm text-gray-400 mt-1">ดูและจัดการข้อมูลสาขาทั้งหมดในระบบ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <FaDownload size={13} /> ดาวน์โหลด
                        </button>
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                        >
                            <FaPlus size={12} /> เพิ่มสาขาใหม่
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        label="สาขาทั้งหมด"
                        value={stats.total.toLocaleString()}
                        icon={<FaBuilding className="text-blue-600" size={18} />}
                        accent="bg-blue-50"
                    />
                </div>

                {/* ── Error Message ── */}
                {errorMsg && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                        {errorMsg}
                    </div>
                )}

                {/* ── Search & Actions ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-64 max-w-xl">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อสาขา • ที่อยู่ • เบอร์โทร..."
                            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
                        />
                    </div>

                    {searchTerm && (
                        <span className="ml-auto text-xs text-gray-400">
                            {filteredBranches.length.toLocaleString()} สาขา จากทั้งหมด {branches.length.toLocaleString()} สาขา
                        </span>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['รูปภาพ', 'ชื่อสาขา', 'ที่อยู่', 'เบอร์โทร', 'จังหวัด', 'จัดการ'].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <FaSearch className="text-gray-200 mx-auto mb-3" size={28} />
                                            <p className="text-sm text-gray-400">
                                                {searchTerm
                                                    ? 'ไม่พบสาขาที่ตรงกับคำค้นหา'
                                                    : 'ยังไม่มีข้อมูลสาขาในระบบ'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((branch) => (
                                        <tr
                                            key={branch.branch_id}
                                            className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                                        >
                                            {/* Image */}
                                            <td className="px-5 py-4">
                                                {branch.branch_url ? (
                                                    <img
                                                        src={branch.branch_url}
                                                        alt={branch.branch_name}
                                                        className="w-24 h-16 object-cover rounded-lg border border-gray-100 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-16 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1 border border-gray-100">
                                                        <FaImage className="text-gray-300" size={18} />
                                                        <span className="text-[10px] text-gray-400">ไม่มีรูป</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Name + ID */}
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900">{branch.branch_name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">#{branch.branch_id}</p>
                                            </td>

                                            {/* Address */}
                                            <td className="px-5 py-4 text-gray-700">{branch.branch_address}</td>

                                            {/* Phone */}
                                            <td className="px-5 py-4 text-gray-700">{branch.branch_phone || '—'}</td>

                                            {/* City */}
                                            <td className="px-5 py-4 text-gray-700">
                                                {cities.find((c) => c.city_id === branch.city_id)?.city_name ?? '—'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEdit(branch)}
                                                        title="แก้ไข"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setCurrentBranch(branch);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        title="ลบ"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Table Footer ── */}
                    {filteredBranches.length > 0 && (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-xs text-gray-400">
                                แสดง{' '}
                                <span className="font-medium text-gray-600">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredBranches.length)}
                                </span>{' '}
                                จาก <span className="font-medium text-gray-600">{filteredBranches.length.toLocaleString()}</span> สาขา
                            </p>
                            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                        </div>
                    )}
                </div>

            </div>

            {/* ── CREATE / EDIT MODAL ── */}
            {(isCreateOpen || (isEditOpen && currentBranch)) && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {isCreateOpen ? 'เพิ่มสาขาใหม่' : 'แก้ไขสาขา'}
                            </h2>

                            {errorMsg && (
                                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={(e) => handleSubmit(e, isEditOpen)} className="space-y-5">
                                {/* ชื่อสาขา */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        ชื่อสาขา <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                        required
                                        value={formValues.branch_name}
                                        onChange={(e) => setFormValues({ ...formValues, branch_name: e.target.value })}
                                        className="w-full h-10 px-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                                        placeholder="เช่น สาขา CentralWorld"
                                    />
                                </div>

                                {/* ที่อยู่ */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        ที่อยู่ <span className="text-rose-600">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formValues.branch_address}
                                        onChange={(e) => setFormValues({ ...formValues, branch_address: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 resize-y min-h-[80px]"
                                        placeholder="เลขที่ ... ถนน ... แขวง ... เขต ... จังหวัด ... รหัสไปรษณีย์"
                                    />
                                </div>

                                {/* เบอร์โทร */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
                                    <input
                                        type="tel"
                                        value={formValues.branch_phone}
                                        onChange={(e) => setFormValues({ ...formValues, branch_phone: e.target.value })}
                                        className="w-full h-10 px-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                                        placeholder="02-123-4567 หรือ 081-234-5678"
                                    />
                                </div>

                                {/* จังหวัด */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        จังหวัด/เมือง <span className="text-rose-600">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formValues.city_id}
                                        onChange={(e) => setFormValues({ ...formValues, city_id: Number(e.target.value) })}
                                        className="w-full h-10 px-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                                    >
                                        <option value={0}>กรุณาเลือกจังหวัด</option>
                                        {cities.map((city) => (
                                            <option key={city.city_id} value={city.city_id}>
                                                {city.city_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* รูปภาพ */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">รูปภาพสาขา (ไม่บังคับ)</label>

                                    {imagePreview && (
                                        <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden inline-block">
                                            <img src={imagePreview} alt="Preview" className="max-h-64 w-auto object-contain" />
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileSelect}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-400">
                                        รองรับ .jpg .png .webp • สูงสุด 5MB
                                    </p>
                                </div>

                                <div className="flex justify-end gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            isCreateOpen ? setIsCreateOpen(false) : setIsEditOpen(false);
                                        }}
                                        disabled={submitting}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-60"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-60 flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                กำลังบันทึก...
                                            </>
                                        ) : isCreateOpen ? (
                                            'บันทึกสาขาใหม่'
                                        ) : (
                                            'บันทึกการแก้ไข'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DELETE MODAL ── */}
            {isDeleteOpen && currentBranch && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">ยืนยันการลบสาขา</h2>
                        <p className="text-gray-700 mb-6 leading-relaxed">
                            คุณแน่ใจหรือไม่ที่จะลบสาขา
                            <br />
                            <span className="font-semibold text-gray-900">"{currentBranch.branch_name}"</span> ?
                            <br /><br />
                            การกระทำนี้ไม่สามารถย้อนกลับได้
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                            >
                                ยืนยันการลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}