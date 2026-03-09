'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaDownload,
    FaSearch,
    FaPercentage,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';
import { format } from 'date-fns';

import { getPromotions } from '@/lib/services/client/admin/promotions/get';
import { deletePromotion } from '@/lib/services/client/admin/promotions/delete';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Promotion {
    promo_id: number;
    promo_code: string | null;
    discount_type: 'percent' | 'fixed' | null;
    discount_value: string | null;
    promo_start: Date | string | null;
    promo_end: Date | string | null;
    promo_status: 'active' | 'inactive' | null;
    create_at_promotion: Date | string;
}

// ── Status Config (คล้าย status ของรถ) ───────────────────────────────────────

function getPromoStatusConfig(status: string | null) {
    if (!status || status === 'inactive') {
        return { color: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500', text: 'ปิดใช้งาน' };
    }
    return { color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'ใช้งาน' };
}

// ── Stat Card (copy สไตล์จากหน้ารถ) ──────────────────────────────────────────

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

// ── Pagination (copy ตรงจากหน้ารถ) ──────────────────────────────────────────

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

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PromotionManagementPage({ promotions: initialPromotions }: { promotions: Promotion[] }) {
    const router = useRouter();
    const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    // Stats
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

    useEffect(() => {
        if (!promotions.length) return;

        const active = promotions.filter((p) => p.promo_status === 'active').length;

        setStats({
            total: promotions.length,
            active,
            inactive: promotions.length - active,
        });
    }, [promotions]);

    const filteredPromotions = promotions.filter((p) =>
        !searchTerm ||
        p.promo_id.toString().includes(searchTerm.trim()) ||
        (p.promo_code?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ?? false) ||
        (p.discount_type?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ?? false) ||
        (p.discount_value?.toString().includes(searchTerm.trim()) ?? false)
    );

    const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
    const currentItems = filteredPromotions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleDelete = async (promo: Promotion) => {
        if (!confirm(`ยืนยันการลบโปรโมชั่น "${promo.promo_code || promo.promo_id}" ?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

        try {
            await deletePromotion(promo.promo_id);
            setPromotions((prev) => prev.filter((p) => p.promo_id !== promo.promo_id));
            alert('ลบโปรโมชั่นสำเร็จ');
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถลบได้ กรุณาลองใหม่');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูลโปรโมชั่น...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">โปรโมชั่นทั้งหมด</h1>
                        <p className="text-sm text-gray-400 mt-1">จัดการและติดตามโปรโมชั่นส่วนลดในระบบ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <FaDownload size={13} /> ดาวน์โหลด
                        </button>
                        <button
                            onClick={() => router.push('/admin/promotions/new')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                        >
                            <FaPlus size={12} /> เพิ่มโปรโมชั่นใหม่
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        label="โปรโมชั่นทั้งหมด"
                        value={stats.total}
                        icon={<FaPercentage className="text-blue-600" size={18} />}
                        accent="bg-blue-50"
                    />
                    <StatCard
                        label="กำลังใช้งาน"
                        value={stats.active}
                        icon={<FaCheckCircle className="text-emerald-600" size={18} />}
                        accent="bg-emerald-50"
                    />
                    <StatCard
                        label="ปิดใช้งาน / หมดอายุ"
                        value={stats.inactive}
                        icon={<FaTimesCircle className="text-rose-600" size={18} />}
                        accent="bg-rose-50"
                    />
                </div>

                {/* ── Search Bar ── */}
                <div className="relative max-w-xl">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ค้นหา รหัสโปร, โค้ด, ประเภทส่วนลด, มูลค่า..."
                        className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
                    />
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['รหัสโปร', 'โค้ด', 'ประเภท', 'มูลค่า', 'ช่วงเวลา', 'สถานะ', 'สร้างเมื่อ', 'จัดการ'].map((h, i) => (
                                        <th
                                            key={h}
                                            className={`px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 7 ? 'text-center' : 'text-left'}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <FaSearch className="text-gray-200 mx-auto mb-3" size={28} />
                                            <p className="text-sm text-gray-400">
                                                {searchTerm ? 'ไม่พบโปรโมชั่นที่ตรงกับคำค้นหา' : 'ยังไม่มีโปรโมชั่นในระบบ'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((promo) => {
                                        const status = getPromoStatusConfig(promo.promo_status);
                                        const isActive = promo.promo_status === 'active';

                                        return (
                                            <tr key={promo.promo_id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                                                {/* ID */}
                                                <td className="px-5 py-4 font-medium text-gray-900">#{promo.promo_id}</td>

                                                {/* Code */}
                                                <td className="px-5 py-4 font-mono text-gray-700">{promo.promo_code || '—'}</td>

                                                {/* Type */}
                                                <td className="px-5 py-4 capitalize text-gray-600">
                                                    {promo.discount_type || '—'}
                                                </td>

                                                {/* Value */}
                                                <td className="px-5 py-4 font-medium text-gray-900">
                                                    {promo.discount_value
                                                        ? promo.discount_type === 'percent'
                                                            ? `${promo.discount_value}%`
                                                            : `฿${Number(promo.discount_value).toLocaleString()}`
                                                        : '—'}
                                                </td>

                                                {/* Period */}
                                                <td className="px-5 py-4 text-gray-600 text-sm">
                                                    {promo.promo_start
                                                        ? format(new Date(promo.promo_start), 'dd/MM/yyyy')
                                                        : '—'}
                                                    {' → '}
                                                    {promo.promo_end
                                                        ? format(new Date(promo.promo_end), 'dd/MM/yyyy')
                                                        : '—'}
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                        {status.text}
                                                    </span>
                                                </td>

                                                {/* Created At */}
                                                <td className="px-5 py-4 text-gray-600 text-sm">
                                                    {format(new Date(promo.create_at_promotion), 'dd/MM/yyyy')}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => router.push(`/admin/promotions/${promo.promo_id}`)}
                                                            title="แก้ไข"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(promo)}
                                                            title="ลบ"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Table Footer / Pagination ── */}
                    {filteredPromotions.length > 0 && (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4">
                            <p className="text-xs text-gray-400">
                                แสดง <span className="font-medium text-gray-600">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredPromotions.length)}
                                </span> จาก <span className="font-medium text-gray-600">{filteredPromotions.length.toLocaleString()}</span> รายการ
                            </p>
                            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}