"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Car,
  CalendarCheck,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { getDashboardStats, DashboardStats } from "@/lib/services/client/admin/dashboard-stats/get";
import { getRecentBookings, RecentBooking } from "@/lib/services/client/admin/dashboard-stats/recent";
import { getMonthlyRevenue, MonthlyRevenue } from "@/lib/services/client/admin/dashboard-stats/monthly";

export default function CarRentalDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    availableCars: 0,
    rentedCars: 0,
    pickupToday: 0,
    returnToday: 0,
    timestamp: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // อัปเดตเวลาทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("th-TH"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // โหลดข้อมูล Dashboard
  async function loadStats() {
    try {
      setRefreshing(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "โหลดข้อมูลล้มเหลว");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
    // อัปเดตทุก 2 นาที
    const interval = setInterval(loadStats, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // คำนวณ Utilization Rate
  const totalFleet = stats.availableCars + stats.rentedCars;
  const utilizationRate = totalFleet > 0
    ? Math.round((stats.rentedCars / totalFleet) * 100)
    : 0;

  const statCards = [
    {
      icon: Car,
      label: "รถพร้อมเช่า",
      value: stats.availableCars,
      unit: "คัน",
      color: "emerald",
      gradient: "from-emerald-500 to-teal-600",
      description: "พร้อมให้บริการ",
    },
    {
      icon: CheckCircle,
      label: "กำลังเช่าอยู่",
      value: stats.rentedCars,
      unit: "คัน",
      color: "blue",
      gradient: "from-blue-500 to-cyan-600",
      description: `อัตราการใช้งาน ${utilizationRate}%`,
    },
    {
      icon: CalendarCheck,
      label: "รับรถวันนี้",
      value: stats.pickupToday,
      unit: "รายการ",
      color: "violet",
      gradient: "from-violet-500 to-purple-600",
      description: "ต้องจัดเตรียม",
    },
    {
      icon: AlertTriangle,
      label: "คืนรถวันนี้",
      value: stats.returnToday,
      unit: "คัน",
      color: "amber",
      gradient: "from-amber-500 to-orange-600",
      description: "ต้องตรวจสอบ",
    },
  ];

  const quickActions = [
    {
      href: "/admin/schedule",
      title: "จองรถใหม่",
      icon: CalendarCheck,
      color: "blue",
      description: "สร้างการจองใหม่"
    },
    {
      href: "/admin/booking_overview",
      title: "รับ/คืนรถ",
      icon: Car,
      color: "emerald",
      description: "จัดการรับคืนรถ"
    },
    {
      href: "/admin/cars",
      title: "จัดการรถ",
      icon: Car,
      color: "yellow",
      description: "ข้อมูลรถทั้งหมด"
    },
    {
      href: "/admin/users",
      title: "ลูกค้า",
      icon: UserCheck,
      color: "indigo",
      description: "ข้อมูลลูกค้า"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-transparent blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/5 via-transparent to-transparent blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                ระบบบริหารรถเช่า
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                ภาพรวมและการจัดการแบบ Real-time
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {new Date().toLocaleDateString("th-TH", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 justify-end">
                  <Clock size={12} />
                  {currentTime || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
            <XCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">เกิดข้อผิดพลาด</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array(4).fill(0).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 animate-pulse"
              >
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl mb-4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            ))
            : statCards.map((card, index) => (
              <div
                key={card.label}
                className="group relative overflow-hidden bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 transition-all duration-300 hover:-translate-y-1"
                style={{
                  animation: 'fadeInUp 0.5s ease-out forwards',
                  animationDelay: `${index * 100}ms`,
                  opacity: 0,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`relative w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-${card.color}-500/20`}>
                  <card.icon className="text-white" size={28} strokeWidth={2.5} />
                </div>

                {/* Label */}
                <p className="relative text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {card.label}
                </p>

                {/* Value */}
                <div className="relative flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}>
                    {card.value}
                  </span>
                  <span className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                    {card.unit}
                  </span>
                </div>

                {/* Description */}
                <p className="relative text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <TrendingUp size={12} />
                  {card.description}
                </p>
              </div>
            ))}
        </section>

        {/* Fleet Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Fleet */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-medium text-slate-300 mb-4">รถทั้งหมด</h3>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-5xl font-bold mb-2">{totalFleet}</div>
                <p className="text-slate-400 text-sm">คัน</p>
              </div>
              <Car size={48} className="text-slate-700 opacity-50" strokeWidth={1.5} />
            </div>
          </div>

          {/* Utilization Rate */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
              อัตราการใช้งาน
            </h3>
            <div className="space-y-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {utilizationRate}%
              </div>
              <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stats.rentedCars} จาก {totalFleet} คันกำลังให้เช่า
              </p>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-medium text-amber-100 mb-4">งานวันนี้</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">รับรถ</span>
                <span className="text-2xl font-bold">{stats.pickupToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">คืนรถ</span>
                <span className="text-2xl font-bold">{stats.returnToday}</span>
              </div>
              <div className="pt-3 border-t border-white/20">
                <span className="text-xs text-amber-100">
                  รวม {stats.pickupToday + stats.returnToday} รายการ
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Charts & Recent Bookings */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                รายได้รายเดือน
              </h3>
              <select className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>6 เดือนที่แล้ว</option>
                <option>12 เดือนที่แล้ว</option>
              </select>
            </div>
            <div className="h-64">
              <RevenueChart />
            </div>
          </div>

          {/* Fleet Status Pie Chart */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
              สัดส่วนรถ
            </h3>
            <div className="h-48 flex items-center justify-center">
              <FleetPieChart
                available={stats.availableCars}
                rented={stats.rentedCars}
              />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">พร้อมเช่า</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.availableCars}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">กำลังเช่า</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{stats.rentedCars}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Bookings */}
        <section className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full" />
            การจองล่าสุด
          </h3>
          <RecentBookings />
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
            การจัดการด่วน
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <a
                key={action.href}
                href={action.href}
                className="group relative bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{
                  animation: 'fadeInUp 0.5s ease-out forwards',
                  animationDelay: `${index * 100}ms`,
                  opacity: 0,
                }}
              >
                <div className={`w-12 h-12 bg-${action.color}-100 dark:bg-${action.color}-950 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`text-${action.color}-600 dark:text-${action.color}-400`} size={24} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {action.description}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 dark:text-slate-400 py-8 space-y-2">
          <p>
            อัปเดตล่าสุด:{" "}
            {stats.timestamp
              ? new Date(stats.timestamp).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "medium",
              })
              : "—"}
          </p>
          {stats.debugTimezone && (
            <p className="text-xs text-slate-400">
              Timezone offset: {stats.debugTimezone.offsetUsed} minutes
            </p>
          )}
        </footer>
      </main>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Revenue Chart Component (ใช้ข้อมูลจริงจาก API)
function RevenueChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMonthlyRevenue(6);
        setRevenueData(data.data);
      } catch (error) {
        console.error("Error loading revenue data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || loading || revenueData.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
    const points: { x: number; y: number }[] = [];

    ctx.clearRect(0, 0, width, height);

    // วาด grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // คำนวณจุดบนกราฟ
    revenueData.forEach((data, index) => {
      const x = padding + (graphWidth / (revenueData.length - 1)) * index;
      const y = padding + graphHeight - (data.revenue / maxRevenue) * graphHeight;
      points.push({ x, y });
    });

    // วาด gradient area
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const prevPoint = points[index - 1];
        const cpX = (prevPoint.x + point.x) / 2;
        ctx.bezierCurveTo(cpX, prevPoint.y, cpX, point.y, point.x, point.y);
      }
    });
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fill();

    // วาดเส้นกราฟ
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        const prevPoint = points[index - 1];
        const cpX = (prevPoint.x + point.x) / 2;
        ctx.bezierCurveTo(cpX, prevPoint.y, cpX, point.y, point.x, point.y);
      }
    });
    ctx.stroke();

    // วาดจุด
    points.forEach(point => {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // วาด labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    revenueData.forEach((data, index) => {
      const x = padding + (graphWidth / (revenueData.length - 1)) * index;
      ctx.fillText(data.month, x, height - padding + 20);
    });

    // วาด Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight / 5) * i;
      const value = maxRevenue - (maxRevenue / 5) * i;
      ctx.fillText(`฿${(value / 1000).toFixed(0)}K`, padding - 10, y + 5);
    }
  }, [revenueData, loading]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return <canvas ref={canvasRef} width={800} height={300} className="w-full h-full" />;
}

// Fleet Pie Chart Component
function FleetPieChart({ available, rented }: { available: number; rented: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = radius * 0.6;

    const total = available + rented;
    if (total === 0) return;

    const availableAngle = (available / total) * Math.PI * 2;

    ctx.clearRect(0, 0, width, height);

    // วาดส่วน "กำลังเช่า" (สีน้ำเงิน)
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 - availableAngle), false);
    ctx.arc(centerX, centerY, innerRadius, -Math.PI / 2 + (Math.PI * 2 - availableAngle), -Math.PI / 2, true);
    ctx.closePath();
    ctx.fill();

    // วาดส่วน "พร้อมเช่า" (สีเขียว)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2 + (Math.PI * 2 - availableAngle), -Math.PI / 2 + Math.PI * 2, false);
    ctx.arc(centerX, centerY, innerRadius, -Math.PI / 2 + Math.PI * 2, -Math.PI / 2 + (Math.PI * 2 - availableAngle), true);
    ctx.closePath();
    ctx.fill();

    // วาดตัวเลขตรงกลาง
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 10);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('รถทั้งหมด', centerX, centerY + 15);

  }, [available, rented]);

  return <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />;
}

// Recent Bookings Component (ใช้ข้อมูลจริงจาก API)
function RecentBookings() {
  const [bookings, setBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRecentBookings();
        setBookings(data);
      } catch (error) {
        console.error("Error loading recent bookings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'ยืนยันแล้ว',
          className: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        };
      case 'pending':
      case 'pending_balance':
        return {
          label: 'รอยืนยัน',
          className: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        };
      case 'picked_up':
        return {
          label: 'รับรถแล้ว',
          className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        };
      case 'completed':
        return {
          label: 'เสร็จสิ้น',
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        };
      default:
        return {
          label: status,
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} วันที่แล้ว`;
    if (hours > 0) return `${hours} ชั่วโมงที่แล้ว`;
    return 'เมื่อสักครู่';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse">
            <div className="w-12 h-12 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
            </div>
            <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <Car size={48} className="mx-auto mb-4 opacity-30" />
        <p>ยังไม่มีการจองในขณะนี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking, index) => {
        const statusConfig = getStatusConfig(booking.status);
        return (
          <div
            key={booking.id}
            className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-300 border border-slate-200 dark:border-slate-700"
            style={{
              animation: 'fadeInUp 0.4s ease-out forwards',
              animationDelay: `${index * 50}ms`,
              opacity: 0,
            }}
          >
            <div className="flex items-start gap-4 flex-1">
              {/* Avatar */}
              <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold group-hover:scale-105 transition-transform">
                {(booking.customerName || booking.contactName)?.charAt(0) || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-1">
                {/* Main Name */}
                <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                  {booking.customerName || 'ไม่ระบุชื่อ'}
                </p>

                {/* Contact Name */}
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ผู้ติดต่อ: {booking.contactName || '-'}
                </p>
                
                {/* Contact Phone */}
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  เบอร์โทรศัพท์: {booking.contactPhone || '-'}
                </p>

                {/* Car */}
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Car size={14} />
                  {booking.carName || 'ไม่ระบุรถ'}
                </p>

                {/* Date */}
                <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                  <Clock size={12} />
                  {booking.pickupDate
                    ? formatRelativeTime(new Date(booking.pickupDate))
                    : 'ไม่ระบุวันที่'}
                </p>
              </div>
            </div>


            {/* Amount & Status */}
            <div className="text-right">
              <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                ฿{booking.amount?.toLocaleString() || '0'}
              </p>
              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}