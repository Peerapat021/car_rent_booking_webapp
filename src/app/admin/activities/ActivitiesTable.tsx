'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaDownload,
    FaSearch,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaDraftingCompass,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';

import { deleteActivity } from '@/lib/services/client/admin/activities/delete';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Activity {
    activities_id: number;
    activities_title: string;
    activities_content: string;
    activities_image_url: string | null;
    activities_start_date: Date | null;
    activities_end_date: Date | null;
    activities_status: 'draft' | 'published' | 'inactive';
    activities_created_by: number;
    activities_created_at: Date;
    activities_updated_at: Date;
}

// ── Status Config ──────────────────────────────────────────────────────────────

function getStatusConfig(status: string) {
    const config = {
        published: {
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
            dot: 'bg-emerald-500',
            text: 'เผยแพร่แล้ว',
        },
        draft: {
            color: 'text-amber-700',
            bg: 'bg-amber-50',
            dot: 'bg-amber-500',
            text: 'แบบร่าง',
        },
        inactive: {
            color: 'text-rose-700',
            bg: 'bg-rose-50',
            dot: 'bg-rose-500',
            text: 'ปิดใช้งาน',
        },
    }[status as 'published' | 'draft' | 'inactive'];

    return (
        config || {
            color: 'text-gray-700',
            bg: 'bg-gray-100',
            dot: 'bg-gray-400',
            text: 'ไม่ระบุ',
        }
    );
}

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

export default function ActivityManagementPage({ activities }: { activities: Activity[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
        inactive: 0,
    });

    const itemsPerPage = 10;

    useEffect(() => {
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!activities.length) return;

        const countByStatus: Record<string, number> = {};
        activities.forEach((act) => {
            const st = act.activities_status || 'draft';
            countByStatus[st] = (countByStatus[st] || 0) + 1;
        });

        setStats({
            total: activities.length,
            published: countByStatus['published'] || 0,
            draft: countByStatus['draft'] || 0,
            inactive: countByStatus['inactive'] || 0,
        });
    }, [activities]);

    const filteredActivities = activities.filter((act) => {
        const q = searchTerm.toLowerCase().trim();
        if (!q) return true;
        return (
            `${act.activities_id}`.includes(q) ||
            act.activities_title.toLowerCase().includes(q) ||
            (act.activities_content || '').toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const currentItems = filteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleDelete = async (activityId: number) => {
        const title = activities.find((a) => a.activities_id === activityId)?.activities_title || 'กิจกรรมนี้';
        if (!confirm(`ยืนยันการลบ "${title}" ?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

        try {
            await deleteActivity(activityId);
            window.location.reload();
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถลบได้ กรุณาลองใหม่');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูลกิจกรรม...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">การจัดการกิจกรรม</h1>
                        <p className="text-sm text-gray-400 mt-1">ดูแลและกำหนดกิจกรรมที่แสดงในระบบ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <FaDownload size={13} /> ดาวน์โหลด
                        </button>
                        <button
                            onClick={() => router.push('/admin/activities/new')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                        >
                            <FaPlus size={12} /> เพิ่มกิจกรรมใหม่
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="กิจกรรมทั้งหมด"
                        value={stats.total.toLocaleString()}
                        icon={<FaCalendarAlt className="text-blue-600" size={18} />}
                        accent="bg-blue-50"
                    />
                    <StatCard
                        label="เผยแพร่แล้ว"
                        value={stats.published.toLocaleString()}
                        icon={<FaCheckCircle className="text-emerald-600" size={18} />}
                        accent="bg-emerald-50"
                    />
                    <StatCard
                        label="แบบร่าง"
                        value={stats.draft.toLocaleString()}
                        icon={<FaDraftingCompass className="text-amber-600" size={18} />}
                        accent="bg-amber-50"
                    />
                    <StatCard
                        label="ปิดใช้งาน"
                        value={stats.inactive.toLocaleString()}
                        icon={<FaTimesCircle className="text-rose-600" size={18} />}
                        accent="bg-rose-50"
                    />
                </div>

                {/* ── Search Bar ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-64 max-w-xl">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหา ชื่อกิจกรรม • รายละเอียด • หมายเลข..."
                            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
                        />
                    </div>

                    {searchTerm && (
                        <span className="ml-auto text-xs text-gray-400">
                            {filteredActivities.length.toLocaleString()} รายการ จากทั้งหมด {activities.length.toLocaleString()} รายการ
                        </span>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['รูป', 'ชื่อกิจกรรม', 'ช่วงวันที่', 'สถานะ', 'สร้างเมื่อ', 'จัดการ'].map((h) => (
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
                                                    ? 'ไม่พบกิจกรรมที่ตรงกับคำค้นหา'
                                                    : 'ยังไม่มีข้อมูลกิจกรรมในระบบ'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((act) => {
                                        const status = getStatusConfig(act.activities_status || 'draft');

                                        const start = act.activities_start_date
                                            ? new Date(act.activities_start_date).toLocaleDateString('th-TH', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })
                                            : '—';
                                        const end = act.activities_end_date
                                            ? new Date(act.activities_end_date).toLocaleDateString('th-TH', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })
                                            : '—';
                                        const dateRange = `${start} — ${end}`;

                                        return (
                                            <tr
                                                key={act.activities_id}
                                                className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                                            >
                                                {/* Image */}
                                                <td className="px-5 py-4">
                                                    {act.activities_image_url ? (
                                                        <img
                                                            src={act.activities_image_url}
                                                            alt={act.activities_title}
                                                            className="w-24 h-16 object-cover rounded-lg border border-gray-100 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-100">
                                                            <span className="text-xs text-gray-400">ไม่มีรูป</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Title + ID */}
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-gray-900">{act.activities_title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">#{act.activities_id}</p>
                                                </td>

                                                {/* Date Range */}
                                                <td className="px-5 py-4 text-gray-700">{dateRange}</td>

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
                                                <td className="px-5 py-4 text-gray-600">
                                                    {new Date(act.activities_created_at).toLocaleDateString('th-TH', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => router.push(`/admin/activities/${act.activities_id}`)}
                                                            title="แก้ไข"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(act.activities_id)}
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

                    {/* ── Table Footer ── */}
                    {filteredActivities.length > 0 && (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-xs text-gray-400">
                                แสดง{' '}
                                <span className="font-medium text-gray-600">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredActivities.length)}
                                </span>{' '}
                                จาก <span className="font-medium text-gray-600">{filteredActivities.length.toLocaleString()}</span> รายการ
                            </p>
                            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}