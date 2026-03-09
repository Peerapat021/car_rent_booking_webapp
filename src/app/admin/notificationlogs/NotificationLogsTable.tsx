'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaSearch,
    FaDownload,
    FaPaperPlane,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaHistory,
    FaUser,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';
import { format } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

interface NotificationLog {
    notif_id: number;
    notification_id: number | null;
    user_id: number | null;
    booking_id: number | null;
    notif_type: string | null;
    notif_channel: 'dashboard' | 'email' | 'line' | 'sms' | 'push' | null;
    notif_status: 'pending' | 'success' | 'failed' | null;
    notif_payload: string | null;
    error_message: string | null;
    notif_sent_at: string | Date | null;
    create_at_notification: string | Date | null;
}

interface User {
    id: number;
    name: string;
}

// ── Status Config ──────────────────────────────────────────────────────────────

function getStatusConfig(status: string | null) {
    if (!status) {
        return { color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400', text: 'ไม่ระบุ' };
    }

    const configs = {
        success: { color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'สำเร็จ' },
        failed: { color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500', text: 'ล้มเหลว' },
        pending: { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'รอดำเนินการ' },
    };

    return (
        configs[status as keyof typeof configs] || {
            color: 'text-gray-500',
            bg: 'bg-gray-100',
            dot: 'bg-gray-400',
            text: status,
        }
    );
}

// ── Stat Card (ปรับให้เหมือนหน้า Car) ─────────────────────────────────────────

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

// ── Pagination (copy มาจากหน้า Car) ──────────────────────────────────────────

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

export default function NotificationLogsManagementPage({
    notificationlogs: initialLogs,
}: {
    notificationlogs: NotificationLog[];
}) {
    const router = useRouter();
    const [logs] = useState<NotificationLog[]>(initialLogs || []);
    const [users] = useState<User[]>([]); // ถ้ามี API users → fetch ตรงนี้
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15; // ปรับได้ตามต้องการ

    const stats = useMemo(() => {
        if (!logs.length) return { total: 0, last7days: 0, success: 0, failed: 0, pending: 0 };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recent = logs.filter(
            (log) => log.create_at_notification && new Date(log.create_at_notification) >= sevenDaysAgo
        ).length;

        return {
            total: logs.length,
            last7days: recent,
            success: logs.filter((l) => l.notif_status === 'success').length,
            failed: logs.filter((l) => l.notif_status === 'failed').length,
            pending: logs.filter((l) => l.notif_status === 'pending').length,
        };
    }, [logs]);

    const filteredLogs = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        if (!q) return logs;

        return logs.filter((log) => {
            const user = users.find((u) => u.id === log.user_id);
            return (
                `${log.notif_id}`.includes(q) ||
                (log.user_id && `${log.user_id}`.includes(q)) ||
                user?.name?.toLowerCase().includes(q) ||
                log.notif_type?.toLowerCase().includes(q) ||
                log.notif_channel?.toLowerCase().includes(q) ||
                (log.booking_id && `${log.booking_id}`.includes(q)) ||
                log.notif_status?.toLowerCase().includes(q)
            );
        });
    }, [logs, users, searchTerm]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const currentItems = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (!logs.length && !searchTerm) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaPaperPlane className="text-gray-200 mx-auto mb-3" size={32} />
                    <p className="text-sm text-gray-400">ยังไม่มีประวัติการแจ้งเตือนในระบบ</p>
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
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ประวัติการแจ้งเตือน</h1>
                        <p className="text-sm text-gray-400 mt-1">ตรวจสอบและติดตามการส่งแจ้งเตือนทั้งหมด</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <FaDownload size={13} /> ดาวน์โหลด
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        label="ทั้งหมด"
                        value={stats.total}
                        icon={<FaPaperPlane className="text-blue-600" size={18} />}
                        accent="bg-blue-50"
                    />
                    <StatCard
                        label="7 วันล่าสุด"
                        value={stats.last7days}
                        icon={<FaHistory className="text-emerald-600" size={18} />}
                        accent="bg-emerald-50"
                    />
                    <StatCard
                        label="สำเร็จ"
                        value={stats.success}
                        icon={<FaCheckCircle className="text-emerald-600" size={18} />}
                        accent="bg-emerald-50"
                    />
                    <StatCard
                        label="ล้มเหลว"
                        value={stats.failed}
                        icon={<FaTimesCircle className="text-red-600" size={18} />}
                        accent="bg-red-50"
                    />
                    <StatCard
                        label="รอดำเนินการ"
                        value={stats.pending}
                        icon={<FaClock className="text-amber-600" size={18} />}
                        accent="bg-amber-50"
                    />
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-64 max-w-xl">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหา ID, ชื่อผู้ใช้, ประเภท, ช่องทาง, Booking ID ..."
                            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
                        />
                    </div>

                    {(searchTerm) && (
                        <span className="ml-auto text-xs text-gray-400">
                            พบ {filteredLogs.length.toLocaleString()} รายการ จากทั้งหมด {logs.length.toLocaleString()} รายการ
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['ID', 'ผู้ใช้', 'Booking', 'ประเภท', 'ช่องทาง', 'สถานะ', 'ส่งเมื่อ', 'สร้างเมื่อ'].map((h, i) => (
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
                                                ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((log) => {
                                        const status = getStatusConfig(log.notif_status);
                                        const user = users.find((u) => u.id === log.user_id);

                                        return (
                                            <tr
                                                key={log.notif_id}
                                                className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                                            >
                                                <td className="px-5 py-4 font-medium text-gray-900">#{log.notif_id}</td>

                                                <td className="px-5 py-4">
                                                    {user?.name || (log.user_id ? `ID: ${log.user_id}` : '—')}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {log.booking_id ? (
                                                        <span className="font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                                                            #{log.booking_id}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-gray-600">{log.notif_type || '—'}</td>

                                                <td className="px-5 py-4 capitalize text-gray-600">
                                                    {log.notif_channel || '—'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                        {status.text}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-gray-600">
                                                    {log.notif_sent_at
                                                        ? format(new Date(log.notif_sent_at), 'dd MMM yyyy • HH:mm')
                                                        : '—'}
                                                </td>

                                                <td className="px-5 py-4 text-gray-500">
                                                    {log.create_at_notification
                                                        ? format(new Date(log.create_at_notification), 'dd MMM yyyy • HH:mm')
                                                        : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer + Pagination */}
                    {filteredLogs.length > 0 && (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-xs text-gray-400">
                                แสดง{' '}
                                <span className="font-medium text-gray-600">
                                    {(currentPage - 1) * itemsPerPage + 1}–
                                    {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
                                </span>{' '}
                                จาก <span className="font-medium text-gray-600">{filteredLogs.length.toLocaleString()}</span> รายการ
                            </p>

                            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}