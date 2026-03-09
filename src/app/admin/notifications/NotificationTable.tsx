'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    FaSearch,
    FaBell,
    FaChevronDown,
    FaExclamationTriangle,
    FaMoneyBillWave,
    FaCar,
    FaEye,
    FaCheckCircle,
    FaHistory,
    FaFilter,
    FaTimes,
} from 'react-icons/fa';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

import { getNotifications } from "@/lib/services/client/admin/notifications/get";
import { patchNotification, patchAllNotifications } from "@/lib/services/client/admin/notifications/patch";
import { getUsers } from "@/lib/services/client/admin/users/get";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

interface Notification {
    notification_id: number;
    user_id: number;
    booking_id: number | null;
    title: string;
    message: string;
    notif_type: string;
    notif_priority: "low" | "normal" | "high" | "urgent" | null;
    is_read: boolean | null;
    created_at: Date;
}

interface User {
    id: number;
    name: string;
}

// ────────────────────────────────────────────────
// Priority Badge
// ────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Notification['notif_priority'] }) {
    const config = {
        low: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
        normal: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
        high: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
        urgent: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };

    const p = priority ?? 'normal';
    const c = config[p];

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} shadow-sm`}>
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {p.charAt(0).toUpperCase() + p.slice(1)}
        </span>
    );
}

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────

export default function NotificationManagementPage({ initialNotifications }: { initialNotifications: Notification[] }) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [newNotificationIds, setNewNotificationIds] = useState<Set<number>>(new Set());
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    type TabType = 'all' | 'booking' | 'payment' | 'alerts';
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const [readStatus, setReadStatus] = useState<'all' | 'read' | 'unread'>('unread');

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

    const [displayCount, setDisplayCount] = useState(20);

    const typePopoverRef = useRef<HTMLDivElement>(null);
    const priorityPopoverRef = useRef<HTMLDivElement>(null);
    const [showTypePopover, setShowTypePopover] = useState(false);
    const [showPriorityPopover, setShowPriorityPopover] = useState(false);

    const allowedTypes = [
        "booking_created",
        "pickup_reminder",
        "return_reminder",
        "overdue",
        "payment_success",
        "refund",
        "maintenance",
    ];

    const tabTypeMapping: Record<TabType, string[]> = {
        all: allowedTypes,
        booking: ["booking_created", "pickup_reminder", "return_reminder"],
        payment: ["payment_success", "refund"],
        alerts: ["overdue", "maintenance"],
    };

    const unreadByTab = useMemo<Record<TabType, number>>(() => {
        const result = { all: 0, booking: 0, payment: 0, alerts: 0 };
        notifications.forEach(n => {
            if (!n.is_read) {
                result.all += 1;
                if (tabTypeMapping.booking.includes(n.notif_type)) result.booking += 1;
                if (tabTypeMapping.payment.includes(n.notif_type)) result.payment += 1;
                if (tabTypeMapping.alerts.includes(n.notif_type)) result.alerts += 1;
            }
        });
        return result;
    }, [notifications]);

    const stats = useMemo(() => {
        let data = notifications.filter(n => tabTypeMapping[activeTab].includes(n.notif_type));

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        if (readStatus === 'unread') {
            data = data.filter(n => !n.is_read && new Date(n.created_at).getTime() >= oneDayAgo);
        } else if (readStatus === 'read') {
            data = data.filter(n => n.is_read);
        }

        const unreadInView = data.filter(n => !n.is_read).length;
        const readInView = data.filter(n => n.is_read).length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return {
            total: data.length,
            unread: unreadInView,
            read: readInView,
            unreadLast7days: data.filter(n => !n.is_read && new Date(n.created_at) >= sevenDaysAgo).length,
        };
    }, [notifications, activeTab, readStatus]);

    const toggleValue = <T extends string>(arr: T[], value: T): T[] =>
        arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

    const resetFilters = () => {
        setSelectedTypes([]);
        setSelectedPriorities([]);
        setSearchTerm('');
        setDisplayCount(20);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (typePopoverRef.current && !typePopoverRef.current.contains(event.target as Node)) {
                setShowTypePopover(false);
            }
            if (priorityPopoverRef.current && !priorityPopoverRef.current.contains(event.target as Node)) {
                setShowPriorityPopover(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = useCallback(async (notificationId: number) => {
        setNotifications(prev => prev.map(n =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
        ));

        try {
            await patchNotification(notificationId);
        } catch (err) {
            console.error(err);
            setNotifications(prev => prev.map(n =>
                n.notification_id === notificationId ? { ...n, is_read: false } : n
            ));
            alert("ไม่สามารถบันทึกสถานะอ่านได้");
        }
    }, []);

    const markAllAsRead = async () => {
        if (stats.unread === 0) return;
        if (!confirm(`ยืนยันการอ่านทั้งหมด ${stats.unread} รายการ?`)) return;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        try {
            await patchAllNotifications();
        } catch (err) {
            alert("เกิดข้อผิดพลาด");
            fetchData();
        }
    };

    const fetchData = async (isInitial = false) => {
        try {
            if (!isInitial) setIsRefreshing(true);
            const [notifs, userList] = await Promise.all([getNotifications(), getUsers()]);

            const filteredNotifs = notifs.filter((n: Notification) => allowedTypes.includes(n.notif_type));

            setNotifications(filteredNotifs || []);
            setUsers(userList || []);
            setLastUpdated(new Date());

            if (!isInitial && notifications.length > 0) {
                const existing = new Set(notifications.map(n => n.notification_id));
                const newIds = filteredNotifs
                    .filter((n: Notification) => !existing.has(n.notification_id) && !n.is_read)
                    .map((n: Notification) => n.notification_id);
                if (newIds.length > 0) {
                    setNewNotificationIds(new Set(newIds));
                    setTimeout(() => setNewNotificationIds(new Set()), 5000);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (isInitial) setIsInitialLoading(false);
            else setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData(true);
    }, []);

    const filteredNotifications = useMemo(() => {
        let data = notifications.filter(n => tabTypeMapping[activeTab].includes(n.notif_type));

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        if (readStatus === 'unread') {
            data = data.filter(n => !n.is_read && new Date(n.created_at).getTime() >= oneDayAgo);
        } else if (readStatus === 'read') {
            data = data.filter(n => n.is_read);
        }

        data = data.filter(item => {
            const user = users.find(u => u.id === item.user_id);
            const q = searchTerm.toLowerCase().trim();

            const match =
                !q ||
                item.notification_id.toString().includes(q) ||
                item.title?.toLowerCase().includes(q) ||
                item.message?.toLowerCase().includes(q) ||
                user?.name?.toLowerCase().includes(q) ||
                item.booking_id?.toString().includes(q) ||
                item.notif_type?.toLowerCase().includes(q);

            if (!match) return false;
            if (selectedTypes.length > 0 && !selectedTypes.includes(item.notif_type || '')) return false;
            if (selectedPriorities.length > 0 && !selectedPriorities.includes(item.notif_priority || '')) return false;

            return true;
        });

        return data
            .sort((a, b) => {
                const priOrder = { urgent: 4, high: 3, normal: 2, low: 1, null: 0 };
                const pa = priOrder[a.notif_priority ?? 'null'];
                const pb = priOrder[b.notif_priority ?? 'null'];
                if (pa !== pb) return pb - pa;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, displayCount);
    }, [notifications, users, searchTerm, selectedTypes, selectedPriorities, readStatus, displayCount, activeTab]);

    const hasMore = filteredNotifications.length < notifications.filter(n => tabTypeMapping[activeTab].includes(n.notif_type)).length;

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-800 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">กำลังโหลดข้อมูลแจ้งเตือน...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">การจัดการแจ้งเตือน</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            อัปเดตล่าสุด: {format(lastUpdated, 'dd MMM yyyy HH:mm น.', { locale: th })}
                            {isRefreshing && <span className="ml-2 text-blue-600 animate-pulse">(กำลังรีเฟรช...)</span>}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                        {[
                            { id: 'all', label: 'ทั้งหมด', icon: FaBell, unread: unreadByTab.all },
                            { id: 'booking', label: 'การจอง', icon: FaCar, unread: unreadByTab.booking },
                            { id: 'payment', label: 'การเงิน', icon: FaMoneyBillWave, unread: unreadByTab.payment },
                            // { id: 'alerts', label: 'แจ้งเตือนด่วน', icon: FaExclamationTriangle, unread: unreadByTab.alerts },
                        ].map(tab => {
                            const isActive = activeTab === tab.id;
                            const hasUnread = tab.unread > 0;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as TabType);
                                        setReadStatus('unread');
                                        setDisplayCount(20);
                                        resetFilters();
                                    }}
                                    className={`
                    relative flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors
                    ${isActive
                                            ? 'text-gray-900 border-b-2 border-gray-900 font-semibold'
                                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                  `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {hasUnread && (
                                        <span className="ml-1.5 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {tab.unread}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">ทั้งหมด (แท็บนี้)</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                        </div>
                        <FaBell className="text-blue-600 mt-3" size={28} />
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">ยังไม่อ่าน</p>
                            <p className="text-2xl font-bold text-red-600">{stats.unread.toLocaleString()}</p>
                        </div>
                        <FaCheckCircle className="text-red-600 mt-3" size={28} />
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">อ่านแล้ว</p>
                            <p className="text-2xl font-bold text-emerald-600">{stats.read.toLocaleString()}</p>
                        </div>
                        <FaEye className="text-emerald-600 mt-3" size={28} />
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">7 วัน (ยังไม่อ่าน)</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.unreadLast7days.toLocaleString()}</p>
                        <FaHistory className="text-amber-600 mt-3" size={28} />
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="space-y-5">
                    <div className="relative max-w-2xl">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="ค้นหา ID, หัวข้อ, ข้อความ, ผู้ใช้, ประเภท..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 outline-none shadow-sm transition"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Type Filter */}
                        <div className="relative" ref={typePopoverRef}>
                            <button
                                onClick={() => setShowTypePopover(!showTypePopover)}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium transition ${selectedTypes.length > 0
                                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <FaFilter size={13} />
                                ประเภท
                                {selectedTypes.length > 0 && (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                        {selectedTypes.length}
                                    </span>
                                )}
                            </button>

                            {showTypePopover && (
                                <div className="absolute z-50 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg">
                                    <div className="max-h-72 overflow-y-auto p-2">
                                        {tabTypeMapping[activeTab].map(t => (
                                            <label key={t} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTypes.includes(t)}
                                                    onChange={() => setSelectedTypes(prev => toggleValue(prev, t))}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700">{t}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="border-t px-4 py-3 flex justify-end bg-gray-50">
                                        <button onClick={() => setShowTypePopover(false)} className="text-sm text-gray-600 hover:text-gray-900">
                                            ปิด
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Priority Filter */}
                        <div className="relative" ref={priorityPopoverRef}>
                            <button
                                onClick={() => setShowPriorityPopover(!showPriorityPopover)}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium transition ${selectedPriorities.length > 0
                                    ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <FaExclamationTriangle size={13} />
                                ความสำคัญ
                                {selectedPriorities.length > 0 && (
                                    <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                        {selectedPriorities.length}
                                    </span>
                                )}
                            </button>

                            {showPriorityPopover && (
                                <div className="absolute z-50 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg">
                                    <div className="p-2">
                                        {['low', 'normal', 'high', 'urgent'].map(p => (
                                            <label key={p} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPriorities.includes(p)}
                                                    onChange={() => setSelectedPriorities(prev => toggleValue(prev, p))}
                                                    className="w-4 h-4 text-amber-600 rounded border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700 capitalize">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="border-t px-4 py-3 flex justify-end bg-gray-50">
                                        <button onClick={() => setShowPriorityPopover(false)} className="text-sm text-gray-600 hover:text-gray-900">
                                            ปิด
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Read Status Toggle */}
                        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
                            <button
                                onClick={() => setReadStatus('all')}
                                className={`px-5 py-2.5 text-sm font-medium ${readStatus === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                ทั้งหมด
                            </button>
                            <button
                                onClick={() => setReadStatus('unread')}
                                className={`px-5 py-2.5 text-sm font-medium border-l border-gray-200 ${readStatus === 'unread' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                ยังไม่อ่าน
                            </button>
                            <button
                                onClick={() => setReadStatus('read')}
                                className={`px-5 py-2.5 text-sm font-medium border-l border-gray-200 ${readStatus === 'read' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                อ่านแล้ว
                            </button>
                        </div>

                        {(searchTerm || selectedTypes.length || selectedPriorities.length || readStatus !== 'all') && (
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition"
                            >
                                <FaTimes size={13} />
                                ล้างตัวกรอง
                            </button>
                        )}

                        <button
                            onClick={markAllAsRead}
                            disabled={stats.unread === 0}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition shadow-sm ${stats.unread === 0
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            <FaEye size={14} />
                            อ่านทั้งหมด ({stats.unread})
                        </button>
                    </div>
                </div>

                {/* Notification List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Desktop Table */}
                    <div className="overflow-x-auto hidden lg:block">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">แจ้งเตือน</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้รับ</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภท</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ความสำคัญ</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredNotifications.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-gray-500">
                                            <FaBell className="mx-auto text-gray-300 mb-3" size={32} />
                                            ไม่พบแจ้งเตือนที่ตรงกับเงื่อนไข
                                        </td>
                                    </tr>
                                ) : (
                                    filteredNotifications.map(item => {
                                        const user = users.find(u => u.id === item.user_id);
                                        const isNew = newNotificationIds.has(item.notification_id);
                                        const isUnread = !item.is_read;

                                        return (
                                            <tr
                                                key={item.notification_id}
                                                onClick={() => !item.is_read && markAsRead(item.notification_id)}
                                                className={`cursor-pointer transition-colors hover:bg-gray-50/70 ${isNew ? 'bg-emerald-50/50 animate-pulse' : ''} ${isUnread ? 'bg-blue-50/30 font-medium' : ''}`}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0">
                                                            {isNew && <span className="inline-block bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ใหม่</span>}
                                                            {isUnread && !isNew && <span className="w-2.5 h-2.5 mt-1.5 bg-blue-500 rounded-full block" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">#{item.notification_id} • {item.title}</p>
                                                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{item.message}</p>
                                                            {item.booking_id && (
                                                                <p className="text-xs text-gray-500 mt-1">Booking ID: {item.booking_id}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-gray-700">{user?.name || `ผู้ใช้ ${item.user_id}`}</td>
                                                <td className="px-6 py-5 text-sm text-gray-600 font-mono">{item.notif_type}</td>
                                                <td className="px-6 py-5"><PriorityBadge priority={item.notif_priority} /></td>
                                                <td className="px-6 py-5">
                                                    {item.is_read ? (
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                                                            <FaCheckCircle size={14} /> อ่านแล้ว
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-red-700 text-sm font-medium">
                                                            <FaBell size={14} /> ยังไม่อ่าน
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-gray-600">
                                                    {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: th })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden divide-y divide-gray-100">
                        {filteredNotifications.length === 0 ? (
                            <div className="py-16 text-center text-gray-500">
                                <FaBell className="mx-auto text-gray-300 mb-3" size={32} />
                                ไม่พบแจ้งเตือนที่ตรงกับเงื่อนไข
                            </div>
                        ) : (
                            filteredNotifications.map(item => {
                                const user = users.find(u => u.id === item.user_id);
                                const isNew = newNotificationIds.has(item.notification_id);
                                const isUnread = !item.is_read;

                                return (
                                    <div
                                        key={item.notification_id}
                                        onClick={() => !item.is_read && markAsRead(item.notification_id)}
                                        className={`p-5 cursor-pointer transition-colors hover:bg-gray-50/70 ${isNew ? 'bg-emerald-50/60' : ''} ${isUnread ? 'bg-blue-50/30 border-l-4 border-l-blue-500' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-900">#{item.notification_id}</span>
                                                    {isNew && <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">ใหม่</span>}
                                                    {isUnread && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                                </div>
                                                <h3 className="font-medium text-gray-900 line-clamp-2">{item.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-3">{item.message}</p>
                                            </div>
                                            <PriorityBadge priority={item.notif_priority} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                            <div>
                                                <p className="text-gray-500">ผู้รับ</p>
                                                <p className="font-medium text-gray-800">{user?.name || `ID ${item.user_id}`}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">ประเภท</p>
                                                <p className="font-medium font-mono text-gray-700">{item.notif_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">สถานะ</p>
                                                <p className="font-medium">
                                                    {item.is_read ? 'อ่านแล้ว' : 'ยังไม่อ่าน'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">วันที่</p>
                                                <p className="font-medium text-gray-700">
                                                    {format(new Date(item.created_at), 'dd MMM HH:mm', { locale: th })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="p-6 text-center border-t border-gray-100">
                            <button
                                onClick={() => setDisplayCount(prev => prev + 20)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition shadow-sm"
                            >
                                <FaChevronDown size={14} />
                                ดูเพิ่มอีก {Math.min(20, stats.total - displayCount)} รายการ
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="text-center text-sm text-gray-500">
                    แสดง {filteredNotifications.length.toLocaleString()} รายการ
                    {(searchTerm || selectedTypes.length || selectedPriorities.length || readStatus !== 'all') && (
                        <> จากทั้งหมด {stats.total.toLocaleString()} รายการ</>
                    )}
                </div>
            </div>
        </div>
    );
}