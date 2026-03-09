'use client';

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, ChevronRight, Star, Shield, Zap, Clock, ArrowUpRight, Play, CheckCircle } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const cars = [
  { id: 1, brand: "Toyota", model: "Camry Hybrid", price: 2190, type: "Sedan", status: "available", rating: 4.9, seats: 5, engine: "2.5L Hybrid", reviews: 214 },
  { id: 2, brand: "Honda", model: "CR-V Turbo", price: 2590, type: "SUV", status: "available", rating: 4.8, seats: 5, engine: "1.5T AWD", reviews: 187 },
  { id: 3, brand: "BMW", model: "320d M Sport", price: 4590, type: "Sedan", status: "available", rating: 5.0, seats: 5, engine: "2.0d 190hp", reviews: 96 },
  { id: 4, brand: "Mercedes-Benz", model: "GLE 300d", price: 6890, type: "SUV", status: "booked", rating: 5.0, seats: 7, engine: "3.0L 245hp", reviews: 73 },
  { id: 5, brand: "Porsche", model: "Cayenne S", price: 9900, type: "SUV", status: "available", rating: 5.0, seats: 5, engine: "2.9T 440hp", reviews: 41 },
  { id: 6, brand: "Tesla", model: "Model S Plaid", price: 7490, type: "Electric", status: "available", rating: 4.9, seats: 5, engine: "Tri Motor EV", reviews: 58 },
];

const categories = [
  { label: "Sedans", count: 12, emoji: "🚗" },
  { label: "SUVs", count: 18, emoji: "🚙" },
  { label: "Luxury", count: 9, emoji: "💎" },
  { label: "Electric", count: 7, emoji: "⚡" },
  { label: "Sports", count: 5, emoji: "🏎️" },
  { label: "Executive", count: 6, emoji: "✦" },
];

const testimonials = [
  { name: "ปิยะ ส.", city: "กรุงเทพฯ", rating: 5, text: "จองง่ายมาก รถมาตรงเวลา สภาพดีเกินคาด ขับไปต่างจังหวัดแล้วชิลมาก", avatar: "ป" },
  { name: "นภา ร.", city: "เชียงใหม่", rating: 5, text: "บริการดีเยี่ยม พนักงานใจดีมาก คราวหน้าจะกลับมาเช่าอีกแน่นอน", avatar: "น" },
  { name: "Mark S.", city: "Bangkok", rating: 5, text: "Booked the BMW for a business dinner — absolute show stopper. Worth every baht.", avatar: "M" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomePageV3() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchLocation, setSearchLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx(i => (i + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeCategory === "All"
    ? cars
    : cars.filter(c => c.type === activeCategory);

  return (
    <div
      className="bg-[#f5f4f0] text-[#1a1a1a] min-h-screen"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen bg-[#111] overflow-hidden flex flex-col"
      >
        {/* Background texture + gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a]" />
          {/* Gold accent blob */}
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#ca9d32]/8 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#ca9d32]/5 blur-[100px]" />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #ca9d32 1px, transparent 1px),
                linear-gradient(to bottom, #ca9d32 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px"
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-[1400px] mx-auto w-full px-6 sm:px-10 lg:px-16 pt-28 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-6 items-center">

            {/* Left */}
            <div
              className="transition-all duration-1000"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(32px)" }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ca9d32]/30 bg-[#ca9d32]/8 text-[#ca9d32] text-sm font-medium mb-8 backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-[#ca9d32] animate-pulse" />
                Premium Car Rental • Bangkok & Phuket
              </div>

              <h1
                className="text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-white mb-6"
                style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: "-0.01em" }}
              >
                Where Style
                <br />
                <span
                  className="text-transparent"
                  style={{
                    WebkitTextStroke: "1px rgba(202,157,50,0.6)",
                  }}
                >
                  Meets The
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f0c040] via-[#ca9d32] to-[#e8a820]">
                  Road.
                </span>
              </h1>

              <p className="text-[#8a8a8a] text-lg sm:text-xl leading-relaxed mb-10 max-w-md">
                เช่ารถระดับพรีเมี่ยม ส่งถึงที่ในกรุงเทพฯ&nbsp;—
                ไม่มีค่ามัดจำ ประกันชั้น&nbsp;1 รวม ยกเลิกฟรีภายใน&nbsp;24&nbsp;ชม.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/fleet"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#ca9d32] to-[#f0c040] text-black font-bold text-base shadow-[0_8px_32px_rgba(202,157,50,0.4)] hover:shadow-[0_12px_48px_rgba(202,157,50,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  เริ่มเช่าทันที
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <button className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-white/15 text-white/80 hover:text-white hover:bg-white/6 font-medium text-base transition-all duration-200">
                  <Play className="w-4 h-4 fill-current" />
                  ดูวิธีการเช่า
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-5 mt-10 pt-8 border-t border-white/8">
                <div className="flex -space-x-3">
                  {["ป", "น", "M", "ส"].map((l, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ca9d32] to-[#9a6e10] border-2 border-[#111] flex items-center justify-center text-xs font-bold text-black"
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex text-[#f0c040]">{"★★★★★"}</div>
                  <p className="text-[#5a5a5a] text-sm">4.9/5 จาก 1,200+ รีวิว</p>
                </div>
              </div>
            </div>

            {/* Right — Feature car card */}
            <div
              className="relative transition-all duration-1000 delay-200"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(32px)" }}
            >
              <div className="relative rounded-3xl overflow-hidden bg-[#1a1a1a] border border-white/8 shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
                {/* Car image placeholder */}
                <div className="h-[300px] sm:h-[360px] bg-gradient-to-br from-[#222] to-[#111] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ca9d32]/5 to-transparent" />
                  <div className="text-center">
                    <div className="text-8xl mb-4">🚗</div>
                    <p className="text-[#3a3a3a] text-sm">Car image here</p>
                  </div>
                  {/* Spec tags floating */}
                  <div className="absolute top-4 right-4 bg-[#ca9d32] text-black text-xs font-black px-3 py-1.5 rounded-full">
                    FEATURED
                  </div>
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {["Auto", "5 ที่นั่ง", "ประกันชั้น 1"].map(tag => (
                      <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/60 text-white/70 backdrop-blur border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[#5a5a5a] text-sm font-medium">แนะนำสัปดาห์นี้</p>
                      <h3 className="text-2xl font-black text-white mt-0.5">BMW 320d M Sport</h3>
                      <p className="text-[#6a6a6a] text-sm">2.0d 190hp • Auto • Sedan</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-[#f0c040]">4,590</div>
                      <p className="text-[#5a5a5a] text-xs">บาท / วัน</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#ca9d32] to-[#f0c040] text-black font-bold text-sm hover:opacity-90 transition">
                      จองรถนี้
                    </button>
                    <button className="py-3.5 px-5 rounded-2xl border border-white/12 text-[#6a6a6a] hover:text-white hover:border-white/25 text-sm font-medium transition">
                      รายละเอียด
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating stat card */}
              <div className="absolute -left-6 top-1/3 hidden xl:block bg-[#111]/90 backdrop-blur border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
                <p className="text-[#5a5a5a] text-xs mb-1">รถว่างตอนนี้</p>
                <p className="text-3xl font-black text-white">48</p>
                <p className="text-[#ca9d32] text-xs font-medium mt-1">คัน ● พร้อมส่ง</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 border-t border-white/6 bg-white/[0.02] backdrop-blur">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/8">
              {[
                { n: "5,000+", label: "การเช่าต่อเดือน" },
                { n: "48", label: "รถพร้อมส่งตอนนี้" },
                { n: "4.9★", label: "คะแนนเฉลี่ย" },
                { n: "2 ชม.", label: "ส่งถึงที่สูงสุด" },
              ].map(({ n, label }) => (
                <div key={label} className="sm:px-8 first:pl-0 last:pr-0 py-1 sm:py-0">
                  <div className="text-2xl font-black text-white">{n}</div>
                  <div className="text-[#5a5a5a] text-sm mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH BOOKING BAR ─────────────────────────────────── */}
      <div className="relative z-20 -mt-1 bg-[#f5f4f0]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-10">
          <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-[#e8e4dc] overflow-hidden">
            {/* Tab header */}
            <div className="flex border-b border-[#f0ede7] px-6 pt-5 gap-6">
              {["เช่ารายวัน", "เช่ารายสัปดาห์", "เช่ารายเดือน"].map((tab, i) => (
                <button
                  key={tab}
                  className={`pb-4 text-sm font-semibold border-b-2 transition-all duration-200 ${i === 0 ? "border-[#ca9d32] text-[#1a1a1a]" : "border-transparent text-[#8a8a8a] hover:text-[#1a1a1a]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Location */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest mb-1.5 px-1">สถานที่รับรถ</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ca9d32]" />
                    <input
                      value={searchLocation}
                      onChange={e => setSearchLocation(e.target.value)}
                      placeholder="กรุงเทพฯ, สุวรรณภูมิ..."
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#f8f6f2] border border-[#ede9e0] text-sm focus:outline-none focus:border-[#ca9d32] focus:ring-2 focus:ring-[#ca9d32]/15 transition placeholder:text-[#b0a898]"
                    />
                  </div>
                </div>

                {/* Pickup date */}
                <div>
                  <label className="block text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest mb-1.5 px-1">วันรับรถ</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ca9d32]" />
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={e => setPickupDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#f8f6f2] border border-[#ede9e0] text-sm focus:outline-none focus:border-[#ca9d32] focus:ring-2 focus:ring-[#ca9d32]/15 transition text-[#4a4a4a]"
                    />
                  </div>
                </div>

                {/* Return date */}
                <div>
                  <label className="block text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest mb-1.5 px-1">วันคืนรถ</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ca9d32]" />
                    <input
                      type="date"
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#f8f6f2] border border-[#ede9e0] text-sm focus:outline-none focus:border-[#ca9d32] focus:ring-2 focus:ring-[#ca9d32]/15 transition text-[#4a4a4a]"
                    />
                  </div>
                </div>

                {/* Search button */}
                <div className="flex flex-col justify-end">
                  <button className="w-full py-3.5 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.25)] active:scale-[0.98]">
                    <Search className="w-4 h-4" />
                    ค้นหารถ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CAR CATEGORIES ─────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[#ca9d32] text-sm font-bold tracking-widest uppercase mb-2">เลือกตามประเภท</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">คลาสรถทั้งหมด</h2>
          </div>
          <a href="/fleet" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#6a6a6a] hover:text-[#1a1a1a] transition">
            ดูทั้งหมด <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(activeCategory === cat.label ? "All" : cat.label)}
              className={`group p-5 rounded-2xl border text-left transition-all duration-200 ${activeCategory === cat.label
                ? "bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-lg"
                : "bg-white border-[#ede9e0] hover:border-[#ca9d32]/40 hover:shadow-md"
                }`}
            >
              <div className="text-3xl mb-3">{cat.emoji}</div>
              <p className={`font-bold text-sm ${activeCategory === cat.label ? "text-white" : "text-[#1a1a1a]"}`}>
                {cat.label}
              </p>
              <p className={`text-xs mt-0.5 ${activeCategory === cat.label ? "text-white/50" : "text-[#8a8a8a]"}`}>
                {cat.count} คัน
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ── CAR GRID ───────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[#ca9d32] text-sm font-bold tracking-widest uppercase mb-2">พร้อมจองทันที</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">รถแนะนำ</h2>
          </div>
          <div className="flex gap-2">
            {["ราคา", "Rating", "ใหม่"].map(f => (
              <button
                key={f}
                className="hidden sm:block px-4 py-2 rounded-full text-xs font-semibold border border-[#ede9e0] bg-white hover:border-[#1a1a1a] text-[#6a6a6a] hover:text-[#1a1a1a] transition"
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((car, i) => (
            <div
              key={car.id}
              className="group bg-white rounded-3xl overflow-hidden border border-[#ede9e0] hover:border-[#ca9d32]/30 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Image area */}
              <div className="relative h-52 bg-gradient-to-br from-[#f0ede7] to-[#e8e4dc] overflow-hidden flex items-center justify-center">
                <div className="text-7xl group-hover:scale-110 transition-transform duration-500">
                  {car.type === "SUV" ? "🚙" : car.type === "Electric" ? "⚡" : "🚗"}
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {car.status === "booked" ? (
                    <span className="bg-[#1a1a1a]/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur">
                      จองแล้ว
                    </span>
                  ) : (
                    <span className="bg-[#22c55e]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur">
                      ● ว่าง
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#f0c040] fill-[#f0c040]" />
                  <span className="text-xs font-bold text-[#1a1a1a]">{car.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                {/* Brand + name */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-[#ca9d32] uppercase tracking-widest">{car.brand}</p>
                    <h3 className="text-lg font-black text-[#1a1a1a] leading-tight">{car.model}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#1a1a1a]">{car.price.toLocaleString()}</div>
                    <p className="text-[10px] text-[#8a8a8a] font-medium">บาท / วัน</p>
                  </div>
                </div>

                {/* Specs row */}
                <div className="flex gap-3 mb-4">
                  {[
                    car.engine,
                    `${car.seats} ที่นั่ง`,
                    "Auto",
                  ].map(spec => (
                    <span key={spec} className="text-[11px] font-semibold text-[#6a6a6a] bg-[#f5f4f0] px-2.5 py-1 rounded-lg">
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Trust icons */}
                <div className="flex gap-3 text-[11px] text-[#8a8a8a] mb-5">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-[#22c55e]" />ประกันชั้น&nbsp;1</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#ca9d32]" />ส่งภายใน&nbsp;2&nbsp;ชม.</span>
                </div>

                {/* Reviews */}
                <p className="text-[11px] text-[#8a8a8a] mb-4">
                  <span className="text-[#f0c040] font-bold">★ {car.rating}</span> ({car.reviews} รีวิว)
                </p>

                {/* Action */}
                <div className="mt-auto flex gap-2">
                  <button
                    disabled={car.status === "booked"}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${car.status === "available"
                      ? "bg-[#1a1a1a] text-white hover:bg-[#ca9d32] hover:shadow-[0_4px_20px_rgba(202,157,50,0.4)] active:scale-[0.98]"
                      : "bg-[#f0ede7] text-[#b0a898] cursor-not-allowed"
                      }`}
                  >
                    {car.status === "available" ? "จองรถนี้" : "ไม่ว่าง"}
                  </button>
                  <button className="px-4 py-3 rounded-xl border border-[#ede9e0] text-[#6a6a6a] hover:border-[#ca9d32]/40 hover:text-[#1a1a1a] text-sm transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="/fleet"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full border-2 border-[#1a1a1a] text-[#1a1a1a] font-bold text-sm hover:bg-[#1a1a1a] hover:text-white transition-all duration-200"
          >
            ดูรถทั้งหมด <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── WHY AURA ───────────────────────────────────────────── */}
      <section className="bg-[#1a1a1a] text-white py-20 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#ca9d32] text-sm font-bold tracking-widest uppercase mb-4">ทำไมต้อง AURA</p>
              <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-8">
                มาตรฐานที่<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f0c040] to-[#ca9d32]">ไม่มีใครเทียบ</span>
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Shield, title: "ประกันชั้น 1 รวมทุกคัน", desc: "ไม่ต้องกังวลเรื่องอุบัติเหตุ เราดูแลให้ทุกอย่าง" },
                  { icon: Zap, title: "ส่งภายใน 2 ชั่วโมง", desc: "ทีมงานพร้อมนำรถส่งถึงที่ทั่วกรุงเทพฯ และปริมณฑล" },
                  { icon: Clock, title: "ยกเลิกฟรีภายใน 24 ชม.", desc: "แผนเปลี่ยน ยกเลิกได้เลย ไม่มีค่าปรับ ไม่มีเงื่อนไข" },
                  { icon: CheckCircle, title: "รถใหม่ ไม่เกิน 3 ปี", desc: "ทุกคันผ่านการตรวจสภาพก่อนส่งมอบทุกครั้ง" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-[#ca9d32]/15 flex items-center justify-center shrink-0 group-hover:bg-[#ca9d32]/25 transition">
                      <Icon className="w-5 h-5 text-[#ca9d32]" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{title}</p>
                      <p className="text-[#6a6a6a] text-sm mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "5,000+", label: "การเช่าต่อเดือน", color: "from-[#ca9d32]/20 to-[#ca9d32]/5" },
                { n: "4.9", label: "คะแนนเฉลี่ย", color: "from-[#22c55e]/20 to-[#22c55e]/5" },
                { n: "48", label: "รถในระบบตอนนี้", color: "from-[#3b82f6]/20 to-[#3b82f6]/5" },
                { n: "0฿", label: "ค่ามัดจำ", color: "from-[#f0c040]/20 to-[#f0c040]/5" },
              ].map(({ n, label, color }) => (
                <div key={label} className={`p-6 rounded-2xl bg-gradient-to-br ${color} border border-white/6`}>
                  <div className="text-4xl font-black text-white mb-1">{n}</div>
                  <p className="text-[#6a6a6a] text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-[#f5f4f0]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-14">
            <p className="text-[#ca9d32] text-sm font-bold tracking-widest uppercase mb-3">รีวิวจากลูกค้า</p>
            <h2 className="text-4xl sm:text-5xl font-black">เสียงจากผู้ใช้จริง</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`p-7 rounded-3xl border transition-all duration-300 ${i === testimonialIdx
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-2xl scale-[1.02]"
                  : "bg-white border-[#ede9e0]"
                  }`}
              >
                <div className="flex text-[#f0c040] text-lg mb-4">{"★★★★★"}</div>
                <p className={`text-base leading-relaxed mb-6 ${i === testimonialIdx ? "text-[#c0c0c0]" : "text-[#3a3a3a]"}`}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ca9d32] to-[#9a6e10] flex items-center justify-center text-black font-black text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${i === testimonialIdx ? "text-white" : "text-[#1a1a1a]"}`}>{t.name}</p>
                    <p className={`text-xs ${i === testimonialIdx ? "text-[#6a6a6a]" : "text-[#8a8a8a]"}`}>{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                className={`rounded-full transition-all duration-300 ${i === testimonialIdx ? "w-6 h-2 bg-[#1a1a1a]" : "w-2 h-2 bg-[#c0bab2]"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-[#ca9d32] to-[#f0c040] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)`,
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-black mb-4 tracking-tight">
            พร้อมขับรถในฝันของคุณ?
          </h2>
          <p className="text-black/60 text-lg mb-8 max-w-lg mx-auto">
            จอง 5 นาที รับรถภายใน 2 ชั่วโมง ไม่มีค่ามัดจำ
          </p>
          <a
            href="/fleet"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-[#1a1a1a] text-white font-black text-base hover:bg-black shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            เริ่มเลือกรถตอนนี้
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-[#0d0d0d] text-white py-16">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#f0c040] to-[#ca9d32] mb-3">
                AURA
              </div>
              <p className="text-[#5a5a5a] text-sm leading-relaxed">
                Premium car rental service<br />Bangkok & Phuket, Thailand
              </p>
            </div>
            {[
              { title: "บริการ", links: ["เช่ารายวัน", "เช่ารายเดือน", "รถสำหรับงาน", "รับส่งสนามบิน"] },
              { title: "บริษัท", links: ["เกี่ยวกับเรา", "ทีมงาน", "ร่วมงานกับเรา", "ข่าวสาร"] },
              { title: "ช่วยเหลือ", links: ["FAQ", "นโยบายการเช่า", "ประกันภัย", "ติดต่อเรา"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="font-bold text-sm mb-4 tracking-wider uppercase text-[#4a4a4a]">{title}</p>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-[#5a5a5a] text-sm hover:text-[#ca9d32] transition">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#3a3a3a] text-sm">© 2025 AURA Premium Car Rental. All rights reserved.</p>
            <div className="flex gap-5">
              {["YouTube", "Facebook", "Instagram"].map(s => (
                <a key={s} href="#" className="text-[#3a3a3a] text-sm hover:text-[#ca9d32] transition">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16" />
    </div>
  );
}