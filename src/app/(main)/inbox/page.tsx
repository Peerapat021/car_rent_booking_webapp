'use client';

import React, { useState } from "react";
import {
    Bell, CheckCircle, AlertCircle, Tag, Car, Calendar,
    ChevronRight, Trash2, Check, Filter, X, Phone,
    Shield, Zap, Gift, Star, ArrowUpRight, Clock
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type NotifCategory = "all" | "booking" | "promo" | "system" | "reminder";

type NotifType = "booking_confirm" | "booking_cancel" | "delivery" | "return_reminder"
    | "promo" | "review_prompt" | "system" | "payment";

interface Notification {
    id: string;
    type: NotifType;
    title: string;
    body: string;
    time: string;
    read: boolean;
    actionLabel?: string;
    actionHref?: string;
    meta?: string; // e.g. car name, booking id
    highlight?: boolean;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const initialNotifs: Notification[] = [
    {
        id: "n1",
        type: "delivery",
        title: "คนขับกำลังมาส่งรถแล้ว!",
        body: "คุณสมชาย ใจดี กำลังนำ BMW 320d M Sport มาส่งที่สนามบินสุวรรณภูมิ คาดถึงใน 25 นาที",
        time: "เมื่อกี้",
        read: false,
        actionLabel: "ติดตามตำแหน่ง",
        actionHref: "/track",
        meta: "BMW 320d • AURA-20241",
        highlight: true,
    },
    {
        id: "n2",
        type: "booking_confirm",
        title: "ยืนยันการจองสำเร็จ",
        body: "การจอง Mercedes-Benz GLE 300d ของคุณได้รับการยืนยันแล้ว วันรับรถ 20 มี.ค. 2568 ที่โรงแรม Sindhorn Midtown",
        time: "2 ชม. ที่แล้ว",
        read: false,
        actionLabel: "ดูรายละเอียด",
        actionHref: "/my-rentals",
        meta: "AURA-20198",
    },
    {
        id: "n3",
        type: "return_reminder",
        title: "แจ้งเตือน: คืนรถพรุ่งนี้",
        body: "โปรดคืน BMW 320d M Sport ภายในพรุ่งนี้ เวลา 10:00 น. ที่สนามบินสุวรรณภูมิ หากต้องการต่อสัญญาสามารถแจ้งได้เลย",
        time: "5 ชม. ที่แล้ว",
        read: false,
        actionLabel: "ต่อสัญญา",
        actionHref: "/my-rentals",
        meta: "BMW 320d • คืน 12 มี.ค.",
    },
    {
        id: "n4",
        type: "promo",
        title: "🎁 รับส่วนลด 15% สำหรับสมาชิก VIP",
        body: "เฉพาะคุณ! จองรถ Luxury class ภายใน 3 วันนี้รับส่วนลดทันที 15% ไม่จำกัดจำนวนวัน",
        time: "เมื่อวาน",
        read: true,
        actionLabel: "ใช้โปรโมชัน",
        actionHref: "/fleet",
        meta: "หมดเขต 11 มี.ค. 2568",
        highlight: false,
    },
    {
        id: "n5",
        type: "review_prompt",
        title: "รีวิวการเช่า Honda CR-V Turbo",
        body: "การเดินทางของคุณเสร็จสิ้นแล้ว ช่วยให้คะแนนและรีวิวเพื่อช่วยผู้เช่ารายอื่นด้วยนะครับ",
        time: "3 วันที่แล้ว",
        read: true,
        actionLabel: "เขียนรีวิว",
        actionHref: "/my-rentals",
        meta: "Honda CR-V • AURA-19501",
    },
    {
        id: "n6",
        type: "payment",
        title: "ชำระเงินสำเร็จ",
        body: "ชำระค่าเช่า Toyota Camry Hybrid ฿4,380 สำเร็จแล้ว ดาวน์โหลดใบเสร็จได้ที่หน้าการจอง",
        time: "4 วันที่แล้ว",
        read: true,
        actionLabel: "ดาวน์โหลดใบเสร็จ",
        actionHref: "/my-rentals",
        meta: "฿4,380 • AURA-19834",
    },
    {
        id: "n7",
        type: "promo",
        title: "รถใหม่เข้าระบบ: Porsche Cayenne S",
        body: "Porsche Cayenne S 440 แรงม้าพร้อมให้จองแล้ว! เปิดตัวราคาพิเศษ ฿9,900/วัน สัปดาห์แรกเท่านั้น",
        time: "1 สัปดาห์ที่แล้ว",
        read: true,
        actionLabel: "ดูรถ",
        actionHref: "/fleet",
        meta: "Porsche Cayenne S",
    },
    {
        id: "n8",
        type: "system",
        title: "อัปเดตนโยบายการยกเลิก",
        body: "เราได้ปรับนโยบายการยกเลิกใหม่ ยกเลิกฟรีได้ภายใน 24 ชม. ก่อนวันรับรถ โดยไม่มีค่าปรับใดๆ",
        time: "2 สัปดาห์ที่แล้ว",
        read: true,
        actionLabel: "อ่านเพิ่มเติม",
        actionHref: "/policy",
        meta: "ข้อมูลสำคัญ",
    },
];

// ── Icon + color per type ─────────────────────────────────────────────────────
const typeConfig: Record<NotifType, { icon: React.ReactNode; iconBg: string; iconColor: string; category: NotifCategory }> = {
    delivery: { icon: <Car className="w-4 h-4" />, iconBg: "bg-[#22c55e]/15", iconColor: "text-[#22c55e]", category: "booking" },
    booking_confirm: { icon: <CheckCircle className="w-4 h-4" />, iconBg: "bg-[#3b82f6]/15", iconColor: "text-[#3b82f6]", category: "booking" },
    booking_cancel: { icon: <X className="w-4 h-4" />, iconBg: "bg-[#ef4444]/15", iconColor: "text-[#ef4444]", category: "booking" },
    return_reminder: { icon: <Clock className="w-4 h-4" />, iconBg: "bg-[#f0c040]/15", iconColor: "text-[#ca9d32]", category: "reminder" },
    promo: { icon: <Gift className="w-4 h-4" />, iconBg: "bg-[#ca9d32]/15", iconColor: "text-[#ca9d32]", category: "promo" },
    review_prompt: { icon: <Star className="w-4 h-4" />, iconBg: "bg-[#f0c040]/15", iconColor: "text-[#f0c040]", category: "reminder" },
    system: { icon: <Shield className="w-4 h-4" />, iconBg: "bg-[#8a8a8a]/15", iconColor: "text-[#8a8a8a]", category: "system" },
    payment: { icon: <Zap className="w-4 h-4" />, iconBg: "bg-[#22c55e]/15", iconColor: "text-[#22c55e]", category: "system" },
};

const categoryTabs: { key: NotifCategory; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "booking", label: "การจอง" },
    { key: "reminder", label: "แจ้งเตือน" },
    { key: "promo", label: "โปรโมชัน" },
    { key: "system", label: "ระบบ" },
];

// ── Notif Card ────────────────────────────────────────────────────────────────
function NotifCard({
    notif,
    onRead,
    onDelete,
}: {
    notif: Notification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const cfg = typeConfig[notif.type];

    return (
        <div
            className={`
        group relative flex gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-200
        ${!notif.read
                    ? "bg-white border-[#e8e4dc] shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
                    : "bg-white/60 border-[#f0ede7]"}
        ${notif.highlight && !notif.read ? "ring-1 ring-[#22c55e]/30" : ""}
        hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:border-[#e0dbd4]
      `}
        >
            {/* Unread dot */}
            {!notif.read && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#ca9d32]" />
            )}

            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor} mt-0.5`}>
                {cfg.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-8 mb-1">
                    <h4 className={`text-sm font-bold leading-snug ${notif.read ? "text-[#4a4a4a]" : "text-[#1a1a1a]"}`}>
                        {notif.title}
                    </h4>
                </div>

                <p className={`text-sm leading-relaxed mb-2 ${notif.read ? "text-[#8a8a8a]" : "text-[#5a5a5a]"}`}>
                    {notif.body}
                </p>

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] text-[#a0988e] font-medium">{notif.time}</span>
                        {notif.meta && (
                            <span className="text-[11px] text-[#8a8a8a] bg-[#f0ede7] px-2.5 py-0.5 rounded-full font-medium">
                                {notif.meta}
                            </span>
                        )}
                    </div>

                    {notif.actionLabel && (
                        <a
                            href={notif.actionHref}
                            onClick={() => onRead(notif.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#ca9d32] hover:text-[#1a1a1a] transition-colors"
                        >
                            {notif.actionLabel}
                            <ArrowUpRight className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </div>

            {/* Hover actions */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white shadow-lg border border-[#ede9e0] rounded-xl p-1">
                {!notif.read && (
                    <button
                        onClick={() => onRead(notif.id)}
                        className="p-1.5 rounded-lg text-[#8a8a8a] hover:text-[#22c55e] hover:bg-[#f0fdf4] transition"
                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(notif.id)}
                    className="p-1.5 rounded-lg text-[#8a8a8a] hover:text-[#ef4444] hover:bg-[#fef2f2] transition"
                    title="ลบ"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InboxPage() {
    const [notifs, setNotifs] = useState<Notification[]>(initialNotifs);
    const [activeTab, setActiveTab] = useState<NotifCategory>("all");

    const unreadCount = notifs.filter(n => !n.read).length;

    const filtered = notifs.filter(n => {
        if (activeTab === "all") return true;
        return typeConfig[n.type].category === activeTab;
    });

    const unreadFiltered = filtered.filter(n => !n.read);
    const readFiltered = filtered.filter(n => n.read);

    const handleRead = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    const handleDelete = (id: string) => setNotifs(ns => ns.filter(n => n.id !== id));
    const handleReadAll = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })));

    const tabCounts: Record<NotifCategory, number> = {
        all: notifs.filter(n => !n.read).length,
        booking: notifs.filter(n => !n.read && typeConfig[n.type].category === "booking").length,
        reminder: notifs.filter(n => !n.read && typeConfig[n.type].category === "reminder").length,
        promo: notifs.filter(n => !n.read && typeConfig[n.type].category === "promo").length,
        system: notifs.filter(n => !n.read && typeConfig[n.type].category === "system").length,
    };

    return (
        <div
            className="min-h-screen bg-[#f5f4f0] pt-20 pb-28 lg:pb-12"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* ── HEADER ───────────────────────────────────────────── */}
            <div className="bg-[#1a1a1a] text-white">
                <div className="max-w-[860px] mx-auto px-6 sm:px-10 py-10 sm:py-12">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[#ca9d32] text-xs font-bold tracking-[0.2em] uppercase mb-2">AURA Premium</p>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                                แจ้งเตือน
                                {unreadCount > 0 && (
                                    <span className="text-base font-black px-3 py-1 rounded-full bg-[#ca9d32] text-black">
                                        {unreadCount}
                                    </span>
                                )}
                            </h1>
                            <p className="text-[#5a5a5a] text-sm mt-2">
                                {unreadCount > 0 ? `คุณมี ${unreadCount} การแจ้งเตือนที่ยังไม่ได้อ่าน` : "ทันสมัยทุกอย่างแล้ว ✓"}
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleReadAll}
                                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/8 border border-white/12 text-white/70 hover:text-white hover:bg-white/14 text-sm font-medium transition"
                            >
                                <Check className="w-4 h-4" />
                                <span className="hidden sm:inline">อ่านทั้งหมด</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CONTENT ──────────────────────────────────────────── */}
            <div className="max-w-[860px] mx-auto px-6 sm:px-10 py-7">

                {/* Category tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-6">
                    {categoryTabs.map(tab => {
                        const isActive = activeTab === tab.key;
                        const cnt = tabCounts[tab.key];
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${isActive
                                    ? "bg-[#1a1a1a] text-white shadow-sm"
                                    : "bg-white border border-[#ede9e0] text-[#6a6a6a] hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"
                                    }`}
                            >
                                {tab.label}
                                {cnt > 0 && (
                                    <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${isActive ? "bg-white/15 text-white" : "bg-[#ca9d32]/15 text-[#ca9d32]"}`}>
                                        {cnt}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {filtered.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-24">
                        <div className="w-20 h-20 rounded-full bg-white border border-[#ede9e0] flex items-center justify-center mx-auto mb-5 shadow-sm">
                            <Bell className="w-8 h-8 text-[#c0bab2]" />
                        </div>
                        <h3 className="text-xl font-black text-[#1a1a1a] mb-2">ไม่มีการแจ้งเตือน</h3>
                        <p className="text-[#8a8a8a] text-sm">ยังไม่มีการแจ้งเตือนในหมวดหมู่นี้</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Unread section */}
                        {unreadFiltered.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest">
                                        ยังไม่ได้อ่าน · {unreadFiltered.length}
                                    </h2>
                                    <button
                                        onClick={handleReadAll}
                                        className="text-[11px] font-bold text-[#ca9d32] hover:text-[#1a1a1a] transition flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" /> อ่านทั้งหมด
                                    </button>
                                </div>
                                <div className="space-y-2.5">
                                    {unreadFiltered.map(n => (
                                        <NotifCard key={n.id} notif={n} onRead={handleRead} onDelete={handleDelete} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Read section */}
                        {readFiltered.length > 0 && (
                            <div>
                                <h2 className="text-xs font-bold text-[#b0a898] uppercase tracking-widest mb-3">
                                    อ่านแล้ว · {readFiltered.length}
                                </h2>
                                <div className="space-y-2">
                                    {readFiltered.map(n => (
                                        <NotifCard key={n.id} notif={n} onRead={handleRead} onDelete={handleDelete} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Notification settings hint */}
                {notifs.length > 0 && (
                    <div className="mt-10 flex items-center justify-between p-5 rounded-2xl border border-[#ede9e0] bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#f0ede7] flex items-center justify-center">
                                <Bell className="w-4 h-4 text-[#8a8a8a]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#1a1a1a]">ตั้งค่าการแจ้งเตือน</p>
                                <p className="text-xs text-[#8a8a8a]">จัดการประเภทการแจ้งเตือนที่ต้องการรับ</p>
                            </div>
                        </div>
                        <a
                            href="/settings"
                            className="flex items-center gap-1.5 text-xs font-bold text-[#ca9d32] hover:text-[#1a1a1a] transition"
                        >
                            ตั้งค่า <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )}
            </div>

            <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}