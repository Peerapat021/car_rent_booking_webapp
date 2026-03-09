'use client';

import React, { useState } from "react";
import {
    Calendar, MapPin, Clock, ChevronRight, Shield, Phone,
    Download, XCircle, RotateCcw, Star, CheckCircle,
    AlertCircle, Hourglass, Car, ArrowUpRight, Search, Filter
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type RentalStatus = "active" | "upcoming" | "completed" | "cancelled";

interface Rental {
    id: string;
    car: string;
    brand: string;
    type: string;
    plate: string;
    image: string;
    status: RentalStatus;
    pickupDate: string;
    returnDate: string;
    pickupLocation: string;
    totalPrice: number;
    days: number;
    pricePerDay: number;
    insurance: string;
    driver?: string;
    driverPhone?: string;
    rating?: number;
    reviewed?: boolean;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const rentals: Rental[] = [
    {
        id: "AURA-20241",
        car: "320d M Sport",
        brand: "BMW",
        type: "Sedan",
        plate: "กข 1234",
        image: "🚗",
        status: "active",
        pickupDate: "8 มี.ค. 2568",
        returnDate: "12 มี.ค. 2568",
        pickupLocation: "สนามบินสุวรรณภูมิ",
        totalPrice: 18360,
        days: 4,
        pricePerDay: 4590,
        insurance: "ชั้น 1",
        driver: "คุณสมชาย ใจดี",
        driverPhone: "081-234-5678",
    },
    {
        id: "AURA-20198",
        car: "GLE 300d",
        brand: "Mercedes-Benz",
        type: "SUV",
        plate: "คง 5678",
        image: "🚙",
        status: "upcoming",
        pickupDate: "20 มี.ค. 2568",
        returnDate: "25 มี.ค. 2568",
        pickupLocation: "โรงแรม Sindhorn Midtown",
        totalPrice: 34450,
        days: 5,
        pricePerDay: 6890,
        insurance: "ชั้น 1",
    },
    {
        id: "AURA-19834",
        car: "Camry Hybrid",
        brand: "Toyota",
        type: "Sedan",
        plate: "งจ 9012",
        image: "🚗",
        status: "completed",
        pickupDate: "14 ก.พ. 2568",
        returnDate: "16 ก.พ. 2568",
        pickupLocation: "ลาดพร้าว 71",
        totalPrice: 4380,
        days: 2,
        pricePerDay: 2190,
        insurance: "ชั้น 1",
        rating: 5,
        reviewed: true,
    },
    {
        id: "AURA-19501",
        car: "CR-V Turbo",
        brand: "Honda",
        type: "SUV",
        plate: "ฉช 3456",
        image: "🚙",
        status: "completed",
        pickupDate: "2 ม.ค. 2568",
        returnDate: "5 ม.ค. 2568",
        pickupLocation: "สยามพารากอน",
        totalPrice: 7770,
        days: 3,
        pricePerDay: 2590,
        insurance: "ชั้น 1",
        rating: 4,
        reviewed: false,
    },
    {
        id: "AURA-19102",
        car: "Model S Plaid",
        brand: "Tesla",
        type: "Electric",
        plate: "ซฌ 7890",
        image: "⚡",
        status: "cancelled",
        pickupDate: "25 ธ.ค. 2567",
        returnDate: "27 ธ.ค. 2567",
        pickupLocation: "ท่าอากาศยานดอนเมือง",
        totalPrice: 14980,
        days: 2,
        pricePerDay: 7490,
        insurance: "ชั้น 1",
    },
];

// ── Status Config ─────────────────────────────────────────────────────────────
const statusConfig: Record<RentalStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    active: {
        label: "กำลังใช้งาน",
        color: "text-[#22c55e]",
        bg: "bg-[#22c55e]/10",
        border: "border-[#22c55e]/20",
        icon: <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse inline-block" />,
    },
    upcoming: {
        label: "กำลังจะมาถึง",
        color: "text-[#3b82f6]",
        bg: "bg-[#3b82f6]/10",
        border: "border-[#3b82f6]/20",
        icon: <Hourglass className="w-3.5 h-3.5 text-[#3b82f6]" />,
    },
    completed: {
        label: "เสร็จสิ้น",
        color: "text-[#8a8a8a]",
        bg: "bg-[#f0ede7]",
        border: "border-[#ede9e0]",
        icon: <CheckCircle className="w-3.5 h-3.5 text-[#8a8a8a]" />,
    },
    cancelled: {
        label: "ยกเลิกแล้ว",
        color: "text-[#ef4444]",
        bg: "bg-[#ef4444]/8",
        border: "border-[#ef4444]/20",
        icon: <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />,
    },
};

// ── Filter Tabs ───────────────────────────────────────────────────────────────
const tabs: { key: "all" | RentalStatus; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "active", label: "กำลังใช้งาน" },
    { key: "upcoming", label: "กำลังจะมาถึง" },
    { key: "completed", label: "เสร็จสิ้น" },
    { key: "cancelled", label: "ยกเลิก" },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RentalStatus }) {
    const cfg = statusConfig[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

function RentalCard({ rental, onExpand }: { rental: Rental; onExpand: (id: string) => void }) {
    const isActive = rental.status === "active";
    const isUpcoming = rental.status === "upcoming";
    const isCompleted = rental.status === "completed";
    const isCancelled = rental.status === "cancelled";

    return (
        <div
            className={`group bg-white rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.09)] ${isActive
                ? "border-[#22c55e]/30 shadow-[0_4px_24px_rgba(34,197,94,0.08)]"
                : isUpcoming
                    ? "border-[#3b82f6]/25 shadow-[0_4px_24px_rgba(59,130,246,0.07)]"
                    : "border-[#ede9e0]"
                }`}
        >
            {/* Active top bar */}
            {isActive && (
                <div className="h-1 bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#22c55e] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
            )}
            {isUpcoming && (
                <div className="h-1 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]" />
            )}

            <div className="p-5 sm:p-6">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-4">
                        {/* Car emoji thumbnail */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${isCancelled ? "bg-[#f5f4f0] opacity-50" : "bg-[#f5f4f0]"}`}>
                            {rental.image}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-[#ca9d32] uppercase tracking-widest">{rental.brand}</p>
                            <h3 className="text-lg font-black text-[#1a1a1a] leading-tight">{rental.car}</h3>
                            <p className="text-xs text-[#8a8a8a] mt-0.5 font-medium">
                                {rental.type} • ทะเบียน {rental.plate}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={rental.status} />
                        <p className="text-[10px] text-[#8a8a8a] font-mono">{rental.id}</p>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    <div className="bg-[#f8f6f2] rounded-xl p-3">
                        <p className="text-[9px] font-bold text-[#8a8a8a] uppercase tracking-widest mb-1">วันรับรถ</p>
                        <p className="text-sm font-bold text-[#1a1a1a]">{rental.pickupDate}</p>
                    </div>
                    <div className="bg-[#f8f6f2] rounded-xl p-3">
                        <p className="text-[9px] font-bold text-[#8a8a8a] uppercase tracking-widest mb-1">วันคืนรถ</p>
                        <p className="text-sm font-bold text-[#1a1a1a]">{rental.returnDate}</p>
                    </div>
                    <div className="bg-[#f8f6f2] rounded-xl p-3 col-span-2 sm:col-span-1">
                        <p className="text-[9px] font-bold text-[#8a8a8a] uppercase tracking-widest mb-1">สถานที่รับ</p>
                        <p className="text-sm font-bold text-[#1a1a1a] truncate">{rental.pickupLocation}</p>
                    </div>
                </div>

                {/* Price + days */}
                <div className="flex items-center justify-between bg-[#f8f6f2] rounded-xl px-4 py-3 mb-4">
                    <div className="flex items-center gap-4 text-sm text-[#6a6a6a]">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#ca9d32]" />
                            {rental.days} วัน × {rental.pricePerDay.toLocaleString()} ฿
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-[#22c55e]" />
                            ประกัน{rental.insurance}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className={`text-xl font-black ${isCancelled ? "text-[#b0a898] line-through" : "text-[#1a1a1a]"}`}>
                            ฿{rental.totalPrice.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Driver info (active only) */}
                {isActive && rental.driver && (
                    <div className="flex items-center justify-between bg-[#22c55e]/6 border border-[#22c55e]/15 rounded-xl px-4 py-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e] font-black text-xs">
                                {rental.driver[2]}
                            </div>
                            <div>
                                <p className="text-xs text-[#5a5a5a]">คนขับรถของคุณ</p>
                                <p className="text-sm font-bold text-[#1a1a1a]">{rental.driver}</p>
                            </div>
                        </div>
                        <a
                            href={`tel:${rental.driverPhone}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#22c55e] text-white text-xs font-bold hover:bg-[#16a34a] transition active:scale-95"
                        >
                            <Phone className="w-3.5 h-3.5" /> โทร
                        </a>
                    </div>
                )}

                {/* Review prompt (completed, not reviewed) */}
                {isCompleted && !rental.reviewed && (
                    <div className="flex items-center justify-between bg-[#f0c040]/8 border border-[#f0c040]/20 rounded-xl px-4 py-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#7a6010]">
                            <Star className="w-4 h-4 text-[#f0c040] fill-[#f0c040]" />
                            ให้คะแนนการเช่าครั้งนี้
                        </div>
                        <button className="px-4 py-1.5 rounded-full bg-[#ca9d32] text-black text-xs font-bold hover:bg-[#f0c040] transition active:scale-95">
                            รีวิว
                        </button>
                    </div>
                )}

                {/* Reviewed stars */}
                {isCompleted && rental.reviewed && rental.rating && (
                    <div className="flex items-center gap-2 text-sm text-[#8a8a8a] mb-4">
                        <div className="flex text-[#f0c040]">
                            {"★".repeat(rental.rating)}{"☆".repeat(5 - rental.rating)}
                        </div>
                        <span>คุณรีวิวแล้ว</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                    {isActive && (
                        <>
                            <button className="flex-1 min-w-[140px] py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#ca9d32] transition-all duration-200 active:scale-[0.98]">
                                <MapPin className="w-4 h-4" /> ติดตามรถ
                            </button>
                            <button className="py-3 px-4 rounded-xl border border-[#ede9e0] text-[#6a6a6a] hover:text-[#1a1a1a] hover:border-[#1a1a1a] text-sm font-medium transition flex items-center gap-2">
                                <Phone className="w-4 h-4" /> ติดต่อ
                            </button>
                        </>
                    )}
                    {isUpcoming && (
                        <>
                            <button className="flex-1 min-w-[140px] py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#3b82f6] transition-all duration-200 active:scale-[0.98]">
                                <Calendar className="w-4 h-4" /> แก้ไขวันจอง
                            </button>
                            <button className="py-3 px-4 rounded-xl border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/8 text-sm font-medium transition flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> ยกเลิก
                            </button>
                        </>
                    )}
                    {isCompleted && (
                        <>
                            <button className="flex-1 min-w-[140px] py-3 rounded-xl bg-[#1a1a1a] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#ca9d32] transition-all duration-200 active:scale-[0.98]">
                                <RotateCcw className="w-4 h-4" /> จองซ้ำ
                            </button>
                            <button className="py-3 px-4 rounded-xl border border-[#ede9e0] text-[#6a6a6a] hover:border-[#ca9d32]/40 hover:text-[#1a1a1a] text-sm font-medium transition flex items-center gap-2">
                                <Download className="w-4 h-4" /> ใบเสร็จ
                            </button>
                        </>
                    )}
                    {isCancelled && (
                        <button className="flex-1 min-w-[140px] py-3 rounded-xl border border-[#ede9e0] text-[#6a6a6a] hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200">
                            <RotateCcw className="w-4 h-4" /> จองรถใหม่
                        </button>
                    )}
                    <button
                        onClick={() => onExpand(rental.id)}
                        className="py-3 px-4 rounded-xl border border-[#ede9e0] text-[#8a8a8a] hover:text-[#1a1a1a] hover:border-[#ca9d32]/30 text-sm transition"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyRentalsPage() {
    const [activeTab, setActiveTab] = useState<"all" | RentalStatus>("all");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = rentals.filter(r => {
        const matchTab = activeTab === "all" || r.status === activeTab;
        const matchSearch = !search ||
            r.car.toLowerCase().includes(search.toLowerCase()) ||
            r.brand.toLowerCase().includes(search.toLowerCase()) ||
            r.id.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    const counts = {
        all: rentals.length,
        active: rentals.filter(r => r.status === "active").length,
        upcoming: rentals.filter(r => r.status === "upcoming").length,
        completed: rentals.filter(r => r.status === "completed").length,
        cancelled: rentals.filter(r => r.status === "cancelled").length,
    };

    const totalSpend = rentals
        .filter(r => r.status !== "cancelled")
        .reduce((s, r) => s + r.totalPrice, 0);

    return (
        <div
            className="min-h-screen bg-[#f5f4f0] pt-20 pb-28 lg:pb-12"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* ── PAGE HEADER ──────────────────────────────────────── */}
            <div className="bg-[#1a1a1a] text-white">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-12">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                            <p className="text-[#ca9d32] text-xs font-bold tracking-[0.2em] uppercase mb-2">AURA Premium</p>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">การจองของฉัน</h1>
                            <p className="text-[#5a5a5a] text-sm mt-2">ติดตามและจัดการการเช่ารถทั้งหมดของคุณ</p>
                        </div>

                        {/* Summary chips */}
                        <div className="flex flex-wrap gap-3">
                            <div className="bg-white/6 border border-white/10 rounded-2xl px-5 py-3 text-center">
                                <div className="text-2xl font-black text-white">{rentals.filter(r => r.status !== "cancelled").length}</div>
                                <div className="text-[10px] text-[#5a5a5a] font-medium mt-0.5 uppercase tracking-wide">การเช่าทั้งหมด</div>
                            </div>
                            <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-2xl px-5 py-3 text-center">
                                <div className="text-2xl font-black text-[#22c55e]">{counts.active}</div>
                                <div className="text-[10px] text-[#5a5a5a] font-medium mt-0.5 uppercase tracking-wide">ใช้งานอยู่</div>
                            </div>
                            <div className="bg-[#ca9d32]/10 border border-[#ca9d32]/20 rounded-2xl px-5 py-3 text-center">
                                <div className="text-2xl font-black text-[#ca9d32]">฿{(totalSpend / 1000).toFixed(0)}K</div>
                                <div className="text-[10px] text-[#5a5a5a] font-medium mt-0.5 uppercase tracking-wide">ยอดรวม</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ─────────────────────────────────────── */}
            <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-8">

                {/* Filters + Search */}
                <div className="flex flex-col sm:flex-row gap-3 mb-7">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0a898]" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหา รถ / เลขที่จอง..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#ede9e0] text-sm focus:outline-none focus:border-[#ca9d32] focus:ring-2 focus:ring-[#ca9d32]/15 transition placeholder:text-[#b0a898]"
                        />
                    </div>

                    {/* Tab filter — scrollable on mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
                        {tabs.map(tab => {
                            const count = counts[tab.key];
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${isActive
                                        ? "bg-[#1a1a1a] text-white shadow-sm"
                                        : "bg-white border border-[#ede9e0] text-[#6a6a6a] hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"
                                        }`}
                                >
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${isActive ? "bg-white/15 text-white" : "bg-[#f0ede7] text-[#8a8a8a]"}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cards */}
                {filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="text-7xl mb-5">🚗</div>
                        <h3 className="text-xl font-black text-[#1a1a1a] mb-2">ไม่พบการจอง</h3>
                        <p className="text-[#8a8a8a] text-sm mb-6">
                            {search ? `ไม่พบผลลัพธ์สำหรับ "${search}"` : "คุณยังไม่มีการจองในหมวดหมู่นี้"}
                        </p>
                        <a
                            href="/fleet"
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#1a1a1a] text-white text-sm font-bold hover:bg-[#ca9d32] transition-all duration-200"
                        >
                            <Car className="w-4 h-4" /> เลือกรถเลย
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filtered.map(rental => (
                            <RentalCard
                                key={rental.id}
                                rental={rental}
                                onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom CTA */}
                {filtered.length > 0 && (
                    <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                        <div>
                            <p className="text-[#ca9d32] text-xs font-bold tracking-widest uppercase mb-1">ต้องการรถเพิ่มอีกมั้ย?</p>
                            <h3 className="text-xl font-black">จองรถคันถัดไปของคุณ</h3>
                            <p className="text-[#5a5a5a] text-sm mt-1">รถพร้อม 48 คัน • ส่งภายใน 2 ชั่วโมง</p>
                        </div>
                        <a
                            href="/fleet"
                            className="shrink-0 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#ca9d32] to-[#f0c040] text-black font-black text-sm shadow-[0_6px_24px_rgba(202,157,50,0.4)] hover:shadow-[0_8px_36px_rgba(202,157,50,0.6)] hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            ดูรถทั้งหมด <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                )}
            </div>

            <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}