'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaSearch, FaCheckCircle, FaExclamationTriangle, FaClock,
  FaEdit, FaTrash, FaMoneyBillWave, FaCar, FaUserCheck,
  FaBan, FaHandHoldingUsd, FaShieldAlt, FaPlus, FaFilter,
} from 'react-icons/fa';

import { getBookingOverview } from '@/lib/services/client/admin/booking_overview/get';
import { deleteBooking } from '@/lib/services/client/admin/booking_overview/delete';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingOverview {
  booking_id: number;
  customer_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  car_brand: string;
  car_model: string;
  car_license_plate: string;
  pickup_datetime?: string | null;
  expected_return_datetime?: string | null;
  booking_start_date: string;
  booking_end_date: string;
  deposit_amount: number;
  insurance_amount: number;
  rental_amount: number;
  total_discount: number;
  booking_total_price: number;
  total_paid: number;
  paid_insurance_total: number;
  remaining_amount: number;
  payment_methods: string[];
  booking_status: string;
}

interface StatusConfig {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
  icon: React.ReactNode;
}

type Summary = {
  totalBookings: number;
  byStatus: Record<string, number>;
  totalBookingPrice: number;
  totalPaid: number;
  totalRemaining: number;
  totalInsurancePaid: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatThaiDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function getStatusConfig(status: string): StatusConfig {
  const map: Record<string, StatusConfig> = {
    pending:         { label: 'รอยืนยัน',   colorClass: 'text-amber-700',   bgClass: 'bg-amber-50',   borderClass: 'border-amber-200',  dotClass: 'bg-amber-400',   icon: <FaClock size={9} /> },
    pending_balance: { label: 'รอชำระ',     colorClass: 'text-orange-700',  bgClass: 'bg-orange-50',  borderClass: 'border-orange-200', dotClass: 'bg-orange-400',  icon: <FaHandHoldingUsd size={9} /> },
    confirmed:       { label: 'ยืนยันแล้ว', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200',dotClass: 'bg-emerald-400', icon: <FaCheckCircle size={9} /> },
    picked_up:       { label: 'รับรถแล้ว',  colorClass: 'text-blue-700',    bgClass: 'bg-blue-50',    borderClass: 'border-blue-200',   dotClass: 'bg-blue-400',    icon: <FaCar size={9} /> },
    returned:        { label: 'คืนรถแล้ว',  colorClass: 'text-violet-700',  bgClass: 'bg-violet-50',  borderClass: 'border-violet-200', dotClass: 'bg-violet-400',  icon: <FaCheckCircle size={9} /> },
    completed:       { label: 'เสร็จสิ้น',  colorClass: 'text-green-800',   bgClass: 'bg-green-50',   borderClass: 'border-green-300',  dotClass: 'bg-green-500',   icon: <FaCheckCircle size={9} /> },
    cancelled:       { label: 'ยกเลิก',     colorClass: 'text-red-700',     bgClass: 'bg-red-50',     borderClass: 'border-red-200',    dotClass: 'bg-red-400',     icon: <FaBan size={9} /> },
    no_show:         { label: 'ไม่มารับ',   colorClass: 'text-slate-500',   bgClass: 'bg-slate-50',   borderClass: 'border-slate-200',  dotClass: 'bg-slate-400',   icon: <FaBan size={9} /> },
  };
  return map[status] ?? { label: status, colorClass: 'text-slate-500', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', dotClass: 'bg-slate-400', icon: null };
}

// ── Payment Badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ method }: { method: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    qr:          { label: 'QR',   classes: 'bg-purple-50 text-purple-700 border-purple-200' },
    cash:        { label: 'สด',   classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    credit_card: { label: 'บัตร', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
    transfer:    { label: 'โอน',  classes: 'bg-sky-50 text-sky-700 border-sky-200' },
  };
  const c = map[method] ?? { label: method, classes: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-md border tracking-wide ${c.classes}`}>
      {c.label}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

function StatCard({ label, value, sub, icon, gradient, iconBg }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 ${gradient} shadow-sm border border-white/60`}>
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-1 top-6 w-14 h-14 rounded-full bg-white/10" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1.5">{label}</p>
          <p className="text-2xl font-black tracking-tight leading-none">{value}</p>
          {sub && <p className="text-xs opacity-60 mt-1.5 font-medium">{sub}</p>}
        </div>
        <div className={`flex-none w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Status Filter ─────────────────────────────────────────────────────────────

const STATUS_ORDER = ['pending', 'pending_balance', 'confirmed', 'picked_up', 'returned', 'completed', 'cancelled', 'no_show'];

function StatusFilterChips({ summary, selectedStatus, onSelectStatus }: {
  summary: Summary;
  selectedStatus: string | null;
  onSelectStatus: (s: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onSelectStatus(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 cursor-pointer
          ${selectedStatus === null
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
          }`}
      >
        ทั้งหมด <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-black ${selectedStatus === null ? 'bg-white/20' : 'bg-slate-100'}`}>{summary.totalBookings}</span>
      </button>

      {Object.entries(summary.byStatus)
        .filter(([, c]) => c > 0)
        .sort((a, b) => STATUS_ORDER.indexOf(a[0]) - STATUS_ORDER.indexOf(b[0]))
        .map(([status, count]) => {
          const sc = getStatusConfig(status);
          const active = selectedStatus === status;
          return (
            <button
              key={status}
              onClick={() => onSelectStatus(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all duration-150 cursor-pointer font-bold
                ${active
                  ? `${sc.bgClass} ${sc.colorClass} ${sc.borderClass} shadow-sm`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${active ? sc.dotClass : 'bg-slate-300'}`} />
              {sc.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-black ${active ? 'bg-white/60' : 'bg-slate-100 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
    </div>
  );
}

// ── Table Row ─────────────────────────────────────────────────────────────────

function BookingRow({ booking, onDelete, index }: { booking: BookingOverview; onDelete: (id: number) => void; index: number }) {
  const router = useRouter();
  const sc = getStatusConfig(booking.booking_status);
  const paidIns = Number(booking.paid_insurance_total || 0);
  const remIns = Math.max(0, Number(booking.insurance_amount || 0) - paidIns);

  return (
    <tr
      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors duration-100 group"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* ID */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-black text-slate-900 text-sm tracking-tight">#{booking.booking_id}</span>
      </td>

      {/* Customer */}
      <td className="px-4 py-3 min-w-44">
        <p className="text-sm font-bold text-slate-900 leading-snug">{booking.contact_name || '—'}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium tracking-wide">{booking.contact_phone || '—'}</p>
      </td>

      {/* Car */}
      <td className="px-4 py-3 min-w-36">
        <p className="text-sm font-bold text-slate-900 leading-snug">{booking.car_brand} {booking.car_model}</p>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5 tracking-widest">{booking.car_license_plate}</p>
      </td>

      {/* Dates */}
      <td className="px-4 py-3 min-w-40">
        <div className="flex flex-col gap-1 text-[11px] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-none" />
            <span className="text-slate-600">{formatThaiDateTime(booking.pickup_datetime || booking.booking_start_date)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-none" />
            <span className="text-slate-600">{formatThaiDateTime(booking.expected_return_datetime || booking.booking_end_date)}</span>
          </span>
        </div>
      </td>

      {/* Rental */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <span className="text-sm text-slate-600 font-semibold">฿{booking.rental_amount.toLocaleString()}</span>
      </td>

      {/* Discount */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {booking.total_discount > 0 ? (
          <span className="text-sm text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-md">
            -฿{booking.total_discount.toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-200 text-sm">—</span>
        )}
      </td>

      {/* Total */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <span className="text-sm font-black text-slate-900">฿{booking.booking_total_price.toLocaleString()}</span>
      </td>

      {/* Insurance */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-sm font-bold text-teal-600">฿{paidIns.toLocaleString()}</span>
          {remIns <= 0 && paidIns > 0 && <FaShieldAlt size={10} className="text-teal-400" />}
          {remIns > 0 && booking.insurance_amount > 0 && <FaClock size={10} className="text-amber-400" />}
        </div>
      </td>

      {/* Paid */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-sm font-bold text-emerald-600">฿{booking.total_paid.toLocaleString()}</span>
          {booking.remaining_amount <= 0 && booking.total_paid > 0 && <FaCheckCircle size={10} className="text-emerald-400" />}
          {booking.remaining_amount > 0 && booking.total_paid > 0 && <FaClock size={10} className="text-amber-400" />}
          {booking.total_paid === 0 && <FaExclamationTriangle size={10} className="text-red-400" />}
        </div>
      </td>

      {/* Remaining */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {booking.remaining_amount > 0 ? (
          <span className="text-sm font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
            ฿{booking.remaining_amount.toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-200 text-sm">—</span>
        )}
      </td>

      {/* Payment methods */}
      <td className="px-4 py-3 min-w-24">
        <div className="flex flex-wrap gap-1">
          {booking.payment_methods.length > 0
            ? booking.payment_methods.map(m => <PaymentBadge key={m} method={m} />)
            : <span className="text-xs text-slate-200">—</span>}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${sc.bgClass} ${sc.colorClass} ${sc.borderClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`} />
          {sc.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex gap-1 opacity-70 hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => router.push(`/admin/booking_overview/${booking.booking_id}`)}
            title="แก้ไข"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 cursor-pointer transition-all duration-150 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"
          >
            <FaEdit size={11} />
          </button>
          <button
            onClick={() => onDelete(booking.booking_id)}
            title="ลบ"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 cursor-pointer transition-all duration-150 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-sm"
          >
            <FaTrash size={11} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BookingOverviewPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({
    totalBookings: 0, byStatus: {}, totalBookingPrice: 0,
    totalPaid: 0, totalRemaining: 0, totalInsurancePaid: 0,
  });

  useEffect(() => {
    getBookingOverview()
      .then(setBookings)
      .catch(() => setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่'))
      .finally(() => setLoading(false));
  }, []);

  const filteredBookings = useMemo(() => {
    let r = bookings;
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      r = r.filter(b =>
        `${b.booking_id}`.includes(t) ||
        (b.contact_name ?? '').toLowerCase().includes(t) ||
        b.car_license_plate.toLowerCase().includes(t)
      );
    }
    if (selectedStatus) r = r.filter(b => b.booking_status === selectedStatus);
    return r;
  }, [bookings, searchTerm, selectedStatus]);

  useEffect(() => {
    if (loading) return;
    const src = searchTerm || selectedStatus ? filteredBookings : bookings;
    const byStatus: Record<string, number> = {};
    let totalBookingPrice = 0, totalPaid = 0, totalRemaining = 0, totalInsurancePaid = 0;
    src.forEach(b => {
      byStatus[b.booking_status] = (byStatus[b.booking_status] || 0) + 1;
      totalBookingPrice += Number(b.booking_total_price || 0);
      totalPaid += Number(b.total_paid || 0);
      totalRemaining += Number(b.remaining_amount || 0);
      totalInsurancePaid += Number(b.paid_insurance_total || 0);
    });
    setSummary({ totalBookings: src.length, byStatus, totalBookingPrice, totalPaid, totalRemaining, totalInsurancePaid });
  }, [bookings, filteredBookings, loading, searchTerm, selectedStatus]);

  const handleDelete = async (id: number) => {
    if (!confirm(`ยืนยันการลบการจอง #${id}?`)) return;
    try {
      await deleteBooking(id);
      setBookings(p => p.filter(b => b.booking_id !== id));
    } catch (e: any) {
      alert(`เกิดข้อผิดพลาด: ${e.message || 'ไม่สามารถลบได้'}`);
    }
  };

  // ── Loading ──
  if (loading) return (
    <div className="font-[Sarabun] min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-9 h-9 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="font-[Sarabun] min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
        <FaExclamationTriangle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-500 font-semibold">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="font-[Sarabun] min-h-screen bg-slate-50">

      {/* ── Page Header ── */}
      <div className="px-7 h-16 flex items-center justify-between ">
        <div>
          <h1 className="text-base font-black text-slate-900 tracking-tight">ภาพรวมการจอง</h1>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">จัดการและติดตามการจองทั้งหมด</p>
        </div>
        <button
          onClick={() => router.push('/admin/schedule')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-700 transition-colors shadow-sm"
        >
          <FaPlus size={10} /> จองรถใหม่
        </button>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-5 flex flex-col gap-4">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="การจองทั้งหมด"
            value={summary.totalBookings.toLocaleString()}
            icon={<FaUserCheck size={16} className="text-blue-600" />}
            gradient="bg-gradient-to-br from-blue-600 to-blue-800 text-white"
            iconBg="bg-white/20"
          />
          <StatCard
            label="ยอดรวม"
            value={`฿${summary.totalBookingPrice.toLocaleString()}`}
            icon={<FaMoneyBillWave size={16} className="text-violet-600" />}
            gradient="bg-gradient-to-br from-slate-800 to-slate-950 text-white"
            iconBg="bg-white/10"
          />
          <StatCard
            label="จ่ายแล้ว"
            value={`฿${summary.totalPaid.toLocaleString()}`}
            icon={<FaCheckCircle size={16} className="text-emerald-600" />}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
            iconBg="bg-white/20"
          />
          <StatCard
            label="คงเหลือ"
            value={`฿${summary.totalRemaining.toLocaleString()}`}
            icon={<FaExclamationTriangle size={16} className={summary.totalRemaining > 0 ? 'text-red-500' : 'text-slate-400'} />}
            gradient={summary.totalRemaining > 0
              ? 'bg-gradient-to-br from-red-500 to-red-700 text-white'
              : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500'}
            iconBg="bg-white/20"
          />
        </div>

        {/* ── Search + Filter ── */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
          {/* Search */}
          <div className="relative flex-none w-72">
            <FaSearch size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="ค้นหา เลขจอง, ชื่อ, ทะเบียน..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-sm border border-slate-200 rounded-lg outline-none bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="w-px h-5 bg-slate-200 flex-none" />

          <div className="flex items-center gap-2 flex-wrap flex-1">
            <FaFilter size={10} className="text-slate-300" />
            <StatusFilterChips
              summary={summary}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
            />
          </div>
        </div>

        {/* ── Table ── */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-20 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FaSearch size={20} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-semibold">
              {searchTerm || selectedStatus ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีการจอง'}
            </p>
            <p className="text-xs text-slate-300 mt-1">ลองปรับตัวกรองหรือค้นหาใหม่อีกครั้ง</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {[
                      { label: 'เลขจอง' },
                      { label: 'ลูกค้า' },
                      { label: 'รถ' },
                      { label: 'รับ — คืน' },
                      { label: 'ค่าเช่า',  right: true },
                      { label: 'ส่วนลด',   right: true },
                      { label: 'ยอดรวม',   right: true },
                      { label: 'ประกัน',   right: true },
                      { label: 'จ่ายแล้ว', right: true },
                      { label: 'คงเหลือ',  right: true },
                      { label: 'ชำระด้วย' },
                      { label: 'สถานะ' },
                      { label: 'จัดการ', center: true },
                    ].map(({ label, right, center }) => (
                      <th
                        key={label}
                        className={`px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap
                          ${right ? 'text-right' : center ? 'text-center' : 'text-left'}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b, i) => (
                    <BookingRow key={b.booking_id} booking={b} onDelete={handleDelete} index={i} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-[11px] text-slate-400 font-semibold">
                แสดง <span className="text-slate-600 font-black">{filteredBookings.length}</span> รายการ
                {(searchTerm || selectedStatus) && ` จากทั้งหมด ${bookings.length} รายการ`}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                คงเหลือรวม{' '}
                <span className={`font-black text-sm ${summary.totalRemaining > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                  ฿{summary.totalRemaining.toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}