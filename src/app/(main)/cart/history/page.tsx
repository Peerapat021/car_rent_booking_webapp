'use client'
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaCalendarAlt, FaCar } from "react-icons/fa";
import { BsClipboardCheck } from "react-icons/bs";
import Link from "next/link";
import CartTabs from "@/components/cart/CartTabs";
import { getBookings } from "@/lib/services/client/bookings/get";
import { getCars } from "@/lib/services/client/cars/get";
import { getBranches } from "@/lib/services/client/branches/get";

function HistoryPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function toDateOnly(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  useEffect(() => {
    async function load() {
      try {
        // เรียก 3 service functions พร้อมกัน
        const [bookingsData, carsData, branchesData] = await Promise.all([
          getBookings(),
          getCars(),
          getBranches(),
        ]);

        // รวมข้อมูลจาก 3 API
        const mapped: any[] = bookingsData.map((b: any) => {
          // หา car ที่ตรงกับ car_id
          const car = carsData.find((c: any) => c.car_id === b.car_id);

          // หา branch ที่ตรงกับ branch_id ของรถ
          const branch = branchesData.find((br: any) => br.branch_id === car?.branch_id);

          const start = b.booking_start_date
            ? new Date(b.booking_start_date).toLocaleString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
            : "—";

          const end = b.booking_end_date
            ? new Date(b.booking_end_date).toLocaleString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
            : "—";

          let duration = "ไม่ระบุ";

          if (b.booking_start_date && b.booking_end_date) {
            const start = toDateOnly(new Date(b.booking_start_date));
            const end = toDateOnly(new Date(b.booking_end_date));
            const diffDays =
              Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (diffDays > 0) duration = `${diffDays} วัน`;
          }

          return {
            id: b.booking_id,
            carName: `${car?.car_brand || ""} ${car?.car_model || ""}`.trim(),
            bookingNumber: `BKG${String(b.booking_id).padStart(5, "0")}`,
            startDate: start,
            endDate: end,
            duration,
            location: branch?.branch_name || "ไม่ระบุสาขา",
            status: b.booking_status,
            carImage: car?.car_image_cover || "/images/default-car.jpg"
          };
        });

        setBookings(mapped);
      } catch (err) {
        console.error("Load bookings failed", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ใช้สถานะจริงจาก API (รองรับทั้ง 8 สถานะ)
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending":
        return "รอยืนยันจากบริษัทให้เช่า";
      case "pending_balance":
        return "รอชำระเงิน";
      case "confirmed":
        return "ยืนยันการจองแล้ว";
      case "picked_up":
        return "รับรถแล้ว";
      case "returned":
        return "คืนรถแล้ว";
      case "completed":
        return "เสร็จสิ้น";
      case "cancelled":
        return "ยกเลิกการจอง";
      case "no_show":
        return "ไม่มารับรถ";
      default:
        return "สถานะไม่ทราบ";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      // สีส้ม - สถานะที่กำลังดำเนินการ
      case "pending":
      case "pending_balance":
      case "confirmed":
      case "picked_up":
      case "returned":
        return "bg-orange-500 text-white";

      // สีเขียว - เสร็จสิ้น
      case "completed":
        return "bg-green-500 text-white";

      // สีแดง - ยกเลิก/ไม่มา
      case "cancelled":
      case "no_show":
        return "bg-red-500 text-white";

      default:
        return "bg-gray-300 text-white";
    }
  };

  // แสดงเฉพาะรายการที่คืนรถแล้ว/เสร็จสิ้น/ยกเลิก/ไม่มารับ
  const visibleBookings = bookings.filter((b) =>
    ["returned", "completed", "cancelled", "no_show"].includes(b.status)
  );

  if (loading) {
    return <div className="text-center py-10">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <CartTabs activeTab="history" />

      <div className="mt-3 space-y-4 px-3 md:px-4 pb-6">
        {visibleBookings.map((booking) => (
          <Link href={`/cart/${booking.id}`} key={booking.id}>
            <div className="group w-full rounded-2xl bg-white border border-gray-200/80 overflow-hidden
              shadow-md hover:shadow-xl hover:-translate-y-0.5
              transition-all duration-300 ease-out mb-1">
              <div className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  {/* Car Image & Title */}
                  <div className="flex gap-4 md:contents">
                    <div className="relative w-35 h-20 md:w-56 md:h-34 lg:w-68 lg:h-40 shrink-0 rounded-xl bg-gray-50 overflow-hidden">
                      <Image
                        src={booking.carImage}
                        alt={booking.carName}
                        fill
                        className="rounded-xl object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Mobile Title */}
                    <div className="md:hidden flex flex-col justify-center">
                      <h2 className="text-lg font-bold text-gray-800">{booking.carName}</h2>
                      <span className="text-xs text-gray-400 font-mono mt-0.5">
                        {booking.bookingNumber}
                      </span>
                    </div>
                  </div>

                  {/* Right Content */}
                  <div className="w-full flex flex-col justify-between gap-3">
                    {/* Desktop Title */}
                    <div className="hidden md:block">
                      <h2 className="md:text-xl lg:text-2xl font-bold text-gray-800">{booking.carName}</h2>
                      <span className="text-sm text-gray-400 font-mono">
                        {booking.bookingNumber}
                      </span>
                    </div>

                    {/* Booking Details */}
                    <div className="flex flex-col gap-2.5 text-sm md:text-sm lg:text-base md:grid md:grid-cols-2 md:gap-y-2.5">
                      {/* Desktop Left */}
                      <div className="hidden md:flex md:flex-col md:gap-2.5">
                        <span className="flex items-center gap-2.5 text-gray-600">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <FaCalendarAlt className="text-blue-500 text-xs" />
                          </span>
                          <span className="whitespace-nowrap">
                            {booking.startDate} - {booking.endDate}
                          </span>
                        </span>

                        <span className="flex items-center gap-2.5 text-gray-600">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <FaCar className="text-blue-500 text-xs" />
                          </span>
                          {booking.location}
                        </span>

                        <span className="flex items-center gap-2.5 text-gray-600">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <BsClipboardCheck className="text-blue-500 text-xs" />
                          </span>
                          สถานะการจอง
                        </span>
                      </div>

                      {/* Desktop Right */}
                      <div className="hidden md:flex md:flex-col md:text-sm lg:text-base md:gap-2.5 md:items-end md:text-right">
                        <span className="text-gray-500 font-medium mt-1">{booking.duration}</span>
                        <span className="text-blue-600 font-medium mt-1">{booking.location}</span>
                        <span
                          className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm mt-1 ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>

                      {/* Mobile: Date */}
                      <div className="flex justify-between items-center md:hidden">
                        <span className="flex items-center gap-2 flex-1 overflow-hidden text-gray-600">
                          <span className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                            <FaCalendarAlt className="text-blue-500 text-[10px]" />
                          </span>
                          <span className="truncate">
                            {booking.startDate} - {booking.endDate}
                          </span>
                        </span>
                        <span className="ml-2 shrink-0 text-gray-500 font-medium">{booking.duration}</span>
                      </div>

                      {/* Mobile: Location */}
                      <div className="flex justify-between items-center md:hidden">
                        <span className="flex items-center gap-2 text-gray-600">
                          <span className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                            <FaCar className="text-blue-500 text-[10px]" />
                          </span>
                          {booking.location}
                        </span>
                        <span className="text-blue-600 font-medium">{booking.location}</span>
                      </div>

                      {/* Mobile: Status */}
                      <div className="flex justify-between items-center md:hidden">
                        <span className="flex items-center gap-2 text-gray-600">
                          <span className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                            <BsClipboardCheck className="text-blue-500 text-[10px]" />
                          </span>
                          สถานะการจอง
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {visibleBookings.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <BsClipboardCheck className="text-5xl mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">ยังไม่มีประวัติการจอง</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;