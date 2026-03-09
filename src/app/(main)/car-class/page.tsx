'use client';

import React, { useState, useRef } from "react";
import {
  Search, SlidersHorizontal, Star, Shield, Clock, Zap,
  Users, Fuel, ChevronRight, ArrowUpRight, X, Check,
  ChevronDown, Car, Gauge
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type CarType = "Sedan" | "SUV" | "Luxury" | "Electric" | "Sports" | "Executive";
type Transmission = "Auto" | "Manual";
type SortKey = "recommended" | "price_asc" | "price_desc" | "rating";

interface CarItem {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: CarType;
  status: "available" | "booked";
  rating: number;
  reviews: number;
  seats: number;
  engine: string;
  transmission: Transmission;
  fuel: string;
  features: string[];
  tag?: string;
  emoji: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const allCars: CarItem[] = [
  { id: 1,  brand: "Toyota",       model: "Camry Hybrid",   year: 2024, price: 2190, type: "Sedan",     status: "available", rating: 4.9, reviews: 214, seats: 5, engine: "2.5L Hybrid", transmission: "Auto", fuel: "Hybrid",   features: ["ประกันชั้น 1", "Bluetooth", "Backup Cam"],          tag: "ยอดนิยม",  emoji: "🚗" },
  { id: 2,  brand: "Honda",        model: "Accord",         year: 2024, price: 2490, type: "Sedan",     status: "available", rating: 4.7, reviews: 188, seats: 5, engine: "1.5T 192hp",  transmission: "Auto", fuel: "Petrol",   features: ["ประกันชั้น 1", "Apple CarPlay", "Lane Assist"],       tag: undefined,  emoji: "🚗" },
  { id: 3,  brand: "Honda",        model: "CR-V Turbo",     year: 2024, price: 2590, type: "SUV",       status: "available", rating: 4.8, reviews: 187, seats: 5, engine: "1.5T AWD",    transmission: "Auto", fuel: "Petrol",   features: ["ประกันชั้น 1", "4WD", "Panoramic Roof"],              tag: undefined,  emoji: "🚙" },
  { id: 4,  brand: "Toyota",       model: "Fortuner Legender",year:2024, price: 2890, type: "SUV",      status: "available", rating: 4.8, reviews: 156, seats: 7, engine: "2.8D 204hp",  transmission: "Auto", fuel: "Diesel",   features: ["ประกันชั้น 1", "7 ที่นั่ง", "Android Auto"],           tag: undefined,  emoji: "🚙" },
  { id: 5,  brand: "BMW",          model: "320d M Sport",   year: 2024, price: 4590, type: "Sedan",     status: "available", rating: 5.0, reviews: 96,  seats: 5, engine: "2.0d 190hp",  transmission: "Auto", fuel: "Diesel",   features: ["ประกันชั้น 1", "M Sport Kit", "Harman Kardon"],       tag: "แนะนำ",    emoji: "🚗" },
  { id: 6,  brand: "BMW",          model: "X5 xDrive30d",   year: 2024, price: 6290, type: "Luxury",    status: "available", rating: 4.9, reviews: 67,  seats: 5, engine: "3.0d 286hp",  transmission: "Auto", fuel: "Diesel",   features: ["ประกันชั้น 1", "Massage Seats", "Panoramic Roof"],    tag: undefined,  emoji: "🚙" },
  { id: 7,  brand: "Mercedes-Benz",model: "GLE 300d",       year: 2024, price: 6890, type: "Luxury",    status: "booked",    rating: 5.0, reviews: 73,  seats: 7, engine: "3.0L 245hp",  transmission: "Auto", fuel: "Diesel",   features: ["ประกันชั้น 1", "Burmester Audio", "7 ที่นั่ง"],        tag: "Sold Out", emoji: "🚙" },
  { id: 8,  brand: "Mercedes-Benz",model: "S 500 AMG",      year: 2024, price: 12900, type: "Executive", status: "available", rating: 5.0, reviews: 34, seats: 5, engine: "3.0T 435hp",  transmission: "Auto", fuel: "Petrol",   features: ["ประกันชั้น 1", "Massage Seats", "Burmester 3D"],      tag: "Exclusive",emoji: "🏎️" },
  { id: 9,  brand: "Tesla",        model: "Model S Plaid",  year: 2024, price: 7490, type: "Electric",  status: "available", rating: 4.9, reviews: 58,  seats: 5, engine: "Tri Motor EV",transmission: "Auto", fuel: "Electric", features: ["ประกันชั้น 1", "Autopilot", "0–100 in 2.1s"],         tag: "EV",       emoji: "⚡" },
  { id: 10, brand: "Tesla",        model: "Model 3 LR",     year: 2024, price: 3490, type: "Electric",  status: "available", rating: 4.8, reviews: 112, seats: 5, engine: "Dual Motor",  transmission: "Auto", fuel: "Electric", features: ["ประกันชั้น 1", "Autopilot", "Glass Roof"],            tag: "EV",       emoji: "⚡" },
  { id: 11, brand: "Porsche",      model: "Cayenne S",      year: 2024, price: 9900, type: "Sports",    status: "available", rating: 5.0, reviews: 41,  seats: 5, engine: "2.9T 440hp",  transmission: "Auto", fuel: "Petrol",   features: ["ประกันชั้น 1", "Sport Chrono", "BOSE Surround"],      tag: "New",      emoji: "🏎️" },
  { id: 12, brand: "Porsche",      model: "911 Carrera",    year: 2024, price: 15900, type: "Sports",   status: "available", rating: 5.0, reviews: 22,  seats: 2, engine: "3.0T 385hp",  transmission: "Auto", fuel: "Petrol",   features: ["ประกันชั้น 1", "Sport Exhaust", "PASM"],              tag: "Exclusive",emoji: "🏎️" },
  { id: 13, brand: "Lexus",        model: "LM 350h",        year: 2024, price: 8900, type: "Executive", status: "available", rating: 5.0, reviews: 28,  seats: 4, engine: "2.5L Hybrid", transmission: "Auto", fuel: "Hybrid",   features: ["ประกันชั้น 1", "VIP Cabin", "Mark Levinson"],         tag: "VIP",      emoji: "🚐" },
  { id: 14, brand: "Range Rover",  model: "Sport HST",      year: 2024, price: 8490, type: "Luxury",    status: "available", rating: 4.9, reviews: 45,  seats: 5, engine: "3.0T 395hp",  transmission: "Auto", fuel: "Petrol",   features: ["ประกันชั้น 1", "Terrain Response", "Meridian Audio"],  tag: undefined,  emoji: "🚙" },
];

const typeCategories: { key: "all" | CarType; label: string; emoji: string }[] = [
  { key: "all",       label: "ทั้งหมด",   emoji: "🚗" },
  { key: "Sedan",     label: "Sedan",     emoji: "🚗" },
  { key: "SUV",       label: "SUV",       emoji: "🚙" },
  { key: "Luxury",    label: "Luxury",    emoji: "💎" },
  { key: "Electric",  label: "Electric",  emoji: "⚡" },
  { key: "Sports",    label: "Sports",    emoji: "🏎️" },
  { key: "Executive", label: "Executive", emoji: "✦" },
];

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "แนะนำ" },
  { key: "price_asc",   label: "ราคา: ต่ำ→สูง" },
  { key: "price_desc",  label: "ราคา: สูง→ต่ำ" },
  { key: "rating",      label: "Rating สูงสุด" },
];

const tagColors: Record<string, string> = {
  "ยอดนิยม": "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20",
  "แนะนำ":   "bg-[#ca9d32]/10 text-[#ca9d32] border-[#ca9d32]/20",
  "New":      "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20",
  "EV":       "bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/20",
  "Exclusive":"bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20",
  "VIP":      "bg-[#f0c040]/10 text-[#ca9d32] border-[#f0c040]/20",
  "Sold Out": "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
};

// ── Car Card ──────────────────────────────────────────────────────────────────
function CarCard({ car }: { car: CarItem }) {
  const available = car.status === "available";
  return (
    <div className={`group bg-white rounded-3xl border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] ${available ? "border-[#ede9e0] hover:border-[#ca9d32]/30" : "border-[#ede9e0] opacity-70"}`}>
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-[#f5f4f0] to-[#ede9e0] flex items-center justify-center overflow-hidden">
        <span className="text-7xl group-hover:scale-110 transition-transform duration-500 select-none">{car.emoji}</span>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {car.tag && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${tagColors[car.tag] ?? "bg-[#f0ede7] text-[#6a6a6a] border-[#ede9e0]"}`}>
              {car.tag}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${available ? "bg-[#22c55e]/12 text-[#22c55e] border-[#22c55e]/20" : "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20"}`}>
            {available ? "● ว่าง" : "● ไม่ว่าง"}
          </span>
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur rounded-full px-2.5 py-1 border border-white/60">
          <Star className="w-3 h-3 text-[#f0c040] fill-[#f0c040]" />
          <span className="text-xs font-bold text-[#1a1a1a]">{car.rating}</span>
        </div>

        {/* Fuel badge bottom */}
        <div className="absolute bottom-3 right-3">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#1a1a1a]/70 text-white/80 backdrop-blur">
            {car.fuel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-[10px] font-bold text-[#ca9d32] uppercase tracking-widest mb-0.5">{car.brand}</p>
        <h3 className="text-lg font-black text-[#1a1a1a] leading-tight mb-1">{car.model}</h3>
        <p className="text-xs text-[#8a8a8a] mb-4">{car.year} • {car.type}</p>

        {/* Specs row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: <Gauge className="w-3.5 h-3.5" />, val: car.engine },
            { icon: <Users className="w-3.5 h-3.5" />, val: `${car.seats} ที่นั่ง` },
            { icon: <Zap className="w-3.5 h-3.5" />,   val: car.transmission },
          ].map(({ icon, val }) => (
            <div key={val} className="flex flex-col items-center gap-1 bg-[#f8f6f2] rounded-xl py-2 px-1">
              <span className="text-[#8a8a8a]">{icon}</span>
              <span className="text-[10px] font-semibold text-[#4a4a4a] text-center leading-tight">{val}</span>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {car.features.slice(0, 3).map(f => (
            <span key={f} className="flex items-center gap-1 text-[10px] font-semibold text-[#6a6a6a] bg-[#f5f4f0] px-2 py-0.5 rounded-lg">
              <Check className="w-3 h-3 text-[#22c55e]" /> {f}
            </span>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-2xl font-black text-[#1a1a1a]">{car.price.toLocaleString()}</span>
              <span className="text-xs text-[#8a8a8a] font-medium ml-1">฿/วัน</span>
            </div>
            <span className="text-[11px] text-[#8a8a8a]">
              <Star className="w-3 h-3 text-[#f0c040] fill-[#f0c040] inline mr-0.5" />
              {car.rating} ({car.reviews})
            </span>
          </div>
          <div className="flex gap-2">
            <button
              disabled={!available}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] ${available
                ? "bg-[#1a1a1a] text-white hover:bg-[#ca9d32] hover:shadow-[0_4px_20px_rgba(202,157,50,0.35)]"
                : "bg-[#f0ede7] text-[#b0a898] cursor-not-allowed"}`}
            >
              {available ? "จองรถนี้" : "ไม่ว่าง"}
            </button>
            <button className="py-3 px-3.5 rounded-xl border border-[#ede9e0] text-[#6a6a6a] hover:border-[#ca9d32]/40 hover:text-[#1a1a1a] transition">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FleetPage() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<"all" | CarType>("all");
  const [sortBy, setSortBy] = useState<SortKey>("recommended");
  const [maxPrice, setMaxPrice] = useState(20000);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = allCars
    .filter(c => {
      const matchType   = activeType === "all" || c.type === activeType;
      const matchSearch = !search || `${c.brand} ${c.model}`.toLowerCase().includes(search.toLowerCase());
      const matchPrice  = c.price <= maxPrice;
      const matchAvail  = !onlyAvailable || c.status === "available";
      return matchType && matchSearch && matchPrice && matchAvail;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc")  return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "rating")     return b.rating - a.rating;
      return 0;
    });

  const availableCount = allCars.filter(c => c.status === "available").length;

  return (
    <div
      className="min-h-screen bg-[#f5f4f0] pt-20 pb-28 lg:pb-12"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="bg-[#1a1a1a] text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-[#ca9d32] text-xs font-bold tracking-[0.2em] uppercase mb-2">AURA Premium</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">คลาสรถทั้งหมด</h1>
              <p className="text-[#5a5a5a] text-sm mt-2">
                <span className="text-[#22c55e] font-semibold">{availableCount} คัน</span> พร้อมให้เช่าตอนนี้ • ส่งภายใน 2 ชั่วโมง
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3 flex-wrap">
              {[
                { n: allCars.length, label: "รถทั้งหมด" },
                { n: [...new Set(allCars.map(c => c.brand))].length, label: "แบรนด์" },
                { n: typeCategories.length - 1, label: "คลาส" },
              ].map(({ n, label }) => (
                <div key={label} className="bg-white/6 border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[80px]">
                  <div className="text-2xl font-black">{n}</div>
                  <div className="text-[10px] text-[#5a5a5a] uppercase tracking-wide mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-7">

        {/* ── SEARCH + CONTROLS ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0a898]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา เช่น BMW, SUV, Hybrid..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#ede9e0] text-sm focus:outline-none focus:border-[#ca9d32] focus:ring-2 focus:ring-[#ca9d32]/15 transition placeholder:text-[#b0a898]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a898] hover:text-[#1a1a1a]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-xl bg-white border border-[#ede9e0] text-sm font-semibold text-[#4a4a4a] focus:outline-none focus:border-[#ca9d32] cursor-pointer"
            >
              {sortOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a] pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${showFilters ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white border-[#ede9e0] text-[#4a4a4a] hover:border-[#1a1a1a]/30"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            ตัวกรอง
            {(maxPrice < 20000 || onlyAvailable) && (
              <span className="w-2 h-2 rounded-full bg-[#ca9d32]" />
            )}
          </button>
        </div>

        {/* ── FILTER PANEL ──────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white border border-[#ede9e0] rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Price range */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-[#8a8a8a] uppercase tracking-widest">ราคาสูงสุด</label>
                <span className="text-sm font-black text-[#ca9d32]">฿{maxPrice.toLocaleString()}/วัน</span>
              </div>
              <input
                type="range" min={1000} max={20000} step={500}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#ca9d32]"
              />
              <div className="flex justify-between text-[10px] text-[#b0a898] mt-1">
                <span>฿1,000</span><span>฿20,000</span>
              </div>
            </div>

            {/* Available only */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setOnlyAvailable(v => !v)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${onlyAvailable ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#16a34a]" : "border-[#ede9e0] text-[#6a6a6a] hover:border-[#ca9d32]/30"}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${onlyAvailable ? "border-[#22c55e] bg-[#22c55e]" : "border-[#c0bab2]"}`}>
                  {onlyAvailable && <Check className="w-3 h-3 text-white" />}
                </div>
                แสดงเฉพาะรถว่าง
              </button>
            </div>
          </div>
        )}

        {/* ── CATEGORY TABS ─────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-7">
          {typeCategories.map(cat => {
            const isActive = activeType === cat.key;
            const count = cat.key === "all" ? allCars.length : allCars.filter(c => c.type === cat.key).length;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveType(cat.key as "all" | CarType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${isActive
                  ? "bg-[#1a1a1a] text-white shadow-sm"
                  : "bg-white border border-[#ede9e0] text-[#6a6a6a] hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a]"}`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/15 text-white" : "bg-[#f0ede7] text-[#8a8a8a]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── RESULTS COUNT ─────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-[#8a8a8a]">
            พบ <span className="font-bold text-[#1a1a1a]">{filtered.length}</span> คัน
            {activeType !== "all" && <span> ใน {activeType}</span>}
          </p>
          {(search || activeType !== "all" || maxPrice < 20000 || onlyAvailable) && (
            <button
              onClick={() => { setSearch(""); setActiveType("all"); setMaxPrice(20000); setOnlyAvailable(false); }}
              className="text-xs font-bold text-[#ef4444] hover:text-[#dc2626] flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" /> ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* ── CAR GRID ──────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-5">🔍</div>
            <h3 className="text-xl font-black text-[#1a1a1a] mb-2">ไม่พบรถที่ตรงกัน</h3>
            <p className="text-[#8a8a8a] text-sm mb-6">ลองปรับตัวกรองใหม่ หรือล้างการค้นหา</p>
            <button
              onClick={() => { setSearch(""); setActiveType("all"); setMaxPrice(20000); setOnlyAvailable(false); }}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#1a1a1a] text-white text-sm font-bold hover:bg-[#ca9d32] transition-all duration-200"
            >
              <X className="w-4 h-4" /> ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}

        {/* ── PROMO BANNER ──────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] p-7 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute right-0 top-0 bottom-0 w-64 opacity-5"
              style={{ backgroundImage: "repeating-linear-gradient(45deg,#ca9d32 0,#ca9d32 1px,transparent 0,transparent 50%)", backgroundSize: "16px 16px" }} />
            <div className="relative z-10">
              <p className="text-[#ca9d32] text-xs font-bold tracking-widest uppercase mb-1.5">VIP สมาชิกพิเศษ</p>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">จองผ่านแอปรับส่วนลด 10%</h3>
              <p className="text-[#5a5a5a] text-sm">ทุกประเภทรถ ทุกวัน ไม่มีขั้นต่ำ</p>
            </div>
            <a
              href="/login"
              className="relative z-10 shrink-0 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#ca9d32] to-[#f0c040] text-black font-black text-sm shadow-[0_6px_24px_rgba(202,157,50,0.4)] hover:scale-105 active:scale-95 transition-all duration-200"
            >
              สมัครฟรี <ChevronRight className="w-4 h-4" />
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