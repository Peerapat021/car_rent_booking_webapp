'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaDownload,
    FaSearch,
    FaUserCheck,
    FaUserTimes,
    FaUsers,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';
import { format } from 'date-fns';

import { deleteUser } from '@/lib/services/client/admin/users/delete';

// ── Types ──────────────────────────────────────────────────────────────────────

interface User {
    id: number;
    name: string;
    birth_date: string | null;
    email: string;
    user_role: string;
    user_phone?: string | null;
    user_blacklist?: boolean;
    create_at_user: string;
    branch_id?: number | null;
}

// ── Stat Card (copy style จากหน้า cars) ───────────────────────────────────────

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

// ── Pagination (copy มาทั้งชุด) ───────────────────────────────────────────────

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

export default function UserManagementPage({ users }: { users: User[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        blacklisted: 0,
    });

    const itemsPerPage = 10;

    useEffect(() => {
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!users.length) return;

        const blacklistedCount = users.filter((u) => u.user_blacklist).length;

        setStats({
            total: users.length,
            active: users.length - blacklistedCount,
            blacklisted: blacklistedCount,
        });
    }, [users]);

    const filteredUsers = users.filter((user) =>
        !searchTerm.trim() ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        user.user_phone?.includes(searchTerm.trim()) ||
        `${user.id}`.includes(searchTerm.trim())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const currentItems = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete?.id) return;

        try {
            await deleteUser(userToDelete.id.toString());
            // refresh หรือ reload หน้า (วิธีง่ายที่สุดตาม pattern เดิม)
            window.location.reload();
        } catch (err: any) {
            alert(err.message || 'ลบผู้ใช้ไม่สำเร็จ กรุณาลองใหม่');
        } finally {
            setDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">กำลังโหลดข้อมูลผู้ใช้...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">จัดการผู้ใช้ (ลูกค้า)</h1>
                        <p className="text-sm text-gray-400 mt-1">ดูและจัดการข้อมูลลูกค้าทั้งหมดในระบบ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            <FaDownload size={13} /> ดาวน์โหลด
                        </button>
                        <button
                            onClick={() => router.push('/admin/users/new')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                        >
                            <FaPlus size={12} /> เพิ่มผู้ใช้ใหม่
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        label="ลูกค้าทั้งหมด"
                        value={stats.total.toLocaleString()}
                        icon={<FaUsers className="text-blue-600" size={18} />}
                        accent="bg-blue-50"
                    />
                    <StatCard
                        label="ใช้งานปกติ"
                        value={stats.active.toLocaleString()}
                        icon={<FaUserCheck className="text-emerald-600" size={18} />}
                        accent="bg-emerald-50"
                    />
                    <StatCard
                        label="อยู่ใน Blacklist"
                        value={stats.blacklisted.toLocaleString()}
                        icon={<FaUserTimes className="text-rose-600" size={18} />}
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
                            placeholder="ค้นหา ชื่อ • อีเมล • เบอร์โทร • ID..."
                            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
                        />
                    </div>

                    {searchTerm && (
                        <span className="ml-auto text-xs text-gray-400">
                            {filteredUsers.length.toLocaleString()} คน จากทั้งหมด {users.length.toLocaleString()} คน
                        </span>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['ID', 'ชื่อ', 'อีเมล', 'เบอร์โทร', 'วันเกิด', 'ตำแหน่ง', 'สถานะ', 'สร้างเมื่อ', 'จัดการ'].map((h) => (
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
                                        <td colSpan={9} className="py-20 text-center">
                                            <FaSearch className="text-gray-200 mx-auto mb-3" size={28} />
                                            <p className="text-sm text-gray-400">
                                                {searchTerm
                                                    ? 'ไม่พบผู้ใช้ที่ตรงกับคำค้นหา'
                                                    : 'ยังไม่มีข้อมูลลูกค้าในระบบ'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                                        >
                                            <td className="px-5 py-4 font-medium text-gray-900">#{user.id}</td>
                                            <td className="px-5 py-4 text-gray-700">{user.name || '—'}</td>
                                            <td className="px-5 py-4 text-gray-700 font-mono text-sm">{user.email}</td>
                                            <td className="px-5 py-4 text-gray-700">{user.user_phone || '—'}</td>
                                            <td className="px-5 py-4 text-gray-700">
                                                {user.birth_date ? format(new Date(user.birth_date), 'dd MMM yyyy') : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
                                                    {user.user_role || '—'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.user_blacklist
                                                            ? 'bg-rose-50 text-rose-700'
                                                            : 'bg-emerald-50 text-emerald-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${user.user_blacklist ? 'bg-rose-500' : 'bg-emerald-500'
                                                            }`}
                                                    />
                                                    {user.user_blacklist ? 'Blacklist' : 'ปกติ'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {format(new Date(user.create_at_user), 'dd MMM yyyy')}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => router.push(`/admin/users/${user.id}`)}
                                                        title="แก้ไข"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(user)}
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
                    {filteredUsers.length > 0 && (
                        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-xs text-gray-400">
                                แสดง{' '}
                                <span className="font-medium text-gray-600">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                                </span>{' '}
                                จาก <span className="font-medium text-gray-600">{filteredUsers.length.toLocaleString()}</span> คน
                            </p>
                            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
                        </div>
                    )}
                </div>

            </div>

            {/* ── Delete Modal ── */}
            {deleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">ยืนยันการลบผู้ใช้</h2>
                        <p className="text-gray-700 mb-6 leading-relaxed">
                            คุณแน่ใจหรือไม่ที่จะลบผู้ใช้
                            <br />
                            <span className="font-semibold text-gray-900">
                                "{userToDelete.name}" (ID: {userToDelete.id})
                            </span>
                            ?
                            <br /><br />
                            การกระทำนี้ไม่สามารถย้อนกลับได้
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
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