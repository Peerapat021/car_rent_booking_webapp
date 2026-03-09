'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { FaHome, FaCalendarCheck, FaCar, FaCog, FaSignOutAlt, FaSearch, FaBell } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'หน้าแรก', href: '/', icon: FaHome, short: 'หน้าแรก' },
  { name: 'การจองของฉัน', href: '/my-rentals', icon: FaCalendarCheck, short: 'จอง' },
  { name: 'คลาสรถ', href: '/car-class', icon: FaCar, short: 'รถ' },
  { name: 'แจ้งเตือน', href: '/inbox', icon: FaBell, short: 'แจ้งเตือน' },
  { name: 'ตั้งค่า', href: '/page-settings', icon: FaCog, short: 'ตั้งค่า' },
];

export default function NavPremium() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* ─── TOP NAV ────────────────────────────────────────── */}
      <nav
        className={`
          fixed top-0 inset-x-0 z-50 transition-all duration-500
          ${scrolled
            ? 'bg-[#0a0a0a]/98 shadow-[0_1px_40px_rgba(202,157,50,0.12)]'
            : 'bg-[#0a0a0a]'}
          border-b border-[#ca9d32]/15
        `}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
              {/* Emblem */}
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#ca9d32] via-[#f0c040] to-[#9a6e10] shadow-[0_0_18px_rgba(202,157,50,0.45)] group-hover:shadow-[0_0_28px_rgba(202,157,50,0.65)] transition-shadow duration-300">
                <FaCar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-black" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-[#f0c040] via-[#ca9d32] to-[#e8b830] leading-none">
                  AURA
                </div>
                <div className="hidden sm:block text-[8px] sm:text-[9px] tracking-[0.22em] text-[#ca9d32]/60 font-semibold uppercase leading-none mt-[2px]">
                  Premium Car Rental
                </div>
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center gap-2 px-4 xl:px-5 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-250
                      ${active
                        ? 'text-[#f0c040] bg-[#ca9d32]/10'
                        : 'text-[#8a8a8a] hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.name}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-gradient-to-r from-[#ca9d32] to-[#f0c040] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ── Right Controls ── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Search — hidden on xs */}
              <button
                aria-label="ค้นหา"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-white/6 hover:bg-white/12 text-[#8a8a8a] hover:text-white transition-all duration-200 border border-white/8"
              >
                <FaSearch className="w-3.5 h-3.5" />
              </button>

              {session?.user ? (
                <>
                  {/* Avatar + name (desktop) */}
                  <div className="hidden md:flex items-center gap-3 pl-3 pr-4 py-2 rounded-full bg-[#ca9d32]/8 border border-[#ca9d32]/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f0c040] to-[#9a6e10] flex items-center justify-center text-black text-sm font-black shadow">
                      {session.user.name?.[0]?.toUpperCase() ?? 'A'}
                    </div>
                    <div className="leading-tight">
                      <p className="text-white text-sm font-semibold leading-none truncate max-w-[110px]">
                        {session.user.name}
                      </p>
                      <p className="text-[#ca9d32] text-[10px] font-medium mt-[3px] tracking-wide">
                        VIP Member
                      </p>
                    </div>
                  </div>

                  {/* Avatar only (tablet) */}
                  <div className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#f0c040] to-[#9a6e10] text-black text-sm font-black shadow shrink-0">
                    {session.user.name?.[0]?.toUpperCase() ?? 'A'}
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    aria-label="ออกจากระบบ"
                    className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-red-600/12 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-600/20 transition-all duration-200"
                  >
                    <FaSignOutAlt className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#ca9d32] to-[#f0c040] text-black text-xs sm:text-sm font-bold tracking-wide shadow-[0_4px_20px_rgba(202,157,50,0.35)] hover:shadow-[0_6px_28px_rgba(202,157,50,0.55)] hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">เข้าสู่ระบบ VIP</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              )}

              {/* Hamburger (< lg) */}
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="เปิดเมนู"
                className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-9 h-9 rounded-full bg-white/6 hover:bg-white/12 border border-white/8 transition-all duration-200 shrink-0"
              >
                <span className="w-4 h-[1.5px] bg-[#ca9d32] rounded-full" />
                <span className="w-4 h-[1.5px] bg-[#ca9d32] rounded-full" />
                <span className="w-2.5 h-[1.5px] bg-[#ca9d32] rounded-full self-start ml-[4px]" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── MOBILE FULLSCREEN OVERLAY ──────────────────────── */}
      <div
        className={`
          fixed inset-0 z-[60] lg:hidden
          transition-all duration-400 ease-in-out
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#0a0a0a]/97 backdrop-blur-xl"
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          className={`
            absolute inset-y-0 right-0 w-full sm:max-w-sm
            bg-gradient-to-b from-[#111]/95 to-[#0a0a0a]/98
            border-l border-[#ca9d32]/10
            flex flex-col
            transition-transform duration-400 ease-in-out
            ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#ca9d32]/10">
            <div className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#f0c040] to-[#ca9d32]">
              AURA
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="ปิดเมนู"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/8 text-[#8a8a8a] hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-medium
                    transition-all duration-200
                    ${active
                      ? 'bg-[#ca9d32]/12 text-[#f0c040] border border-[#ca9d32]/20'
                      : 'text-[#7a7a7a] hover:text-white hover:bg-white/5'}
                  `}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.name}
                  {active && <span className="ml-auto w-2 h-2 rounded-full bg-[#f0c040]" />}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="px-4 pb-8 border-t border-[#ca9d32]/10 pt-5">
            {session?.user ? (
              <div className="flex items-center gap-4 mb-4 p-4 rounded-2xl bg-[#ca9d32]/8 border border-[#ca9d32]/15">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f0c040] to-[#9a6e10] flex items-center justify-center text-black text-lg font-black shadow-lg shrink-0">
                  {session.user.name?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">{session.user.name}</p>
                  <p className="text-[#ca9d32] text-xs tracking-wide">✦ VIP Member</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="ml-auto flex items-center justify-center w-9 h-9 rounded-full bg-red-600/15 text-red-400 hover:bg-red-600/30 border border-red-600/20 transition shrink-0"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-[#ca9d32] to-[#f0c040] text-black font-bold tracking-wide shadow-[0_6px_24px_rgba(202,157,50,0.4)] hover:shadow-[0_8px_32px_rgba(202,157,50,0.6)] transition-all duration-200"
              >
                เข้าสู่ระบบ VIP
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─── MOBILE BOTTOM TAB BAR ──────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/97 backdrop-blur-2xl border-t border-[#ca9d32]/15 safe-area-pb">
        <div className="flex items-stretch h-[60px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-[3px] pt-1
                  transition-all duration-200
                  ${active ? 'text-[#f0c040]' : 'text-[#4a4a4a] hover:text-[#8a8a8a]'}
                `}
              >
                {active && (
                  <span className="absolute top-0 inset-x-0 mx-auto w-8 h-[2px] bg-gradient-to-r from-[#ca9d32] to-[#f0c040] rounded-full" />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}