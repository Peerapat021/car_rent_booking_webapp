'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaDownload,
    FaSearch,
    FaTicketAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';
import { format } from 'date-fns';

import { getCoupons } from '@/lib/services/client/admin/coupons/get';
import { deleteCoupon } from '@/lib/services/client/admin/coupons/delete';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Coupon {
    coupon_id: number;
    coupon_code: string;
    coupon_image: string | null;
    discount_type: 'percent' | 'fixed';
    discount_value: string;
    max_discount_amount: string | null;
    min_booking_amount: string | null;
    usage_limit: number | null;
    usage_limit_per_user: number | null;
    used_count: number;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean | null;
    created_at: string;
}

// ── Status Config (คล้าย status ของรถ) ───────────────────────────────────────

function getCouponStatusConfig(isActive: boolean | null) {
    if (isActive === null || !isActive) {
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

export default function CouponManagementPage({ coupons: initialCoupons }: { coupons: Coupon[] }) {
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    // Stats
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

    useEffect(() => {
        if (!coupons.length) return;

        const active = coupons.filter((c) => c.is_active).length;

        setStats({
            total: coupons.length,
            active,
            inactive: coupons.length - active,
        });
    }, [coupons]);

    const filteredCoupons = coupons.filter((c) =>
        !searchTerm ||
        c.coupon_id.toString().includes(searchTerm.trim()) ||
        (c.coupon_code?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ?? false) ||
        (c.discount_type?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ?? false) ||
        (c.discount_value?.includes(searchTerm.trim()) ?? false)
    );

    const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
    const currentItems = filteredCoupons.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleDelete = async (coupon: Coupon) => {
        if (!confirm(`ยืนยันการลบคูปอง "${coupon.coupon_code}" ?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

        try {
            await deleteCoupon(coupon.coupon_id);
            setCoupons((prev) => prev.filter((c) => c.coupon_id !== coupon.coupon_id));
            alert('ลบคูปองสำเร็จ');
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถลบได้ กรุณาลองใหม่');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูลคูปอง...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">คูปองทั้งหมด</h1>
                        <p className="text-sm text-gray-400 mt-1">จัดการและติดตามคูปองส่วนลดในระบบ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <FaDownload size={13} /> ดาวน์โหลด
                        </button>
                        <button
                            onClick={() => router.push('/admin/coupons/new')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                        >
                            <FaPlus size={12} /> เพิ่มคูปองใหม่
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        label="คูปองทั้งหมด"
                        value={stats.total}
                        icon={<FaTicketAlt className="text-blue-600" size={18} />}
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
                        placeholder="ค้นหา รหัสคูปอง, โค้ด, ประเภทส่วนลด, มูลค่า..."
                        className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
                    />
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['รูปภาพ', 'รหัสคูปอง', 'ส่วนลด', 'เงื่อนไข', 'สถานะ', 'การใช้งาน', 'ต่อคน', 'สร้างเมื่อ', 'จัดการ'].map((h, i) => (
                                        <th
                                            key={h}
                                            className={`px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 8 ? 'text-center' : 'text-left'}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center">
                                            <FaSearch className="text-gray-200 mx-auto mb-3" size={28} />
                                            <p className="text-sm text-gray-400">
                                                {searchTerm ? 'ไม่พบคูปองที่ตรงกับคำค้นหา' : 'ยังไม่มีคูปองในระบบ'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((coupon) => {
                                        const status = getCouponStatusConfig(coupon.is_active);

                                        return (
                                            <tr key={coupon.coupon_id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                                                {/* Image */}
                                                <td className="px-5 py-4">
                                                    {coupon.coupon_image ? (
                                                        <img
                                                            src={coupon.coupon_image}
                                                            alt={coupon.coupon_code}
                                                            className="w-20 h-12 object-cover rounded-lg border border-gray-100 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-20 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-gray-100">
                                                            ไม่มีรูป
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Code */}
                                                <td className="px-5 py-4 font-mono font-medium text-gray-700">{coupon.coupon_code}</td>

                                                {/* Discount */}
                                                <td className="px-5 py-4 font-medium text-gray-900">
                                                    {coupon.discount_type === 'percent'
                                                        ? `${parseFloat(coupon.discount_value)}%`
                                                        : `฿${parseFloat(coupon.discount_value).toLocaleString()}`}
                                                    {coupon.max_discount_amount && coupon.discount_type === 'percent' && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            สูงสุด ฿{parseFloat(coupon.max_discount_amount).toLocaleString()}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Conditions */}
                                                <td className="px-5 py-4 text-gray-600 text-sm">
                                                    {coupon.min_booking_amount && (
                                                        <>ขั้นต่ำ ฿{parseFloat(coupon.min_booking_amount).toLocaleString()}<br /></>
                                                    )}
                                                    {coupon.start_date || coupon.end_date ? (
                                                        <>
                                                            {coupon.start_date ? format(new Date(coupon.start_date), 'dd/MM/yyyy') : '—'}
                                                            {' → '}
                                                            {coupon.end_date ? format(new Date(coupon.end_date), 'dd/MM/yyyy') : '—'}
                                                        </>
                                                    ) : '—'}
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

                                                {/* Usage */}
                                                <td className="px-5 py-4 text-gray-600 text-sm">
                                                    {coupon.usage_limit
                                                        ? `${coupon.used_count} / ${coupon.usage_limit}`
                                                        : `${coupon.used_count} (ไม่จำกัด)`}
                                                </td>

                                                {/* Per User */}
                                                <td className="px-5 py-4 text-gray-600 text-sm">
                                                    {coupon.usage_limit_per_user ?? 'ไม่จำกัด'}
                                                </td>

                                                {/* Created At */}
                                                <td className="px-5 py-4 text-gray-600 text-sm">
                                                    {format(new Date(coupon.created_at), 'dd/MM/yyyy')}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => router.push(`/admin/coupons/${coupon.coupon_id}`)}
                                                            title="แก้ไข"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(coupon)}
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
                    {filteredCoupons.length > 0 && (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4">
                            <p className="text-xs text-gray-400">
                                แสดง <span className="font-medium text-gray-600">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredCoupons.length)}
                                </span> จาก <span className="font-medium text-gray-600">{filteredCoupons.length.toLocaleString()}</span> รายการ
                            </p>
                            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}