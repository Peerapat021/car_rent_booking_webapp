'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaSearch,
    FaDownload,
    FaTicketAlt,
    FaUser,
    FaHistory,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';
import { format } from 'date-fns';

import { getCouponUsages } from "@/lib/services/client/admin/couponUsages/get";
import { getUsers } from "@/lib/services/client/admin/users/get";
import { getCoupons } from "@/lib/services/client/admin/coupons/get";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CouponUsage {
    usage_id: number;
    coupon_id: number;
    user_id: number;
    booking_id: number | null;
    used_at: Date;
}

interface User {
    id: number;
    name: string;
}

interface Coupon {
    coupon_id: number;
    coupon_code: string;
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

// ── Pagination (copy มาทั้งชุดจากหน้า cars) ───────────────────────────────────

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

export default function CouponUsageManagementPage({ couponUsages: initialUsages }: { couponUsages: CouponUsage[] }) {
    const router = useRouter();
    const [usages, setUsages] = useState<CouponUsage[]>(initialUsages);
    const [users, setUsers] = useState<User[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        total: 0,
        last7days: 0,
        uniqueUsers: 0,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usageData, userData, couponData] = await Promise.all([
                getCouponUsages(),
                getUsers(),
                getCoupons(),
            ]);

            setUsages(usageData || []);
            setUsers(userData || []);
            setCoupons(couponData || []);
        } catch (err) {
            console.error('โหลดข้อมูลการใช้งานคูปองล้มเหลว', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!usages.length) return;

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const recent = usages.filter(u => new Date(u.used_at) >= sevenDaysAgo).length;
        const uniqueUserCount = new Set(usages.map(u => u.user_id)).size;

        setStats({
            total: usages.length,
            last7days: recent,
            uniqueUsers: uniqueUserCount,
        });
    }, [usages]);

    const filteredUsages = usages.filter((item) => {
        const user = users.find(u => u.id === item.user_id);
        const coupon = coupons.find(c => c.coupon_id === item.coupon_id);

        const q = searchTerm.toLowerCase().trim();
        return (
            !q ||
            `${item.usage_id}`.includes(q) ||
            coupon?.coupon_code?.toLowerCase().includes(q) ||
            user?.name?.toLowerCase().includes(q) ||
            (item.booking_id && `${item.booking_id}`.includes(q))
        );
    });

    const totalPages = Math.ceil(filteredUsages.length / itemsPerPage);
    const currentItems = filteredUsages.slice(
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
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูลการใช้งานคูปอง...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">การใช้งานคูปองทั้งหมด</h1>
                        <p className="text-sm text-gray-400 mt-1">ตรวจสอบและจัดการประวัติการใช้คูปองในระบบ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <FaDownload size={13} /> ดาวน์โหลดรายการ
                        </button>
                        {/* ถ้ามีปุ่มสร้าง/เพิ่ม สามารถใส่ได้ */}
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        label="การใช้งานทั้งหมด"
                        value={stats.total.toLocaleString()}
                        icon={<FaTicketAlt className="text-blue-600" size={18} />}
                        accent="bg-blue-50"
                    />
                    <StatCard
                        label="7 วันล่าสุด"
                        value={stats.last7days.toLocaleString()}
                        icon={<FaHistory className="text-emerald-600" size={18} />}
                        accent="bg-emerald-50"
                    />
                    <StatCard
                        label="ผู้ใช้ที่ใช้คูปอง"
                        value={stats.uniqueUsers.toLocaleString()}
                        icon={<FaUser className="text-indigo-600" size={18} />}
                        accent="bg-indigo-50"
                    />
                </div>

                {/* ── Search & Filter Bar ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-64 max-w-xl">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหา รหัสใช้งาน • ชื่อผู้ใช้ • โค้ดคูปอง • รหัสการจอง..."
                            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
                        />
                    </div>

                    {searchTerm && (
                        <span className="ml-auto text-xs text-gray-400">
                            {filteredUsages.length.toLocaleString()} รายการ จากทั้งหมด {usages.length.toLocaleString()} รายการ
                        </span>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['รหัสใช้งาน', 'โค้ดคูปอง', 'ผู้ใช้', 'รหัสการจอง', 'วันที่-เวลาใช้งาน'].map((h) => (
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
                                        <td colSpan={5} className="py-20 text-center">
                                            <FaSearch className="text-gray-200 mx-auto mb-3" size={28} />
                                            <p className="text-sm text-gray-400">
                                                {searchTerm
                                                    ? 'ไม่พบรายการที่ตรงกับคำค้นหา'
                                                    : 'ยังไม่มีประวัติการใช้งานคูปองในระบบ'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => {
                                        const user = users.find(u => u.id === item.user_id);
                                        const coupon = coupons.find(c => c.coupon_id === item.coupon_id);

                                        return (
                                            <tr
                                                key={item.usage_id}
                                                className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                                            >
                                                <td className="px-5 py-4 font-medium text-gray-900">#{item.usage_id}</td>
                                                <td className="px-5 py-4 font-mono text-gray-700">
                                                    {coupon?.coupon_code || `ID ${item.coupon_id}`}
                                                </td>
                                                <td className="px-5 py-4 text-gray-700">
                                                    {user?.name || `ID ${item.user_id}`}
                                                </td>
                                                <td className="px-5 py-4 text-gray-700">
                                                    {item.booking_id ? `#${item.booking_id}` : '—'}
                                                </td>
                                                <td className="px-5 py-4 text-gray-600">
                                                    {format(new Date(item.used_at), 'dd MMM yyyy • HH:mm')}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Table Footer ── */}
                    {filteredUsages.length > 0 && (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-xs text-gray-400">
                                แสดง <span className="font-medium text-gray-600">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredUsages.length)}
                                </span> จาก <span className="font-medium text-gray-600">{filteredUsages.length.toLocaleString()}</span> รายการ
                            </p>
                            <Pagination
                                current={currentPage}
                                total={totalPages}
                                onChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}