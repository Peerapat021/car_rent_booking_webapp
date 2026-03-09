'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaDownload,
  FaSearch,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaSortAmountDown,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

import { getCarClasses } from '@/lib/services/client/admin/car_classes/get';
import { deleteCarClasses } from '@/lib/services/client/admin/car_classes/delete';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CarClass {
  class_id: number;
  class_code: string;
  class_name: string;
  class_description: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at?: Date | string;
}

// ── Stat Card (ปรับให้เหมือนหน้า Car) ────────────────────────────────────────

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

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  const config = active
    ? {
        bg: 'bg-emerald-50',
        color: 'text-emerald-700',
        dot: 'bg-emerald-500',
        text: 'เปิดใช้งาน',
      }
    : {
        bg: 'bg-rose-50',
        color: 'text-rose-700',
        dot: 'bg-rose-500',
        text: 'ปิดใช้งาน',
      };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.text}
    </span>
  );
}

// ── Pagination (copy ตรงจากหน้า Car) ─────────────────────────────────────────

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

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CarClassesPage({ car_classes: initialClasses }: { car_classes: CarClass[] }) {
  const router = useRouter();
  const [carClasses, setCarClasses] = useState<CarClass[]>(initialClasses);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false); // ถ้าต้องการ reload จริง ๆ ค่อย set true

  const itemsPerPage = 10;

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    if (!carClasses.length) return;

    const active = carClasses.filter((c) => c.is_active).length;
    setStats({
      total: carClasses.length,
      active,
      inactive: carClasses.length - active,
    });
  }, [carClasses]);

  const filteredClasses = carClasses.filter(
    (c) =>
      c.class_code.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      c.class_name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (c.class_description || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const currentItems = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ── CRUD Handlers ────────────────────────────────────────────────────────────

  const refreshData = async () => {
    try {
      setLoading(true);
      const fresh = await getCarClasses(); // เรียก API ใหม่
      setCarClasses(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId: number, name: string) => {
    if (!confirm(`ยืนยันการลบคลาส "${name}" ?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    try {
      await deleteCarClasses(classId.toString());
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบได้');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-800 mx-auto mb-3" />
          <p className="text-sm text-gray-400">กำลังโหลดข้อมูลคลาสรถ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">คลาสรถทั้งหมด</h1>
            <p className="text-sm text-gray-400 mt-1">จัดการประเภทและระดับของรถเช่าในระบบ</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <FaDownload size={13} /> ดาวน์โหลด
            </button>
            <button
              onClick={() => router.push('/admin/car_classes/new')} // หรือเปิด modal
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
            >
              <FaPlus size={12} /> เพิ่มคลาสใหม่
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="คลาสทั้งหมด"
            value={stats.total}
            icon={<FaCar className="text-blue-600" size={18} />}
            accent="bg-blue-50"
          />
          <StatCard
            label="เปิดใช้งาน"
            value={stats.active}
            icon={<FaCheckCircle className="text-emerald-600" size={18} />}
            accent="bg-emerald-50"
          />
          <StatCard
            label="ปิดใช้งาน"
            value={stats.inactive}
            icon={<FaTimesCircle className="text-rose-600" size={18} />}
            accent="bg-rose-50"
          />
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหา รหัสย่อ, ชื่อคลาส, คำอธิบาย..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-gray-900 placeholder-gray-400 transition"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['รหัสย่อ', 'ชื่อคลาส', 'คำอธิบาย', 'ลำดับ', 'สถานะ', 'จัดการ'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 5 ? 'text-center' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <FaSearch className="text-gray-200 mx-auto mb-3" size={28} />
                      <p className="text-sm text-gray-400">
                        {searchTerm ? 'ไม่พบคลาสที่ตรงกับคำค้นหา' : 'ยังไม่มีคลาสรถในระบบ'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((cls) => (
                    <tr key={cls.class_id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-medium text-gray-700">{cls.class_code}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{cls.class_name}</td>
                      <td className="px-5 py-4 text-gray-600">{cls.class_description || '—'}</td>
                      <td className="px-5 py-4 text-center text-gray-600">
                        {cls.sort_order ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge active={cls.is_active} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/car_classes/${cls.class_id}`)}
                            title="แก้ไข"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(cls.class_id, cls.class_name)}
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

          {/* Pagination & Summary */}
          {filteredClasses.length > 0 && (
            <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-400">
                แสดง <span className="font-medium text-gray-600">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredClasses.length)}</span> จาก <span className="font-medium text-gray-600">{filteredClasses.length.toLocaleString()}</span> รายการ
              </p>
              <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}