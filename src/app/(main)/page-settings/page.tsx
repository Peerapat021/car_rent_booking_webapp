'use client';

import React, { useState } from "react";
import {
    User, Bell, Shield, CreditCard, Globe, Moon, Sun,
    ChevronRight, Camera, Check, X, Eye, EyeOff,
    Smartphone, Mail, LogOut, Trash2, Lock,
    AlertCircle, Sparkles, Car
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type SettingSection = "profile" | "notifications" | "security" | "payment" | "preferences";

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${value ? "bg-[#ca9d32]" : "bg-[#d0cac0]"}`}
        >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${value ? "left-[22px]" : "left-0.5"}`} />
        </button>
    );
}

// ── Section Row ───────────────────────────────────────────────────────────────
function SettingRow({
    label, desc, children, danger = false
}: {
    label: string; desc?: string; children: React.ReactNode; danger?: boolean
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-4 border-b border-[#f0ede7] last:border-0">
            <div className="min-w-0">
                <p className={`text-sm font-semibold ${danger ? "text-[#ef4444]" : "text-[#1a1a1a]"}`}>{label}</p>
                {desc && <p className="text-xs text-[#8a8a8a] mt-0.5 leading-relaxed">{desc}</p>}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

// ── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl border border-[#ede9e0] px-5 overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

// ── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({
    icon, label, active, badge, onClick
}: {
    icon: React.ReactNode; label: string; active: boolean; badge?: number; onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${active
                ? "bg-[#1a1a1a] text-white"
                : "text-[#6a6a6a] hover:bg-[#f0ede7] hover:text-[#1a1a1a]"}`}
        >
            <span className={active ? "text-[#ca9d32]" : "text-[#8a8a8a]"}>{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            {badge ? (
                <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${active ? "bg-white/20 text-white" : "bg-[#ca9d32]/15 text-[#ca9d32]"}`}>
                    {badge}
                </span>
            ) : (
                <ChevronRight className={`w-4 h-4 ${active ? "text-white/40" : "text-[#c0bab2]"}`} />
            )}
        </button>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState<SettingSection>("profile");

    // Profile
    const [name, setName] = useState("ปิยะ สมิทธิ์");
    const [email, setEmail] = useState("piya@example.com");
    const [phone, setPhone] = useState("081-234-5678");
    const [editingProfile, setEditingProfile] = useState(false);
    const [saved, setSaved] = useState(false);

    // Notifications
    const [notifBooking, setNotifBooking] = useState(true);
    const [notifPromo, setNotifPromo] = useState(true);
    const [notifReminder, setNotifReminder] = useState(true);
    const [notifEmail, setNotifEmail] = useState(false);
    const [notifSMS, setNotifSMS] = useState(true);
    const [notifPush, setNotifPush] = useState(true);

    // Security
    const [showPass, setShowPass] = useState(false);
    const [twoFA, setTwoFA] = useState(true);
    const [biometric, setBiometric] = useState(false);

    // Preferences
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState("th");
    const [currency, setCurrency] = useState("THB");

    // Payment cards mock
    const cards = [
        { id: 1, brand: "Visa", last4: "4242", exp: "12/26", default: true },
        { id: 2, brand: "Mastercard", last4: "8888", exp: "09/25", default: false },
    ];

    const handleSaveProfile = () => {
        setEditingProfile(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const navItems: { key: SettingSection; icon: React.ReactNode; label: string; badge?: number }[] = [
        { key: "profile", icon: <User className="w-4 h-4" />, label: "ข้อมูลส่วนตัว" },
        { key: "notifications", icon: <Bell className="w-4 h-4" />, label: "การแจ้งเตือน", badge: 2 },
        { key: "security", icon: <Shield className="w-4 h-4" />, label: "ความปลอดภัย" },
        { key: "payment", icon: <CreditCard className="w-4 h-4" />, label: "การชำระเงิน" },
        { key: "preferences", icon: <Globe className="w-4 h-4" />, label: "การตั้งค่าทั่วไป" },
    ];

    return (
        <div
            className="min-h-screen bg-[#f5f4f0] pt-20 pb-28 lg:pb-12"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* ── HEADER ───────────────────────────────────────────── */}
            <div className="bg-[#1a1a1a] text-white">
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
                    <p className="text-[#ca9d32] text-xs font-bold tracking-[0.2em] uppercase mb-2">AURA Premium</p>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">ตั้งค่าบัญชี</h1>
                    <p className="text-[#5a5a5a] text-sm mt-2">จัดการข้อมูลและความเป็นส่วนตัวของคุณ</p>
                </div>
            </div>

            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
                <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">

                    {/* ── SIDEBAR ─────────────────────────────────────── */}
                    <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1 sticky top-24">
                        {/* User mini card */}
                        <div className="bg-white rounded-2xl border border-[#ede9e0] p-4 mb-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f0c040] to-[#9a6e10] flex items-center justify-center text-black font-black text-sm shrink-0">
                                {name[0]}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#1a1a1a] truncate">{name}</p>
                                <p className="text-[10px] text-[#ca9d32] font-semibold">✦ VIP Member</p>
                            </div>
                        </div>

                        {navItems.map(item => (
                            <NavItem
                                key={item.key}
                                icon={item.icon}
                                label={item.label}
                                active={activeSection === item.key}
                                badge={item.badge}
                                onClick={() => setActiveSection(item.key)}
                            />
                        ))}

                        <div className="mt-4 pt-4 border-t border-[#ede9e0]">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#ef4444] hover:bg-[#fef2f2] transition">
                                <LogOut className="w-4 h-4" />
                                ออกจากระบบ
                            </button>
                        </div>
                    </aside>

                    {/* ── MOBILE NAV ──────────────────────────────────── */}
                    <div className="lg:hidden w-full shrink-0">
                        {/* User mini card on mobile */}
                        <div className="bg-white rounded-2xl border border-[#ede9e0] p-4 mb-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f0c040] to-[#9a6e10] flex items-center justify-center text-black font-black text-sm shrink-0">
                                {name[0]}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#1a1a1a] truncate">{name}</p>
                                <p className="text-[10px] text-[#ca9d32] font-semibold">✦ VIP Member</p>
                            </div>
                            <button className="ml-auto flex items-center gap-1.5 text-xs font-bold text-[#ef4444] px-3 py-1.5 rounded-xl bg-[#fef2f2] border border-[#ef4444]/15">
                                <LogOut className="w-3.5 h-3.5" /> ออก
                            </button>
                        </div>
                        {/* Scrollable tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {navItems.map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setActiveSection(item.key)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 border transition-all duration-200 ${activeSection === item.key
                                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                                        : "bg-white border-[#ede9e0] text-[#6a6a6a] hover:border-[#1a1a1a]/20"}`}
                                >
                                    {item.icon}
                                    {item.label}
                                    {item.badge && (
                                        <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${activeSection === item.key ? "bg-[#ca9d32] text-black" : "bg-[#ca9d32]/15 text-[#ca9d32]"}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── CONTENT ─────────────────────────────────────── */}
                    <main className="flex-1 min-w-0 w-full space-y-5">

                        {/* ── SAVE TOAST ─── */}
                        {saved && (
                            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#16a34a] text-sm font-semibold animate-in fade-in slide-in-from-top-2">
                                <Check className="w-4 h-4" /> บันทึกข้อมูลเรียบร้อยแล้ว
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════
                PROFILE
            ═══════════════════════════════════════════════ */}
                        {activeSection === "profile" && (
                            <div className="space-y-5">
                                {/* Avatar */}
                                <SectionCard>
                                    <div className="py-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                        <div className="relative shrink-0">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f0c040] to-[#9a6e10] flex items-center justify-center text-black font-black text-3xl shadow-lg">
                                                {name[0]}
                                            </div>
                                            <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#1a1a1a] border-2 border-white flex items-center justify-center hover:bg-[#ca9d32] transition">
                                                <Camera className="w-3.5 h-3.5 text-white" />
                                            </button>
                                        </div>
                                        <div className="text-center sm:text-left flex-1 min-w-0">
                                            <h3 className="text-xl font-black text-[#1a1a1a] truncate">{name}</h3>
                                            <p className="text-sm text-[#ca9d32] font-semibold mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5" /> VIP Member
                                            </p>
                                            <p className="text-xs text-[#8a8a8a] mt-1.5 flex items-center justify-center sm:justify-start gap-1.5">
                                                <Car className="w-3.5 h-3.5" /> เช่ารถมาแล้ว 8 ครั้ง
                                            </p>
                                        </div>
                                        <div className="sm:ml-auto shrink-0">
                                            <button
                                                onClick={() => editingProfile ? handleSaveProfile() : setEditingProfile(true)}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${editingProfile
                                                    ? "bg-[#ca9d32] text-black hover:bg-[#f0c040]"
                                                    : "bg-[#f5f4f0] text-[#1a1a1a] hover:bg-[#ede9e0] border border-[#ede9e0]"}`}
                                            >
                                                {editingProfile ? "บันทึก" : "แก้ไข"}
                                            </button>
                                        </div>
                                    </div>
                                </SectionCard>

                                {/* Fields */}
                                <SectionCard>
                                    <div className="py-2">
                                        {[
                                            { label: "ชื่อ-นามสกุล", icon: <User className="w-4 h-4" />, val: name, set: setName, type: "text" },
                                            { label: "อีเมล", icon: <Mail className="w-4 h-4" />, val: email, set: setEmail, type: "email" },
                                            { label: "เบอร์โทรศัพท์", icon: <Smartphone className="w-4 h-4" />, val: phone, set: setPhone, type: "tel" },
                                        ].map(({ label, icon, val, set, type }) => (
                                            <div key={label} className="py-4 border-b border-[#f0ede7] last:border-0">
                                                <label className="block text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <span className="text-[#ca9d32]">{icon}</span> {label}
                                                </label>
                                                {editingProfile ? (
                                                    <input
                                                        type={type}
                                                        value={val}
                                                        onChange={e => set(e.target.value)}
                                                        className="w-full px-4 py-2.5 rounded-xl bg-[#f8f6f2] border border-[#ede9e0] text-sm font-medium text-[#1a1a1a] focus:outline-none focus:border-[#ca9d32] focus:ring-2 focus:ring-[#ca9d32]/15 transition"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-semibold text-[#1a1a1a] px-1">{val}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>

                                {/* Danger zone */}
                                <SectionCard>
                                    <SettingRow label="ลบบัญชี" desc="ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้" danger>
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef4444]/8 border border-[#ef4444]/20 text-[#ef4444] text-xs font-bold hover:bg-[#ef4444]/15 transition">
                                            <Trash2 className="w-3.5 h-3.5" /> ลบบัญชี
                                        </button>
                                    </SettingRow>
                                </SectionCard>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════
                NOTIFICATIONS
            ═══════════════════════════════════════════════ */}
                        {activeSection === "notifications" && (
                            <div className="space-y-5">
                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">ประเภทการแจ้งเตือน</p>
                                    </div>
                                    <SettingRow label="การจองและรถ" desc="ยืนยันการจอง, สถานะรถ, คนขับกำลังมา">
                                        <Toggle value={notifBooking} onChange={setNotifBooking} />
                                    </SettingRow>
                                    <SettingRow label="แจ้งเตือนคืนรถ" desc="แจ้งเตือนล่วงหน้า 24 ชม. ก่อนถึงกำหนดคืนรถ">
                                        <Toggle value={notifReminder} onChange={setNotifReminder} />
                                    </SettingRow>
                                    <SettingRow label="โปรโมชันและส่วนลด" desc="ข้อเสนอพิเศษ, รถใหม่, และสิทธิ์ VIP">
                                        <Toggle value={notifPromo} onChange={setNotifPromo} />
                                    </SettingRow>
                                </SectionCard>

                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">ช่องทางการแจ้งเตือน</p>
                                    </div>
                                    <SettingRow label="Push Notification" desc="แจ้งเตือนบนอุปกรณ์ทันที">
                                        <Toggle value={notifPush} onChange={setNotifPush} />
                                    </SettingRow>
                                    <SettingRow label="SMS" desc="รับข้อความแจ้งเตือนทาง SMS">
                                        <Toggle value={notifSMS} onChange={setNotifSMS} />
                                    </SettingRow>
                                    <SettingRow label="อีเมล" desc="รับสรุปและใบเสร็จทางอีเมล">
                                        <Toggle value={notifEmail} onChange={setNotifEmail} />
                                    </SettingRow>
                                </SectionCard>

                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#3b82f6]/6 border border-[#3b82f6]/15">
                                    <AlertCircle className="w-4 h-4 text-[#3b82f6] mt-0.5 shrink-0" />
                                    <p className="text-xs text-[#4a5a7a] leading-relaxed">
                                        การแจ้งเตือนที่เกี่ยวกับความปลอดภัยและการชำระเงินจะยังคงถูกส่งเสมอ แม้จะปิดการแจ้งเตือน
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════
                SECURITY
            ═══════════════════════════════════════════════ */}
                        {activeSection === "security" && (
                            <div className="space-y-5">
                                {/* Change password */}
                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">รหัสผ่าน</p>
                                    </div>
                                    {[
                                        { label: "รหัสผ่านปัจจุบัน", placeholder: "••••••••" },
                                        { label: "รหัสผ่านใหม่", placeholder: "อย่างน้อย 8 ตัวอักษร" },
                                        { label: "ยืนยันรหัสใหม่", placeholder: "กรอกรหัสผ่านใหม่อีกครั้ง" },
                                    ].map(({ label, placeholder }) => (
                                        <div key={label} className="py-3 border-b border-[#f0ede7] last:border-0">
                                            <label className="block text-xs font-bold text-[#8a8a8a] mb-1.5">{label}</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c0bab2]" />
                                                <input
                                                    type={showPass ? "text" : "password"}
                                                    placeholder={placeholder}
                                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#f8f6f2] border border-[#ede9e0] text-sm focus:outline-none focus:border-[#ca9d32] focus:ring-2 focus:ring-[#ca9d32]/15 transition"
                                                />
                                                <button
                                                    onClick={() => setShowPass(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c0bab2] hover:text-[#6a6a6a]"
                                                >
                                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="py-4">
                                        <button className="px-6 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-bold hover:bg-[#ca9d32] transition-all duration-200">
                                            เปลี่ยนรหัสผ่าน
                                        </button>
                                    </div>
                                </SectionCard>

                                {/* 2FA + Biometric */}
                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">การยืนยันตัวตน</p>
                                    </div>
                                    <SettingRow label="Two-Factor Authentication" desc="รับ OTP ทาง SMS ทุกครั้งที่เข้าสู่ระบบ">
                                        <Toggle value={twoFA} onChange={setTwoFA} />
                                    </SettingRow>
                                    <SettingRow label="Face ID / Fingerprint" desc="ใช้ไบโอเมตริกเพื่อเข้าสู่ระบบเร็วขึ้น">
                                        <Toggle value={biometric} onChange={setBiometric} />
                                    </SettingRow>
                                </SectionCard>

                                {/* Active sessions */}
                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">อุปกรณ์ที่เข้าสู่ระบบ</p>
                                    </div>
                                    {[
                                        { device: "iPhone 15 Pro", location: "กรุงเทพฯ, ไทย", time: "ตอนนี้", current: true },
                                        { device: "MacBook Pro", location: "กรุงเทพฯ, ไทย", time: "2 ชม. ที่แล้ว", current: false },
                                        { device: "iPad Air", location: "เชียงใหม่, ไทย", time: "เมื่อวาน", current: false },
                                    ].map(({ device, location, time, current }) => (
                                        <div key={device} className="flex items-center justify-between gap-4 py-3.5 border-b border-[#f0ede7] last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${current ? "bg-[#22c55e]/12" : "bg-[#f0ede7]"}`}>
                                                    <Smartphone className={`w-4 h-4 ${current ? "text-[#22c55e]" : "text-[#8a8a8a]"}`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
                                                        {device}
                                                        {current && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#22c55e]/12 text-[#16a34a]">ปัจจุบัน</span>}
                                                    </p>
                                                    <p className="text-xs text-[#8a8a8a]">{location} • {time}</p>
                                                </div>
                                            </div>
                                            {!current && (
                                                <button className="text-xs font-bold text-[#ef4444] hover:text-[#dc2626] transition flex items-center gap-1">
                                                    <X className="w-3.5 h-3.5" /> ออก
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <div className="py-3.5">
                                        <button className="text-sm font-bold text-[#ef4444] hover:text-[#dc2626] transition">
                                            ออกจากระบบทุกอุปกรณ์
                                        </button>
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════
                PAYMENT
            ═══════════════════════════════════════════════ */}
                        {activeSection === "payment" && (
                            <div className="space-y-5">
                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">บัตรที่บันทึกไว้</p>
                                    </div>
                                    {cards.map(card => (
                                        <div key={card.id} className="flex items-center justify-between gap-4 py-4 border-b border-[#f0ede7] last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-8 rounded-lg flex items-center justify-center font-black text-xs ${card.brand === "Visa" ? "bg-[#1a1a72] text-white" : "bg-[#eb0000] text-white"}`}>
                                                    {card.brand === "Visa" ? "VISA" : "MC"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
                                                        •••• {card.last4}
                                                        {card.default && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ca9d32]/12 text-[#ca9d32]">ค่าเริ่มต้น</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-[#8a8a8a]">{card.brand} • หมดอายุ {card.exp}</p>
                                                </div>
                                            </div>
                                            <button className="text-xs font-bold text-[#ef4444] hover:text-[#dc2626] transition">ลบ</button>
                                        </div>
                                    ))}
                                    <div className="py-4">
                                        <button className="flex items-center gap-2 text-sm font-bold text-[#ca9d32] hover:text-[#1a1a1a] transition">
                                            + เพิ่มบัตรใหม่
                                        </button>
                                    </div>
                                </SectionCard>

                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">ประวัติการชำระเงิน</p>
                                    </div>
                                    {[
                                        { id: "AURA-20241", amount: "฿18,360", date: "8 มี.ค. 68", status: "สำเร็จ", color: "text-[#22c55e]" },
                                        { id: "AURA-20198", amount: "฿34,450", date: "20 มี.ค. 68", status: "รอดำเนินการ", color: "text-[#f0c040]" },
                                        { id: "AURA-19834", amount: "฿4,380", date: "14 ก.พ. 68", status: "สำเร็จ", color: "text-[#22c55e]" },
                                    ].map(({ id, amount, date, status, color }) => (
                                        <div key={id} className="flex items-center justify-between py-3.5 border-b border-[#f0ede7] last:border-0">
                                            <div>
                                                <p className="text-sm font-semibold text-[#1a1a1a]">{id}</p>
                                                <p className="text-xs text-[#8a8a8a]">{date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-[#1a1a1a]">{amount}</p>
                                                <p className={`text-xs font-semibold ${color}`}>{status}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="py-4">
                                        <button className="flex items-center gap-1.5 text-sm font-bold text-[#ca9d32] hover:text-[#1a1a1a] transition">
                                            ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════
                PREFERENCES
            ═══════════════════════════════════════════════ */}
                        {activeSection === "preferences" && (
                            <div className="space-y-5">
                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">การแสดงผล</p>
                                    </div>
                                    <SettingRow label="Dark Mode" desc="เปลี่ยนธีมเป็นสีเข้ม">
                                        <Toggle value={darkMode} onChange={setDarkMode} />
                                    </SettingRow>
                                    <SettingRow label="ภาษา" desc="เลือกภาษาที่ใช้ในแอป">
                                        <div className="relative">
                                            <select
                                                value={language}
                                                onChange={e => setLanguage(e.target.value)}
                                                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#f8f6f2] border border-[#ede9e0] text-sm font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#ca9d32] cursor-pointer min-w-[110px]"
                                            >
                                                <option value="th">ภาษาไทย</option>
                                                <option value="en">English</option>
                                                <option value="zh">中文</option>
                                            </select>
                                            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8a8a] rotate-90 pointer-events-none" />
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="สกุลเงิน" desc="สกุลเงินสำหรับแสดงราคา">
                                        <div className="relative">
                                            <select
                                                value={currency}
                                                onChange={e => setCurrency(e.target.value)}
                                                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#f8f6f2] border border-[#ede9e0] text-sm font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#ca9d32] cursor-pointer min-w-[110px]"
                                            >
                                                <option value="THB">THB (฿)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                            </select>
                                            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8a8a] rotate-90 pointer-events-none" />
                                        </div>
                                    </SettingRow>
                                </SectionCard>

                                <SectionCard>
                                    <div className="pt-4 pb-1">
                                        <p className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest mb-2 px-1">ความเป็นส่วนตัว</p>
                                    </div>
                                    <SettingRow label="แชร์ข้อมูลการใช้งาน" desc="ช่วยเราพัฒนาแอปให้ดีขึ้น ข้อมูลไม่ระบุตัวตน">
                                        <Toggle value={true} onChange={() => { }} />
                                    </SettingRow>
                                    <SettingRow label="ประวัติการค้นหา" desc="จดจำการค้นหาเพื่อแนะนำรถที่เหมาะกับคุณ">
                                        <Toggle value={true} onChange={() => { }} />
                                    </SettingRow>
                                </SectionCard>

                                <SectionCard>
                                    <SettingRow label="นโยบายความเป็นส่วนตัว">
                                        <ChevronRight className="w-4 h-4 text-[#c0bab2]" />
                                    </SettingRow>
                                    <SettingRow label="เงื่อนไขการใช้บริการ">
                                        <ChevronRight className="w-4 h-4 text-[#c0bab2]" />
                                    </SettingRow>
                                    <SettingRow label="เวอร์ชันแอป" desc="AURA v2.4.1">
                                        <span className="text-xs text-[#b0a898] font-medium">ล่าสุดแล้ว</span>
                                    </SettingRow>
                                </SectionCard>
                            </div>
                        )}

                    </main>
                </div>
            </div>

            <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}