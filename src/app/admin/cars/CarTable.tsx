'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaEdit, FaTrash, FaPlus, FaDownload, FaSearch,
  FaCar, FaWrench, FaCheckCircle, FaPercentage, FaClock,
  FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';

import { deleteCar } from '@/lib/services/client/admin/cars/delete';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Car {
  car_id: number;
  class_id: number | null;
  car_brand: string;
  car_model: string;
  car_year: number | null;
  car_color: string | null;
  car_license_plate: string;
  car_status: 'available' | 'maintenance' | string | null;
  car_mileage: number | null;
  car_image_cover: string | null;
  create_at_car: Date | string;
  branch_id?: number | null;
  car_created_by?: number | null;
  promotions?: Array<{
    promo_id: number;
    promo_code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: string | number;
    promo_start: string;
    promo_end: string;
  }>;
}

interface CarClass {
  class_id: number;
  class_code: string;
  class_name: string;
}

interface PromoInfo {
  hasActive: boolean;
  hasUpcoming: boolean;
  maxActive?: { type: 'percent' | 'fixed'; value: number };
  maxUpcoming?: { type: 'percent' | 'fixed'; value: number };
}

// ── Status Config ──────────────────────────────────────────────────────────────

function getStatusConfig(status: string | null) {
  if (!status || !(status in { available: 1, maintenance: 1 })) {
    return { color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400', text: 'ไม่ระบุ' };
  }
  return {
    available: { color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'พร้อมใช้งาน' },
    maintenance: { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'ซ่อมบำรุง' },
  }[status as 'available' | 'maintenance'];
}

// ── Promo Badge ────────────────────────────────────────────────────────────────

function PromoBadge({ info }: { info: PromoInfo }) {
  if (info.hasActive && info.maxActive) {
    const d = info.maxActive;
    return (
      <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
        {d.type === 'percent' ? `${d.value}% OFF` : `฿${Number(d.value).toLocaleString()} ลด`}
      </span>
    );
  }
  if (info.hasActive) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
        <FaPercentage size={9} /> โปรโมชัน
      </span>
    );
  }
  if (info.hasUpcoming && info.maxUpcoming) {
    const d = info.maxUpcoming;
    return (
      <span className="inline-flex items-center gap-1 bg-amber-400 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
        <FaClock size={9} /> {d.type === 'percent' ? `${d.value}% เร็วๆ นี้` : `฿${Number(d.value).toLocaleString()} เร็วๆ นี้`}
      </span>
    );
  }
  if (info.hasUpcoming) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-400 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
        <FaClock size={9} /> โปรล่วงหน้า
      </span>
    );
  }
  return null;
}

// ── Car Image Cell ─────────────────────────────────────────────────────────────

function CarImageCell({ car, promoInfo }: { car: Car; promoInfo: PromoInfo | undefined }) {
  return (
    <div className="relative inline-block">
      {car.car_image_cover ? (
        <img
          src={car.car_image_cover}
          alt={`${car.car_brand} ${car.car_model}`}
          className="w-24 h-16 object-cover rounded-lg border border-gray-100 shadow-sm"
        />
      ) : (
        <div className="w-24 h-16 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1 border border-gray-100">
          <FaCar className="text-gray-300" size={18} />
          <span className="text-[10px] text-gray-400">ไม่มีรูป</span>
        </div>
      )}
      {promoInfo && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <PromoBadge info={promoInfo} />
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent,
}: {
  label: string; value: string | number; icon: React.ReactNode; accent: string;
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

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
  current, total, onChange,
}: {
  current: number; total: number; onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  // Build page number array with ellipsis
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

// ── Filter Chip ────────────────────────────────────────────────────────────────

function FilterChip({
  checked, onChange, icon, label, activeClass,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all
        ${checked
          ? `${activeClass} border-transparent shadow-sm`
          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CarManagementPage({
  cars, carClasses,
}: {
  cars: Car[]; carClasses: CarClass[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({ total: 0, available: 0, maintenance: 0 });
  const [promoInfo, setPromoInfo] = useState<Record<number, PromoInfo>>({});

  useEffect(() => { setLoading(false); }, []);

  useEffect(() => {
    if (!cars.length) return;
    const now = new Date();
    const countByStatus: Record<string, number> = {};
    const info: Record<number, PromoInfo> = {};

    cars.forEach((car) => {
      countByStatus[car.car_status || ''] = (countByStatus[car.car_status || ''] || 0) + 1;
      if (!car.promotions?.length) return;

      let hasActive = false, hasUpcoming = false;
      let maxActive: PromoInfo['maxActive'], maxUpcoming: PromoInfo['maxUpcoming'];

      car.promotions.forEach((promo) => {
        if (!promo.promo_start || !promo.promo_end) return;
        const start = new Date(promo.promo_start);
        const end = new Date(promo.promo_end);
        end.setUTCHours(23, 59, 59, 999);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        const val = Number(promo.discount_value);
        const type = promo.discount_type as 'percent' | 'fixed';

        if (start <= now && now <= end) {
          hasActive = true;
          if (!isNaN(val) && val > 0 && (!maxActive || val > maxActive.value || (maxActive.type === 'fixed' && type === 'percent')))
            maxActive = { type, value: val };
        }
        if (start > now && end > now) {
          hasUpcoming = true;
          if (!isNaN(val) && val > 0 && (!maxUpcoming || val > maxUpcoming.value || (maxUpcoming.type === 'fixed' && type === 'percent')))
            maxUpcoming = { type, value: val };
        }
      });

      if (hasActive || hasUpcoming) info[car.car_id] = { hasActive, hasUpcoming, maxActive, maxUpcoming };
    });

    setStats({ total: cars.length, available: countByStatus.available || 0, maintenance: countByStatus.maintenance || 0 });
    setPromoInfo(info);
  }, [cars]);

  const filteredCars = cars.filter((car) => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = !q ||
      `${car.car_id}`.includes(q) ||
      car.car_brand.toLowerCase().includes(q) ||
      car.car_model.toLowerCase().includes(q) ||
      car.car_license_plate.toLowerCase().includes(q) ||
      (car.car_color?.toLowerCase() ?? '').includes(q) ||
      `${car.car_year}`.includes(q);
    const p = promoInfo[car.car_id];
    return matchSearch && (!showDiscountOnly || p?.hasActive) && (!showUpcomingOnly || p?.hasUpcoming);
  });

  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const currentItems = filteredCars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, showDiscountOnly, showUpcomingOnly]);

  const handleDelete = async (carId: number) => {
    if (!confirm(`ยืนยันการลบรถ #${carId}?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    try {
      await deleteCar(carId.toString());
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบได้ กรุณาลองใหม่');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-3" />
        <p className="text-sm text-gray-400">กำลังโหลดข้อมูลรถ...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">รถเช่าทั้งหมด</h1>
            <p className="text-sm text-gray-400 mt-1">จัดการและติดตามสถานะรถในระบบ</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <FaDownload size={13} /> ดาวน์โหลด
            </button>
            <button
              onClick={() => router.push('/admin/cars/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
            >
              <FaPlus size={12} /> เพิ่มรถใหม่
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="รถทั้งหมด"
            value={stats.total}
            icon={<FaCar className="text-blue-600" size={18} />}
            accent="bg-blue-50"
          />
          <StatCard
            label="พร้อมใช้งาน"
            value={stats.available}
            icon={<FaCheckCircle className="text-emerald-600" size={18} />}
            accent="bg-emerald-50"
          />
          <StatCard
            label="ซ่อมบำรุง"
            value={stats.maintenance}
            icon={<FaWrench className="text-amber-600" size={18} />}
            accent="bg-amber-50"
          />
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-64 max-w-xl">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา ยี่ห้อ, รุ่น, ทะเบียน, สี, ปี..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
            />
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />

          {/* Filter chips */}
          <FilterChip
            checked={showDiscountOnly}
            onChange={setShowDiscountOnly}
            icon={<FaPercentage size={11} className={showDiscountOnly ? 'text-red-500' : 'text-gray-400'} />}
            label="มีส่วนลด"
            activeClass="bg-red-50 text-red-600"
          />
          <FilterChip
            checked={showUpcomingOnly}
            onChange={setShowUpcomingOnly}
            icon={<FaClock size={11} className={showUpcomingOnly ? 'text-amber-500' : 'text-gray-400'} />}
            label="โปรล่วงหน้า"
            activeClass="bg-amber-50 text-amber-600"
          />

          {/* Result count */}
          {(searchTerm || showDiscountOnly || showUpcomingOnly) && (
            <span className="ml-auto text-xs text-gray-400">
              {filteredCars.length.toLocaleString()} คัน จากทั้งหมด {cars.length.toLocaleString()} คัน
            </span>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['รูปภาพ', 'ยี่ห้อ / รุ่น', 'ทะเบียน', 'คลาสรถ', 'ปี / สี', 'เลขไมล์', 'สถานะ', 'จัดการ'].map((h, i) => (
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
                        {searchTerm || showDiscountOnly || showUpcomingOnly
                          ? 'ไม่พบรถที่ตรงกับเงื่อนไข'
                          : 'ยังไม่มีข้อมูลรถในระบบ'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((car) => {
                    const status = getStatusConfig(car.car_status || '');
                    const carClass = carClasses.find((c) => c.class_id === car.class_id);
                    const promo = promoInfo[car.car_id];

                    return (
                      <tr key={car.car_id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">

                        {/* Image */}
                        <td className="px-5 py-4">
                          <CarImageCell car={car} promoInfo={promo} />
                        </td>

                        {/* Brand / Model */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{car.car_brand} {car.car_model}</p>
                          <p className="text-xs text-gray-400 mt-0.5">#{car.car_id}</p>
                        </td>

                        {/* Plate */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                            {car.car_license_plate}
                          </span>
                        </td>

                        {/* Class */}
                        <td className="px-5 py-4 text-gray-600">
                          {carClass
                            ? <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">{carClass.class_code} · {carClass.class_name}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Year / Color */}
                        <td className="px-5 py-4">
                          <p className="text-gray-700">{car.car_year ?? '—'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{car.car_color || '—'}</p>
                        </td>

                        {/* Mileage */}
                        <td className="px-5 py-4 font-mono text-gray-600 text-sm">
                          {car.car_mileage != null
                            ? <>{car.car_mileage.toLocaleString()} <span className="text-gray-400 font-sans text-xs">km</span></>
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {status && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.text}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => router.push(`/admin/cars/${car.car_id}`)}
                              title="แก้ไข"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(car.car_id)}
                              title="ลบ"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer / Pagination ── */}
          {filteredCars.length > 0 && (
            <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-400">
                แสดง <span className="font-medium text-gray-600">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredCars.length)}</span> จาก <span className="font-medium text-gray-600">{filteredCars.length.toLocaleString()}</span> คัน
              </p>
              <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}