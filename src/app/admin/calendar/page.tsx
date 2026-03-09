// src/app/admin/calendar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Calendar as CalIcon, Car, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;          // วันรับรถ     YYYY-MM-DD
  dateEnd?: string;      // วันคืนรถ     YYYY-MM-DD
  time?: string;
  endTime?: string;
  allDay?: boolean;
  color: string;
  description?: string;
}

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [summary, setSummary] = useState<{
    totalBookings: number;
    bookedDays: number;
    freeDays: number;
    maxBookingDay: { date: string; count: number } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getDateStr = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getStartingEvents = (dateStr: string) =>
    events.filter((e) => e.date === dateStr);

  const getEndingEvents = (dateStr: string) =>
    events.filter((e) => e.dateEnd === dateStr && e.date !== dateStr);

  const getCoveringEvents = (dateStr: string) =>
    events.filter((e) => dateStr >= e.date && (!e.dateEnd || dateStr <= e.dateEnd));

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      let startY = year, startM = month, startD = 1 - 10;
      if (startD < 1) {
        startM--; if (startM < 0) { startM = 11; startY--; }
        startD += new Date(startY, startM + 1, 0).getDate();
      }

      let endY = year, endM = month, endD = daysInMonth + 10;
      while (endD > new Date(endY, endM + 1, 0).getDate()) {
        endD -= new Date(endY, endM + 1, 0).getDate();
        endM++; if (endM > 11) { endM = 0; endY++; }
      }

      const start = `${startY}-${String(startM + 1).padStart(2, "0")}-${String(startD).padStart(2, "0")}`;
      const end = `${endY}-${String(endM + 1).padStart(2, "0")}-${String(endD).padStart(2, "0")}`;

      try {
        const res = await fetch(`/api/admin/booking_overview/calendar?start=${start}&end=${end}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!data.success) throw new Error(data.error || "API error");

        const fetched = data.events || [];
        setEvents(fetched);

        // คำนวณสรุปเดือนนี้
        const dateCounts: Record<string, number> = {};

        fetched.forEach((e: Event) => {
          const s = new Date(e.date);
          const eEnd = e.dateEnd ? new Date(e.dateEnd) : s;
          let cur = new Date(s);
          while (cur <= eEnd) {
            const ds = cur.toISOString().split("T")[0];
            const [y, m] = ds.split("-").map(Number);
            if (y === year && m === month + 1) {
              dateCounts[ds] = (dateCounts[ds] || 0) + 1;
            }
            cur.setDate(cur.getDate() + 1);
          }
        });

        const bookedDays = Object.keys(dateCounts).length;
        let maxCount = 0; let maxDate = "";
        Object.entries(dateCounts).forEach(([d, c]) => {
          if (c > maxCount) { maxCount = c; maxDate = d; }
        });

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        const totalBookings = fetched.filter((e: Event) => {
          const s = new Date(e.date);
          const eEnd = e.dateEnd ? new Date(e.dateEnd) : s;
          return eEnd >= monthStart && s <= monthEnd;
        }).length;

        setSummary({
          totalBookings,
          bookedDays,
          freeDays: daysInMonth - bookedDays,
          maxBookingDay: maxCount > 0 ? { date: maxDate, count: maxCount } : null,
        });
      } catch (err: any) {
        setError(err.message || "โหลดข้อมูลล้มเหลว");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [year, month]);

  const cells = [];

  // วันก่อนหน้าเดือนนี้
  for (let i = firstDay; i > 0; i--) {
    cells.push(
      <div
        key={`prev-${i}`}
        className="text-gray-400 text-sm text-right pr-2 bg-gray-50/30 rounded-xl min-h-[80px] sm:min-h-[100px] flex items-start justify-end pt-2"
      >
        {daysInPrev - i + 1}
      </div>
    );
  }

  // วันในเดือนนี้ - แสดงทั้งรับรถและคืนรถ
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = getDateStr(year, month, d);
    const startingEvents = getStartingEvents(dateStr); // รับรถ
    const endingEvents = getEndingEvents(dateStr);     // คืนรถ

    const displayEvents = [...startingEvents, ...endingEvents];

    cells.push(
      <div
        key={d}
        onClick={() => setSelectedDate(dateStr)}
        className={`
          min-h-[80px] sm:min-h-[100px] p-2 border border-gray-200 rounded-xl cursor-pointer transition-all
          hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm
          ${isToday(d) ? "bg-gray-900 text-white shadow-md ring-1 ring-gray-800/40" : "bg-white"}
          ${selectedDate === dateStr ? "ring-2 ring-gray-900 bg-gray-50 border-gray-400 shadow-md" : ""}
        `}
      >
        <div className={`font-bold text-base sm:text-lg ${isToday(d) ? "text-white" : "text-gray-900"}`}>
          {d}
        </div>

        <div className="mt-2 space-y-1 text-xs max-h-[3.8rem] sm:max-h-20 overflow-hidden">
          {/* รับรถ (สีเขียว/ตาม color) */}
          {startingEvents.slice(0, 2).map((e) => (
            <div
              key={`start-${e.id}`}
              className={`px-2 py-1 rounded text-white text-xs truncate shadow-sm ${e.color || "bg-emerald-600"}`}
            >
              ↑ {e.allDay ? "ทั้งวัน" : (e.time ? e.time.slice(0, 5) : "")} {e.title}
            </div>
          ))}

          {/* คืนรถ (สีส้มชัดเจน) */}
          {endingEvents.slice(0, 2 - (startingEvents.length > 0 ? 1 : 0)).map((e) => (
            <div
              key={`end-${e.id}`}
              className="px-2 py-1 rounded text-white text-xs truncate shadow-sm bg-amber-600"
            >
              ↓ {e.endTime ? e.endTime.slice(0, 5) : "คืน"} {e.title}
            </div>
          ))}

          {/* ถ้ามีมากเกิน */}
          {displayEvents.length > 3 && (
            <div className="text-xs text-gray-500 pl-1">
              +{displayEvents.length - 3} การจอง
            </div>
          )}
        </div>
      </div>
    );
  }

  // วันถัดไป
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push(
      <div
        key={`next-${i}`}
        className="text-gray-400 text-sm pl-2 bg-gray-50/30 rounded-xl min-h-[80px] sm:min-h-[100px] flex items-start justify-start pt-2"
      >
        {i}
      </div>
    );
  }

  const selectedDateStr = selectedDate;
  const covering = selectedDateStr ? getCoveringEvents(selectedDateStr) : [];

  const receivingToday = covering.filter(e => e.date === selectedDateStr);
  const returningToday = covering.filter(e => e.dateEnd === selectedDateStr && e.date !== selectedDateStr);
  const ongoing = selectedDateStr ? covering.filter(e => e.date < selectedDateStr && (!e.dateEnd || e.dateEnd > selectedDateStr)) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">ปฏิทินการจองรถ</h1>
            <p className="text-sm text-gray-500 mt-1">ภาพรวมการรับ-คืนรถและการจองทั้งเดือน</p>
          </div>
          <button
            onClick={() => setCurrent(new Date())}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm whitespace-nowrap"
          >
            <CalIcon size={16} />
            วันนี้
          </button>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrent(new Date(year, month - 1, 1))}
              className="p-3 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>

            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {monthNames[month]} {year + 543}
            </h2>

            <button
              onClick={() => setCurrent(new Date(year, month + 1, 1))}
              className="p-3 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {!loading && !error && summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">การจองเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBookings}</p>
              <div className="mt-2 flex items-center gap-2 text-blue-700 text-sm">
                <Car size={16} />
                <span>รายการ</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">วันที่ถูกจอง</p>
              <p className="text-2xl font-bold text-gray-900">{summary.bookedDays}</p>
              <div className="mt-2 flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle size={16} />
                <span>วัน</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">วันที่ว่าง</p>
              <p className="text-2xl font-bold text-gray-900">{summary.freeDays}</p>
              <div className="mt-2 flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle size={16} />
                <span>วัน</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">วันจองสูงสุด</p>
              <p className="text-xl font-bold text-gray-900 truncate">
                {summary.maxBookingDay
                  ? `${new Date(summary.maxBookingDay.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} (${summary.maxBookingDay.count})`
                  : "–"}
              </p>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Weekdays */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
              <div
                key={d}
                className={`text-center py-3 text-sm font-medium ${i === 0 || i === 6 ? "text-red-600" : "text-gray-700"}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          {loading ? (
            <div className="p-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4" />
              <p className="text-gray-600">กำลังโหลดปฏิทิน...</p>
            </div>
          ) : error ? (
            <div className="p-20 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-sm"
              >
                ลองใหม่
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-3 sm:p-4 lg:p-5 bg-white">
              {cells}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {selectedDate && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedDate(null)} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md lg:max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-5 lg:p-6 flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {new Date(selectedDate).toLocaleDateString("th-TH", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-5 lg:p-6 space-y-8">
                {receivingToday.length + returningToday.length + ongoing.length === 0 ? (
                  <div className="text-center py-24 lg:py-40 text-gray-400">
                    <CalIcon className="w-20 h-20 mx-auto mb-6 opacity-40" />
                    <p className="text-2xl font-medium text-gray-600">ไม่มีกำหนดการในวันนี้</p>
                    <p className="mt-3 text-gray-500">รถทุกคันว่างทั้งวัน</p>
                  </div>
                ) : (
                  <>
                    {/* รับรถวันนี้ */}
                    {receivingToday.length > 0 && (
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Car className="w-6 h-6 text-emerald-700" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">รับรถวันนี้</h3>
                        </div>
                        <div className="space-y-4">
                          {receivingToday.map(e => (
                            <div
                              key={e.id}
                              className="p-4 lg:p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-sm"
                            >
                              <h4 className="font-bold text-lg text-gray-900 mb-2">{e.title}</h4>
                              <div className="flex items-center gap-2 text-gray-800 text-sm">
                                <span className="font-medium">เวลา:</span>
                                <span>{e.time ? e.time.slice(0, 5) : "–"}</span>
                                {e.endTime && <span>– {e.endTime.slice(0, 5)}</span>}
                              </div>
                              {e.description && <p className="text-sm text-gray-700 mt-2">{e.description}</p>}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* คืนรถวันนี้ */}
                    {returningToday.length > 0 && (
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-amber-100 p-2 rounded-lg">
                            <Car className="w-6 h-6 text-amber-700" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">คืนรถวันนี้</h3>
                        </div>
                        <div className="space-y-4">
                          {returningToday.map(e => (
                            <div
                              key={e.id}
                              className="p-4 lg:p-5 bg-amber-50/60 border border-amber-200 rounded-xl shadow-sm"
                            >
                              <h4 className="font-bold text-lg text-gray-900 mb-2">{e.title}</h4>
                              <div className="flex items-center gap-2 text-gray-800 text-sm">
                                <span className="font-medium">เวลา:</span>
                                <span>{e.endTime ? e.endTime.slice(0, 5) : "–"}</span>
                              </div>
                              <div className="text-sm text-gray-700 mt-1">
                                เริ่มจอง: {new Date(e.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                              </div>
                              {e.description && <p className="text-sm text-gray-700 mt-2">{e.description}</p>}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* กำลังเช่าอยู่ */}
                    {ongoing.length > 0 && (
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <Clock className="w-6 h-6 text-gray-700" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">กำลังเช่าอยู่</h3>
                        </div>
                        <div className="space-y-4">
                          {ongoing.map(e => (
                            <div
                              key={e.id}
                              className="p-4 lg:p-5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm"
                            >
                              <h4 className="font-bold text-lg text-gray-900 mb-2">{e.title}</h4>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">ช่วงเช่า:</span>{" "}
                                {new Date(e.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}{" "}
                                →{" "}
                                {e.dateEnd
                                  ? new Date(e.dateEnd).toLocaleDateString("th-TH", { day: "numeric", month: "short" })
                                  : "ยังไม่กำหนดคืน"}
                              </div>
                              {e.description && <p className="text-sm text-gray-700 mt-2">{e.description}</p>}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}