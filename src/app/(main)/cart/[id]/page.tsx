"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { BsClipboardCheck } from "react-icons/bs";
import { FaCar, FaCog, FaUser } from "react-icons/fa";
import { getBookingById } from "@/lib/services/client/bookings/get";
import { getCars } from "@/lib/services/client/cars/get";
import { getBranches } from "@/lib/services/client/branches/get";
import { cancelBooking } from "@/lib/services/client/bookings/delete";
import { getPaymentsByBookingId } from "@/lib/services/client/payments/get";
import Goback from "@/components/goback";
/* ================== TYPES ================== */

type StatusType = {
  id: number;
  label: string;
  type: "success" | "pending" | "inProgress" | "failed";
};

type BookingDetail = {
  booking_id: number;
  booking_start_date: string;
  booking_end_date: string;
  booking_status: string;

  contact_name: string;
  contact_email: string;
  contact_phone: string;

  booking_total_price: string | number;
  deposit_amount: string | number;

  car_brand: string;
  car_model: string;
  car_image_cover?: string | null;

  payment_method?: string; // เช่น 'cash', 'transfer', 'credit_card', 'promptpay'

  branch_name: string;

  seats?: number; // จำนวนที่นั่ง (เช่น 4, 5, 7)
};

/* ================== HELPERS ================== */

// สีสถานะให้ตรงกับหน้า cart/history
const getStatusClass = (type: StatusType["type"]) => {
  switch (type) {
    case "success": return "bg-green-500";      // completed
    case "pending": return "bg-gray-400";       // รอดำเนินการ
    case "inProgress": return "bg-orange-500";  // กำลังดำเนินการ
    case "failed": return "bg-red-500";         // cancelled, no_show
    default: return "bg-gray-200";
  }
};

// แปลงสถานะเป็นภาษาไทย (รองรับทั้ง 8 สถานะ)
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: "รอยืนยัน",
    pending_balance: "รอชำระเงินค่ามัดจำ",
    confirmed: "ยืนยันการจองแล้ว",
    picked_up: "รับรถแล้ว",
    returned: "คืนรถแล้ว",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิกการจอง",
    no_show: "ไม่มารับรถ",
  };
  return map[status?.toLowerCase()] || status;
};

// แปลงสถานะ API เป็น type สำหรับกำหนดสี
const mapApiStatusToType = (apiStatus: string): StatusType["type"] => {
  const lower = apiStatus?.toLowerCase() || "";

  // สีเขียว - เสร็จสิ้น
  if (lower === "completed") return "success";

  // สีส้ม - กำลังดำเนินการ
  if (["pending", "pending_balance", "confirmed", "picked_up", "returned"].includes(lower)) {
    return "inProgress";
  }

  // สีแดง - ยกเลิก/ไม่มา
  if (["cancelled", "no_show"].includes(lower)) return "failed";

  return "pending";
};

/* ================== PAGE ================== */

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = typeof params?.id === "string" ? params.id : null;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // เรียก 4 APIs พร้อมกัน
        const [bookingData, carsData, branchesData, paymentsList] = await Promise.all([
          getBookingById(Number(id)),
          getCars(),
          getBranches(),
          getPaymentsByBookingId(Number(id)),
        ]);

        setPaymentsData(paymentsList);

        // หา car และ branch ที่ตรงกับ booking
        const car = carsData.find((c: any) => c.car_id === bookingData.car_id);
        const branch = branchesData.find((b: any) => b.branch_id === car?.branch_id);

        // รวมข้อมูล
        const enrichedBooking: BookingDetail = {
          ...bookingData,
          car_brand: car?.car_brand || "",
          car_model: car?.car_model || "",
          car_image_cover: car?.car_image_cover || null,
          branch_name: branch?.branch_name || "ไม่ระบุสาขา",
          seats: car?.seat_count || 4,
        };

        setBooking(enrichedBooking);
      } catch (err) {
        console.error("Load booking failed", err);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [id]);

  const handleCancel = async () => {
    if (!booking) return;

    const ok = confirm("คุณต้องการยกเลิกการจองนี้หรือไม่?");
    if (!ok) return;

    try {
      setCanceling(true);
      await cancelBooking(booking.booking_id);

      // อัปเดตสถานะใน state ทันที (เพื่อให้ UI เปลี่ยนสีและข้อความโดยไม่ต้อง reload)
      setBooking((prev) =>
        prev
          ? {
            ...prev,
            booking_status: "cancelled", // เปลี่ยนสถานะเป็น cancelled
          }
          : null
      );

      // ถ้าต้องการ refresh จาก server จริง ๆ สามารถเพิ่มบรรทัดนี้ได้
      // await router.refresh();
    } catch (err) {
      alert("ไม่สามารถยกเลิกการจองได้");
      console.error(err);
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-10 text-lg">กำลังโหลดข้อมูล...</p>;
  }

  if (!booking) {
    return <p className="text-center mt-10 text-red-500">ไม่พบข้อมูลการจอง</p>;
  }

  // แปลงข้อมูลวันที่
  const startDate = new Date(booking.booking_start_date).toLocaleString(
    "th-TH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

  const endDate = new Date(booking.booking_end_date).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const durationDays = Math.ceil(
    (new Date(booking.booking_end_date).getTime() -
      new Date(booking.booking_start_date).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  // อนุญาตให้ยกเลิกได้เฉพาะสถานะที่ยังไม่ได้รับรถ
  const isCancellable = ["pending", "pending_balance", "confirmed"].includes(
    booking.booking_status?.toLowerCase() || ""
  );

  // สร้าง timeline ตามสถานะจริง (data-driven)
  const getStatusTimeline = (): StatusType[] => {
    const currentStatus = booking.booking_status?.toLowerCase() || "pending";

    // กรณียกเลิก
    if (currentStatus === "cancelled") {
      return [
        { id: 1, label: "ทำการจอง", type: "success" },
        { id: 2, label: "ชำระเงินค่ามัดจำ", type: "success" },
        { id: 3, label: "ยกเลิกการจอง", type: "failed" },
      ];
    }

    // กรณีไม่มารับรถ
    if (currentStatus === "no_show") {
      return [
        { id: 1, label: "ทำการจอง", type: "success" },
        { id: 2, label: "ชำระเงินค่ามัดจำ", type: "success" },
        { id: 3, label: "ยืนยันการจอง", type: "success" },
        { id: 4, label: "ไม่มารับรถ", type: "failed" },
      ];
    }

    // กรณีปกติ — ใช้ลำดับสถานะกำหนด type อัตโนมัติ
    const STATUS_FLOW = ["pending", "pending_balance", "confirmed", "picked_up", "returned", "completed"];
    const STEP_LABELS = ["ทำการจอง", "ชำระเงินค่ามัดจำ", "ยืนยันการจอง", "รับรถ", "คืนรถ", "เสร็จสิ้น"];

    const currentIndex = STATUS_FLOW.indexOf(currentStatus);

    return STEP_LABELS.map((label, i): StatusType => ({
      id: i + 1,
      label,
      type: i < currentIndex ? "success"       // ขั้นตอนก่อนหน้า = สำเร็จ
        : i === currentIndex ? "inProgress"   // ขั้นตอนปัจจุบัน = กำลังดำเนินการ
          : "pending",                          // ขั้นตอนถัดไป = รอ
    }));
  };


  const statusTimeline = getStatusTimeline();

  // ไม่ต้อง filter เพิ่มเมื่อยกเลิก (เพื่อให้แสดงสั้น ๆ ตามที่กำหนด)
  const filteredStatus = statusTimeline; // ใช้ตรง ๆ ไม่ต้อง filter อีก
  return (
    <div>
      <Goback title="การจองของฉัน" />
      <div className="min-h-screen bg-gray-50 overflow-x-hidden md:min-h-[auto] md:bg-transparent md:overflow-visible md:pb-10">
        <div className="max-w-7xl mx-auto md:max-w-full">
          <div className="mb-3 bg-white rounded-xl shadow-sm border md:shadow-sm p-4 md:p-6 md:mb-6 md:border md:rounded-xl flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <p
              className={`text-xl lg:text-3xl font-bold text-center ${booking.booking_status?.toLowerCase() === "completed"
                ? "text-green-500"
                : ["cancelled", "no_show"].includes(booking.booking_status?.toLowerCase() || "")
                  ? "text-red-500"
                  : "text-blue-500"
                }`}
            >
              หมายเลขการจอง : {booking.booking_id}
            </p>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-[2fr_1fr] gap-3 md:gap-6 px-1 py-3 md:p-4">
            {/* LEFT COLUMN */}
            <div className="space-y-3 md:space-y-6">
              {/* Car Info */}
              <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <div className="relative w-full h-48 md:w-60 md:h-40 shrink-0">
                    <Image
                      src={booking.car_image_cover || "/images/default-car.jpg"}
                      alt={`${booking.car_brand} ${booking.car_model}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">
                      {booking.car_brand} {booking.car_model}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FaCar className="text-blue-500" /> ออโต้
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCog className="text-blue-500" /> เบนซิน
                      </span>
                      <span className="flex items-center gap-1">
                        <FaUser className="text-blue-500" /> {booking.seats}{" "}
                        ที่นั่ง
                      </span>
                    </div>
                    <div className="text-xs md:text-base mt-2">
                      {booking.branch_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                  <BsClipboardCheck className="text-blue-500" />
                  รายละเอียดการจอง
                </h3>

                <div className="space-y-3 md:space-y-4">
                  <DetailRow
                    label="วันที่เริ่ม - สิ้นสุด"
                    value={`${startDate} - ${endDate}`}
                  />
                  <DetailRow label="ระยะเวลา" value={`${durationDays} วัน`} />
                  <DetailRow label="สาขา" value={booking.branch_name} />
                  <DetailRow label="ชื่อผู้จอง" value={booking.contact_name} />
                  <DetailRow label="อีเมล" value={booking.contact_email} />
                  <DetailRow label="เบอร์โทร" value={booking.contact_phone} />
                  <DetailRow
                    label="ยอดรวมสุทธิ"
                    value={`฿${Number(
                      booking.booking_total_price
                    ).toLocaleString()}`}
                  />

                  {booking.deposit_amount &&
                    Number(booking.deposit_amount) > 0 && (
                      <div className="bg-blue-50 rounded-xl p-4 mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">ค่ามัดจำ</h4>
                          <h4 className="font-semibold text-xl text-blue-500">
                            ฿{Number(booking.deposit_amount).toLocaleString()}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          ชำระ ณ วันที่รับรถ และคืนเมื่อสิ้นสุดการเช่า
                          (หากไม่มีค่าเสียหาย)
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3 md:space-y-6">
              {/* ยอดที่ต้องชำระ (แทน payment method ชั่วคราว) */}
              <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">การชำระเงิน</h3>

                {paymentsData.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-4">
                    ยังไม่มีรายการชำระเงิน
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentsData.map((p: any) => (
                      <div key={p.payment_id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">
                            {{
                              deposit: 'ค่ามัดจำ',
                              full: 'ชำระเต็มจำนวน',
                              insurance: 'ค่าประกัน',
                              remaining: 'ชำระส่วนที่เหลือ',
                              extra: 'ค่าใช้จ่ายเพิ่มเติม',
                              refund: 'คืนเงิน',
                            }[p.payment_type as string] || p.payment_type}
                          </span>
                          <span className="font-semibold text-blue-500">
                            ฿{Number(p.payment_amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>
                            {{
                              cash: 'เงินสด',
                              qr: 'QR Code',
                              credit_card: 'บัตรเครดิต',
                            }[p.payment_method as string] || p.payment_method}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-white text-xs ${p.payment_status === 'paid' ? 'bg-green-500' :
                            p.payment_status === 'refunded' ? 'bg-orange-500' : 'bg-gray-400'
                            }`}>
                            {{
                              paid: 'ชำระแล้ว',
                              pending: 'รอชำระ',
                              refunded: 'คืนเงินแล้ว',
                            }[p.payment_status as string] || p.payment_status}
                          </span>
                        </div>
                        {p.paid_at && (
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(p.paid_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6 md:sticky md:top-4">
                <h3 className="text-lg md:text-xl font-bold mb-6">
                  สถานะการจอง
                </h3>
                <div className="relative">
                  {filteredStatus.map((status, index) => (
                    <div
                      key={status.id}
                      className="relative flex items-start gap-3 pb-10 last:pb-0"
                    >
                      {index < filteredStatus.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-full -translate-x-1/2 bg-gray-300"></div>
                      )}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getStatusClass(
                          status.type
                        )}`}
                      >
                        {status.type === "success" && (
                          <span className="text-white text-sm">✓</span>
                        )}
                        {status.type === "failed" && (
                          <span className="text-white text-sm">✕</span>
                        )}
                        {status.type === "pending" && (
                          <span className="text-white text-sm">...</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p
                          className={`font-semibold ${status.type === "failed"
                            ? "text-red-600"
                            : status.type === "success"
                              ? "text-green-600"
                              : ""
                            }`}
                        >
                          {status.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {isCancellable && (
                  <button
                    onClick={handleCancel}
                    disabled={canceling}
                    className="w-full mt-8 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    {canceling ? "กำลังยกเลิก..." : "ยกเลิกการจอง"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 md:py-3 border-b last:border-b-0">
      <span className="text-sm md:text-base text-gray-600">{label}</span>
      <span className="text-sm md:text-base font-semibold text-blue-500">
        {value}
      </span>
    </div>
  );
}
