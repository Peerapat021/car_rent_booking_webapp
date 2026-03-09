'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaCar,
    FaUsers,
    FaHeart,
    FaSearch,
    FaEye,
    FaChevronLeft,
    FaChevronRight,
    FaDownload
} from 'react-icons/fa';
import { format } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

// ในไฟล์ FavoritesPage.tsx หรือ types/favorites.ts
export interface FavoriteWithDetails {
    favorite_id: number;
    user_id: number;
    car_id: number;
    created_at: Date;
    user_name?: string | null;
    user_email?: string | null;
    car_brand?: string | null;
    car_model?: string | null;
    car_license_plate?: string | null;
    car_image_cover?: string | null;
    interest_context?: string;
}

// ── Stat Card (ใช้ตัวเดิม) ────────────────────────────────────────────────

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

// ── Pagination (copy ตรงจากเดิม) ──────────────────────────────────────────

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

export default function CarInterestsPage({ favorites }: { favorites: FavoriteWithDetails[] }) {
    const router = useRouter();
    const [interests, setInterests] = useState<FavoriteWithDetails[]>(favorites);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 10;

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        uniqueUsers: 0,
        uniqueCars: 0,
    });

    useEffect(() => {
        if (!interests.length) return;

        const uniqueUserIds = new Set(interests.map(i => i.user_id)).size;
        const uniqueCarIds = new Set(interests.map(i => i.car_id)).size;

        setStats({
            total: interests.length,
            uniqueUsers: uniqueUserIds,
            uniqueCars: uniqueCarIds,
        });
    }, [interests]);

    const filteredInterests = interests.filter((item) =>
        !searchTerm ||
        item.car_brand?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.car_model?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.car_license_plate?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.user_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.user_id.toString().includes(searchTerm.trim())
    );

    const totalPages = Math.ceil(filteredInterests.length / itemsPerPage);
    const currentItems = filteredInterests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูลความสนใจรถยนต์...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ความสนใจรถยนต์จากลูกค้า</h1>
                        <p className="text-sm text-gray-400 mt-1">วิเคราะห์รถยอดนิยมและพฤติกรรมลูกค้า</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <FaDownload size={13} /> ดาวน์โหลดรายงาน
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="ความสนใจทั้งหมด"
                        value={stats.total.toLocaleString()}
                        icon={<FaHeart className="text-rose-600" size={18} />}
                        accent="bg-rose-50"
                    />
                    <StatCard
                        label="ลูกค้าที่สนใจ (ไม่ซ้ำ)"
                        value={stats.uniqueUsers.toLocaleString()}
                        icon={<FaUsers className="text-emerald-600" size={18} />}
                        accent="bg-emerald-50"
                    />
                    <StatCard
                        label="รถที่ถูกสนใจ (ไม่ซ้ำ)"
                        value={stats.uniqueCars.toLocaleString()}
                        icon={<FaCar className="text-blue-600" size={18} />}
                        accent="bg-blue-50"
                    />
                </div>

                {/* Search Bar */}
                <div className="relative max-w-xl">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ค้นหา ยี่ห้อ, รุ่น, ทะเบียน, ชื่อลูกค้า, ID..."
                        className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1200px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['รูปภาพรถ', 'รถยนต์', 'ลูกค้า', 'วันที่บันทึก', 'บริบท', 'จัดการ'].map((h, i) => (
                                        <th
                                            key={h}
                                            className={`px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 5 ? 'text-center' : 'text-left'}`}
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
                                                {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ยังไม่มีข้อมูลความสนใจรถยนต์'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => (
                                        <tr key={item.favorite_id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                                            {/* Car Image */}
                                            <td className="px-5 py-4">
                                                {item.car_image_cover ? (
                                                    <img
                                                        src={item.car_image_cover}
                                                        alt={`${item.car_brand} ${item.car_model}`}
                                                        className="w-20 h-12 object-cover rounded-lg border border-gray-100 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-gray-100">
                                                        ไม่มีรูป
                                                    </div>
                                                )}
                                            </td>

                                            {/* Car Info */}
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {item.car_brand} {item.car_model}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {item.car_license_plate || '—'}
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-5 py-4 text-gray-700">
                                                {item.user_name || item.user_email || `ID: ${item.user_id}`}
                                            </td>

                                            {/* Created At */}
                                            <td className="px-5 py-4 text-gray-600 text-sm">
                                                {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                                            </td>

                                            {/* Context */}
                                            <td className="px-5 py-4 text-gray-600 text-sm">
                                                {item.interest_context
                                                    ? item.interest_context.replace(/_/g, ' ')
                                                    : 'บันทึกเอง'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    onClick={() => router.push(`/admin/cars/${item.car_id}`)}
                                                    title="ดูรายละเอียดรถ"
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all mx-auto"
                                                >
                                                    <FaEye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer / Pagination */}
                    {filteredInterests.length > 0 && (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4">
                            <p className="text-xs text-gray-400">
                                แสดง <span className="font-medium text-gray-600">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredInterests.length)}
                                </span> จาก <span className="font-medium text-gray-600">{filteredInterests.length.toLocaleString()}</span> รายการ
                            </p>
                            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}