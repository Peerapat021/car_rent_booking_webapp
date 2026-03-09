'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaArrowLeft,
  FaSave,
  FaInfoCircle,
  FaCarSide,
  FaUndoAlt,
  FaMoneyBillWave,
  FaCar,
  FaExclamationTriangle,
  FaStickyNote,
  FaWallet,
  FaBan,
  FaClock,
  FaHandPaper,
} from 'react-icons/fa';

import { getBookingOverviewById } from '@/lib/services/client/admin/booking_overview/get';
import { updateBooking } from '@/lib/services/client/admin/booking_overview/put';
import { postPayment } from '@/lib/services/client/admin/payments/post';

import { cancelBooking } from '@/lib/services/client/admin/booking_overview/cancel';
import { markNoShow } from '@/lib/services/client/admin/booking_overview/no-show';
import { pickupBooking } from '@/lib/services/client/admin/booking_overview/pickup';
import { returnBooking } from '@/lib/services/client/admin/booking_overview/return';
import { Loader2 } from 'lucide-react';
import { fetchSystemSettings } from '@/lib/services/client/admin/system_settings/get';
import { systemSettings } from '@/lib/db/schema';

interface Payment {
  payment_id: number;
  booking_id: number;
  user_id?: number | null;
  payment_amount: number;
  payment_method: 'cash' | 'qr' | 'credit_card';
  payment_type: 'deposit' | 'full' | 'insurance' | 'remaining' | 'extra' | 'refund';
  payment_status: 'paid' | 'pending' | 'refunded';
  paid_at: string | null;
  payment_note: string;
  payment_created_by?: number | null;
  create_at_payment: string;
}

interface Booking {
  booking_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  car_brand: string;
  car_model: string;
  car_license_plate: string;
  booking_start_date: string;
  booking_end_date: string;
  pickup_datetime: string | null;
  expected_return_datetime: string | null;
  actual_return_datetime: string | null;
  deposit_amount: number;
  insurance_amount: number;
  late_fee: number;
  cancellation_fee_amount: number;
  no_show_fee_amount: number;
  damage_fee: number;
  insurance_deducted: number;
  insurance_refund_amount: number;
  rental_amount: number;
  total_discount: number;
  booking_total_price: number;
  total_paid: number;
  remaining_amount: number;
  paid_insurance_total: number;
  payment_methods: string[];
  booking_status: string;
  internal_note?: string;
  special_request?: string;

  contact_name: string;
  contact_email: string;
  contact_phone: string;

  force_pickup_notification: boolean;

  payments?: Payment[];
}

type Tab = 'general' | 'pickup' | 'return' | 'payment' | 'penalties' | 'actions';

function formatThaiDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return dateStr || '—';
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    pending_balance: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    returned: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'รอยืนยัน',
    pending_balance: 'รอชำระส่วนที่เหลือ',
    confirmed: 'ยืนยันแล้ว',
    picked_up: 'รับรถแล้ว',
    returned: 'คืนรถแล้ว',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
    no_show: 'ไม่มารับ',
  };
  return labels[status] || status;
}

export default function BookingDetailPage() {
  const { booking_id } = useParams<{ booking_id: string }>();
  const router = useRouter();
  const id = Number(booking_id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState<Partial<Booking>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | 'credit_card'>('cash');
  const [payInsurance, setPayInsurance] = useState(true);
  const [payRemainingRental, setPayRemainingRental] = useState(true);

  const [returnLateDays, setReturnLateDays] = useState<number>(0);
  const [calculatedLateFee, setCalculatedLateFee] = useState<number>(0);

  // โหลด system settings แยก (เพื่อใช้ late_fee_per_hour)
  const [settings, setSettings] = useState<typeof systemSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSystemSettings();
        setSettings(data);
      } catch (err) {
        console.error('โหลด system settings ไม่สำเร็จ', err);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (isNaN(id) || id <= 0) {
      setError('เลขที่การจองไม่ถูกต้อง');
      setLoading(false);
      return;
    }

    async function loadBooking() {
      try {
        const data = await getBookingOverviewById(id);
        const safeBooking = {
          ...data,
          payments: data.payments ?? [],
        };
        setBooking(safeBooking);
        setFormData(safeBooking);
      } catch (err: any) {
        setError(err.message || 'ไม่สามารถโหลดข้อมูลการจองได้');
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [id]);

  // คำนวณ late fee อัตโนมัติเมื่อ actual_return_datetime เปลี่ยน
  useEffect(() => {
    if (!booking || !formData.actual_return_datetime) {
      setCalculatedLateFee(0);
      setReturnLateDays(0);
      return;
    }

    const actualStr = formData.actual_return_datetime;
    const expectedStr = booking.booking_end_date;

    if (!actualStr || !expectedStr) {
      setCalculatedLateFee(0);
      setReturnLateDays(0);
      return;
    }

    const actual = new Date(actualStr);
    let expected = new Date(expectedStr);

    // ถ้า expected เป็นแค่วันที่ (YYYY-MM-DD) → ตั้งเวลาเป็น 23:59:59 ของวันนั้น
    if (expectedStr.length <= 10) {
      expected.setHours(23, 59, 59, 999);
    }

    if (actual <= expected) {
      setCalculatedLateFee(0);
      setReturnLateDays(0);
      return;
    }

    const diffMs = actual.getTime() - expected.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Grace period 2 ชั่วโมง (ปรับได้ตามนโยบายบริษัท)
    const graceHours = 2;
    const billableHours = Math.max(0, Math.ceil(diffHours - graceHours));

    // อัตราปรับต่อชั่วโมง จาก settings หรือ fallback 300 บาท
    const ratePerHour = Number(settings?.late_fee_per_hour ?? 300);

    const lateFee = billableHours * ratePerHour;

    setCalculatedLateFee(lateFee);
    setReturnLateDays(Math.ceil(billableHours / 24));
  }, [formData.actual_return_datetime, booking?.booking_end_date, settings]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  const handleSave = async () => {
    if (!booking) return;
    if (!confirm('ยืนยันการบันทึกการเปลี่ยนแปลงทั้งหมด?')) return;

    setSaving(true);
    try {
      await updateBooking({ booking_id: booking.booking_id, ...formData });
      const refreshed = await getBookingOverviewById(id);
      setBooking({ ...refreshed, payments: refreshed.payments ?? [] });
      setFormData({ ...refreshed });
      alert('บันทึกสำเร็จ');
    } catch (err: any) {
      alert('บันทึกไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPickup = async () => {
    if (!booking || !formData.pickup_datetime) {
      alert('กรุณาระบุวันเวลาที่รับรถจริงก่อน');
      return;
    }

    if (!confirm(`ยืนยันรับรถเมื่อ ${formatThaiDateTime(formData.pickup_datetime)} ?`)) return;

    setSaving(true);

    try {
      await pickupBooking(booking.booking_id, {
        pickup_datetime: formData.pickup_datetime,
      });

      const refreshed = await getBookingOverviewById(id);
      setBooking({ ...refreshed, payments: refreshed.payments ?? [] });
      setFormData({ ...refreshed });

      alert('บันทึกเวลารับรถและเปลี่ยนสถานะเป็น "รับรถแล้ว" เรียบร้อย');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่ทราบสาเหตุ'));
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPickupPayment = async () => {
    if (!booking) return;

    const now = new Date().toISOString();

    const paidInsuranceTotal = Number(booking.paid_insurance_total || 0);
    const remainingInsurance = Math.max(0, Number(booking.insurance_amount || 0) - paidInsuranceTotal);
    const remainingRental = Math.max(0, Number(booking.remaining_amount || 0));

    const insuranceThisTime = payInsurance && remainingInsurance > 0 ? remainingInsurance : 0;
    const rentalThisTime = payRemainingRental && remainingRental > 0 ? remainingRental : 0;
    const totalThisTime = insuranceThisTime + rentalThisTime;

    if (totalThisTime <= 0) {
      alert('ไม่มีรายการที่ต้องชำระในครั้งนี้');
      return;
    }

    const methodLabel =
      paymentMethod === 'cash' ? 'เงินสด' :
        paymentMethod === 'qr' ? 'QR Code / PromptPay' :
          'บัตรเครดิต';

    if (!confirm(`ยืนยันชำระ ${totalThisTime.toLocaleString()} บาท ด้วยวิธี ${methodLabel}`)) return;

    setSaving(true);

    try {
      if (insuranceThisTime > 0) {
        await postPayment({
          booking_id: booking.booking_id,
          payment_amount: insuranceThisTime,
          payment_method: paymentMethod,
          payment_type: 'insurance',
          payment_status: 'paid',
          paid_at: now,
          payment_note: 'ชำระประกันหน้ารับรถ',
        });
      }

      if (rentalThisTime > 0) {
        await postPayment({
          booking_id: booking.booking_id,
          payment_amount: rentalThisTime,
          payment_method: paymentMethod,
          payment_type: 'remaining',
          payment_status: 'paid',
          paid_at: now,
          payment_note: 'ชำระค่าเช่าคงเหลือหน้ารับรถ',
        });
      }

      await pickupBooking(booking.booking_id);

      const refreshed = await getBookingOverviewById(id);
      setBooking({ ...refreshed, payments: refreshed.payments ?? [] });
      setFormData({ ...refreshed });

      alert('บันทึกการชำระและรับรถเรียบร้อยแล้ว\nสถานะถูกอัปเดตเป็น "รับรถแล้ว"');
      setPayInsurance(true);
      setPayRemainingRental(true);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่ทราบสาเหตุ'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRecordReturn = async () => {
    if (!booking) return;
    if (!formData.actual_return_datetime) {
      alert('กรุณาระบุวันเวลาคืนรถจริง');
      return;
    }

    if (!confirm('ยืนยันบันทึกการคืนรถ ?')) return;

    setSaving(true);

    try {
      await returnBooking(booking.booking_id, {
        actual_return_datetime: formData.actual_return_datetime,
        expected_return_datetime: booking.booking_end_date || booking.expected_return_datetime || formData.booking_end_date,  // ← เพิ่มบรรทัดนี้
        late_fee: calculatedLateFee || booking.late_fee || 0,
        damage_fee: Number(formData.damage_fee || booking.damage_fee || 0),
        insurance_deducted: Number(formData.insurance_deducted || booking.insurance_deducted || 0),
        insurance_refund_amount: Number(formData.insurance_refund_amount || booking.insurance_refund_amount || 0),
      });

      const refreshed = await getBookingOverviewById(id);
      setBooking({ ...refreshed, payments: refreshed.payments ?? [] });
      setFormData({ ...refreshed });

      alert('บันทึกการคืนรถสำเร็จ');
    } catch (err: any) {
      alert('บันทึกการคืนรถล้มเหลว: ' + (err.message || 'ไม่ทราบสาเหตุ'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!confirm('ยืนยันยกเลิกการจอง ?\nจะมีการคิดค่าปรับยกเลิก')) return;

    setSaving(true);
    try {
      await cancelBooking(booking.booking_id);
      const refreshed = await getBookingOverviewById(id);
      setBooking({ ...refreshed, payments: refreshed.payments ?? [] });
      setFormData({ ...refreshed });
      alert('ยกเลิกการจองสำเร็จ');
    } catch (err: any) {
      alert('ยกเลิกไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkNoShow = async () => {
    if (!booking) return;
    if (!confirm('ยืนยันว่าลูกค้าไม่มารับ ?\nจะคิดค่าปรับ No Show')) return;

    setSaving(true);
    try {
      await markNoShow(booking.booking_id);
      const refreshed = await getBookingOverviewById(id);
      setBooking({ ...refreshed, payments: refreshed.payments ?? [] });
      setFormData({ ...refreshed });
      alert('ทำเครื่องหมาย "ไม่มารับ" สำเร็จ');
    } catch (err: any) {
      alert('ดำเนินการไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">กำลังโหลดการจอง #{id}...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6">{error || 'ไม่พบข้อมูลการจองนี้'}</p>
          <button
            onClick={() => router.push('/admin/booking-overview')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            กลับไปหน้ารายการ
          </button>
        </div>
      </div>
    );
  }

  const paidInsuranceTotal = Number(booking.paid_insurance_total || 0);
  const remainingInsurance = Math.max(0, Number(booking.insurance_amount || 0) - paidInsuranceTotal);
  const remainingRental = Math.max(0, Number(booking.remaining_amount || 0));

  const displayRemaining = Math.max(0, Number(booking.remaining_amount || 0));

  const hasPaidInsurance = remainingInsurance <= 0;
  const hasPaidRental = remainingRental <= 0;

  const nothingSelected = !payInsurance && !payRemainingRental;

  const canCancelOrNoShow = ['pending', 'pending_balance', 'confirmed'].includes(booking.booking_status) && !booking.pickup_datetime;

  return (
    <div className="min-h-screen bg-gray-50/60 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <FaCar size={24} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    การจอง #{booking.booking_id}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <p className="text-gray-700 font-medium">{booking.customer_name}</p>
                    <span className="text-gray-500">•</span>
                    <p className="text-gray-600">
                      {booking.car_brand} {booking.car_model} ({booking.car_license_plate})
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        booking.booking_status
                      )}`}
                    >
                      {getStatusLabel(booking.booking_status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                >
                  <FaArrowLeft className="mr-2" size={14} />
                  กลับ
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`inline-flex items-center px-6 py-2 rounded-lg text-white text-sm font-medium transition shadow-sm ${saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  <FaSave className="mr-2" size={14} />
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200 bg-gray-50 px-1.5 overflow-x-auto">
            {[
              { id: 'general', label: 'ข้อมูลหลัก', icon: FaInfoCircle },
              { id: 'pickup', label: 'รับรถ', icon: FaCarSide },
              { id: 'return', label: 'คืนรถ', icon: FaUndoAlt },
              { id: 'payment', label: 'การเงิน', icon: FaWallet },
              { id: 'penalties', label: 'ค่าปรับทั้งหมด', icon: FaHandPaper },
              { id: 'actions', label: 'การดำเนินการ', icon: FaExclamationTriangle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-white shadow-sm rounded-t-lg -mb-px z-10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
              >
                <tab.icon className="h-4.5 w-4.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8 space-y-10">
          {activeTab === 'general' && (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border text-blue-600 bg-blue-50 border-blue-100 mb-6">
                <FaInfoCircle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">ข้อมูลการจอง</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ชื่อผู้ใช้</label>
                  <div className="py-2.5 px-4 bg-gray-50/70 rounded-lg border border-gray-200 text-gray-900 font-medium">
                    {booking.customer_name}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">เบอร์โทรศัพท์</label>
                  <div className="py-2.5 px-4 bg-gray-50/70 rounded-lg border border-gray-200 text-gray-900">
                    {booking.customer_phone || '—'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">อีเมล</label>
                  <div className="py-2.5 px-4 bg-gray-50/70 rounded-lg border border-gray-200 text-gray-900">
                    {booking.customer_email || '—'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ชื่อผู้ติดต่อ</label>
                  <div className="py-2.5 px-4 bg-gray-50/70 rounded-lg border border-gray-200 text-gray-900 font-medium">
                    {booking.contact_name}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">เบอร์โทรศัพท์ผู้ติดต่อ</label>
                  <div className="py-2.5 px-4 bg-gray-50/70 rounded-lg border border-gray-200 text-gray-900">
                    {booking.contact_phone || '—'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">อีเมลผู้ติดต่อ</label>
                  <div className="py-2.5 px-4 bg-gray-50/70 rounded-lg border border-gray-200 text-gray-900">
                    {booking.contact_email || '—'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">สถานะการจอง</label>
                  <select
                    name="booking_status"
                    value={formData.booking_status || booking.booking_status}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="pending">รอยืนยัน</option>
                    <option value="pending_balance">รอชำระส่วนที่เหลือ</option>
                    <option value="confirmed">ยืนยันแล้ว</option>
                    <option value="picked_up">รับรถแล้ว</option>
                    <option value="returned">คืนรถแล้ว</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                    <option value="no_show">ไม่มารับ</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">วันที่เริ่มเช่า (คาด)</label>
                  <input
                    type="date"
                    name="booking_start_date"
                    value={formData.booking_start_date?.split('T')[0] || ''}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {formatThaiDateTime(booking.booking_start_date)}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">วันที่สิ้นสุดเช่า (คาด)</label>
                  <input
                    type="date"
                    name="booking_end_date"
                    value={formData.booking_end_date?.split('T')[0] || ''}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {formatThaiDateTime(booking.booking_end_date)}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ยอดมัดจำ (บาท)</label>
                  <input
                    type="number"
                    name="deposit_amount"
                    value={formData.deposit_amount ?? booking.deposit_amount}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.deposit_amount).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">เงินประกัน (บาท)</label>
                  <input
                    type="number"
                    name="insurance_amount"
                    value={formData.insurance_amount ?? booking.insurance_amount}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.insurance_amount).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ค่าเช่า</label>
                  <input
                    type="number"
                    name="rental_amount"
                    value={formData.rental_amount ?? booking.rental_amount}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.rental_amount).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ส่วนลดรวม</label>
                  <input
                    type="number"
                    name="total_discount"
                    value={formData.total_discount ?? booking.total_discount}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.total_discount).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ยอดรวมทั้งสิ้น</label>
                  <input
                    type="number"
                    name="booking_total_price"
                    value={formData.booking_total_price ?? booking.booking_total_price}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.booking_total_price).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">เงินที่หักจากประกัน</label>
                  <input
                    type="number"
                    name="insurance_deducted"
                    value={formData.insurance_deducted ?? booking.insurance_deducted}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.insurance_deducted).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">เงินประกันที่คืน</label>
                  <input
                    type="number"
                    name="insurance_refund_amount"
                    value={formData.insurance_refund_amount ?? booking.insurance_refund_amount}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.insurance_refund_amount).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ค่าปรับคืนรถช้า</label>
                  <input
                    type="number"
                    name="late_fee"
                    value={formData.late_fee ?? booking.late_fee}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.late_fee).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ค่าปรับยกเลิก</label>
                  <input
                    type="number"
                    name="cancellation_fee_amount"
                    value={formData.cancellation_fee_amount ?? booking.cancellation_fee_amount}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.cancellation_fee_amount).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ค่าปรับไม่มา</label>
                  <input
                    type="number"
                    name="no_show_fee_amount"
                    value={formData.no_show_fee_amount ?? booking.no_show_fee_amount}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.no_show_fee_amount).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-600">ค่าเสียหายรถ</label>
                  <input
                    type="number"
                    name="damage_fee"
                    value={formData.damage_fee ?? booking.damage_fee}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.damage_fee).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaStickyNote className="text-gray-500" />
                    ลูกค้าขอเป็นพิเศษ
                  </label>
                  <input
                    type="text"
                    name="special_request"
                    value={formData.special_request ?? booking.special_request ?? ''}
                    onChange={handleChange}
                    className="block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FaStickyNote className="text-gray-500" />
                  หมายเหตุภายใน (Internal Note)
                </label>
                <textarea
                  name="internal_note"
                  value={formData.internal_note || booking.internal_note || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="บันทึกข้อมูลภายใน เช่น สภาพรถตอนรับ, ปัญหาที่เกิดขึ้น, ข้อตกลงพิเศษ..."
                />
              </div>
            </>
          )}

          {activeTab === 'pickup' && (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border text-indigo-600 bg-indigo-50 border-indigo-100 mb-6">
                <FaCarSide className="h-5 w-5" />
                <h2 className="text-lg font-semibold">ข้อมูลการรับรถ</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mb-10">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    วันเวลาที่รับรถจริง <span className="text-red-600">*</span>
                  </label>

                  {booking.pickup_datetime ? (
                    <div className="py-2.5 px-4 bg-green-50 rounded-lg border border-green-200 text-green-800 font-medium">
                      {formatThaiDateTime(booking.pickup_datetime)}
                    </div>
                  ) : (
                    <>
                      <input
                        type="datetime-local"
                        name="pickup_datetime"
                        value={formData.pickup_datetime || ''}
                        onChange={handleChange}
                        required
                        className="block w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        คาดว่าจะรับ: {formatThaiDateTime(booking.booking_start_date)}
                      </p>
                      <p className="text-xs text-amber-600 mt-1 italic">
                        ระบุเวลาที่รับรถเสร็จจริง (ไม่ใช่เวลานัด)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {!booking.pickup_datetime && (
                <div className="mt-6 text-center mb-10">
                  <button
                    onClick={handleRecordPickup}
                    disabled={saving || !formData.pickup_datetime}
                    className={`inline-flex items-center px-10 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${saving || !formData.pickup_datetime
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                      } disabled:opacity-60`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      'ยืนยันรับรถจริง'
                    )}
                  </button>
                  <p className="text-sm text-gray-600 mt-3">
                    กดปุ่มนี้เมื่อลูกค้ามารับรถและตรวจสภาพเรียบร้อยแล้ว
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ระบบจะบันทึกเวลาที่เลือก + เปลี่ยนสถานะเป็น "รับรถแล้ว"
                  </p>
                </div>
              )}

              <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6 lg:p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                  <FaMoneyBillWave className="text-green-600" />
                  การชำระเงินหน้ารับรถ
                </h3>

                {displayRemaining <= 0 && booking.pickup_datetime ? (
                  <div className="text-center py-12 text-green-700 font-medium text-2xl bg-green-50 rounded-xl border border-green-100">
                    ชำระเงินครบแล้ว ✓
                    <p className="text-base text-gray-700 mt-4">
                      สถานะปัจจุบัน: {getStatusLabel(booking.booking_status)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      รับรถเมื่อ: {formatThaiDateTime(booking.pickup_datetime)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="max-w-md mx-auto bg-white p-6 rounded-xl border shadow-sm space-y-6">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-1">
                          สรุปยอดที่ต้องชำระหน้ารับรถ
                        </p>
                        <p className="text-3xl font-bold text-amber-700 mb-1">
                          {(
                            (payInsurance && !hasPaidInsurance ? remainingInsurance : 0) +
                            (payRemainingRental && !hasPaidRental ? displayRemaining : 0)
                          ).toLocaleString()} บาท
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            ค่าเช่าที่เหลือ: <span className="font-medium">{displayRemaining.toLocaleString()} บาท</span>
                          </p>
                          <p>
                            เงินประกัน: <span className="font-medium">{remainingInsurance.toLocaleString()} บาท</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${hasPaidInsurance
                            ? 'bg-green-50 border-green-200 opacity-80'
                            : payInsurance
                              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={payInsurance && !hasPaidInsurance}
                            onChange={(e) => setPayInsurance(e.target.checked)}
                            disabled={hasPaidInsurance || saving}
                            className="h-6 w-6 text-green-600 rounded border-gray-300 focus:ring-green-500 disabled:opacity-50 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className={`font-semibold text-base ${hasPaidInsurance ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  เงินประกัน
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  จากยอดรวม {Number(booking.insurance_amount || 0).toLocaleString()} บาท
                                </p>
                              </div>
                              <p className={`font-bold text-lg ${hasPaidInsurance ? 'text-green-600' : 'text-gray-800'}`}>
                                {remainingInsurance.toLocaleString()} บาท
                              </p>
                            </div>
                            {hasPaidInsurance && (
                              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                <span className="text-base">✓</span> ชำระครบแล้ว (เหลือ 0 บาท)
                              </p>
                            )}
                          </div>
                        </label>

                        <label
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${hasPaidRental
                            ? 'bg-green-50 border-green-200 opacity-80'
                            : payRemainingRental
                              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={payRemainingRental && !hasPaidRental}
                            onChange={(e) => setPayRemainingRental(e.target.checked)}
                            disabled={hasPaidRental || saving}
                            className="h-6 w-6 text-green-600 rounded border-gray-300 focus:ring-green-500 disabled:opacity-50 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className={`font-semibold text-base ${hasPaidRental ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  ค่าเช่าที่เหลือ
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  (หัก deposit / full / remaining แล้ว)
                                </p>
                              </div>
                              <p className={`font-bold text-lg ${hasPaidRental ? 'text-green-600' : 'text-gray-800'}`}>
                                {displayRemaining.toLocaleString()} บาท
                              </p>
                            </div>
                            {hasPaidRental && (
                              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                <span className="text-base">✓</span> ชำระครบแล้ว (เหลือ 0 บาท)
                              </p>
                            )}
                          </div>
                        </label>
                      </div>

                      <div className="pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          วิธีการชำระเงิน
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'qr' | 'credit_card')}
                          disabled={saving}
                          className="block w-full p-3.5 border border-gray-300 rounded-xl focus:border-green-500 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 bg-white shadow-sm text-gray-900"
                        >
                          <option value="cash">เงินสด</option>
                          <option value="qr">QR Code / PromptPay</option>
                          <option value="credit_card">บัตรเครดิต</option>
                        </select>
                      </div>

                      <div className="text-center pt-6 space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-base font-semibold text-amber-800 mb-1">
                            ยอดที่จะบันทึกการชำระ
                          </p>
                          <p className="text-2xl font-bold text-amber-700">
                            {(
                              (payInsurance && !hasPaidInsurance ? remainingInsurance : 0) +
                              (payRemainingRental && !hasPaidRental ? displayRemaining : 0)
                            ).toLocaleString()} บาท
                          </p>
                        </div>

                        {nothingSelected && (
                          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                            กรุณาเลือกอย่างน้อย 1 รายการที่ต้องการชำระ
                          </p>
                        )}

                        <button
                          onClick={handleRecordPickupPayment}
                          disabled={
                            saving ||
                            displayRemaining <= 0 ||
                            nothingSelected ||
                            ((payInsurance && !hasPaidInsurance ? remainingInsurance : 0) +
                              (payRemainingRental && !hasPaidRental ? displayRemaining : 0)) === 0
                          }
                          className={`w-full py-4 px-8 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${saving
                            ? 'bg-gray-400 cursor-not-allowed'
                            : ((payInsurance && !hasPaidInsurance ? remainingInsurance : 0) +
                              (payRemainingRental && !hasPaidRental ? displayRemaining : 0)) === 0
                              ? 'bg-green-500 hover:bg-green-600 cursor-default'
                              : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          {saving ? (
                            'กำลังบันทึก...'
                          ) : displayRemaining <= 0 ? (
                            'ชำระครบถ้วนแล้ว ✓'
                          ) : (
                            `บันทึกการชำระที่เลือก`
                          )}
                        </button>

                        <p className="text-xs text-gray-500 leading-relaxed">
                          ระบบจะบันทึกเฉพาะส่วนที่ยังไม่ได้ชำระและติ๊กเลือกไว้
                          (ยอดค่าเช่าใช้ข้อมูลจากระบบจริง ไม่รวมเงินประกัน)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'return' && (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border text-purple-600 bg-purple-50 border-purple-100 mb-6">
                <FaUndoAlt className="h-5 w-5" />
                <h2 className="text-lg font-semibold">ข้อมูลการคืนรถ</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mb-10">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    วันเวลาคืนรถจริง <span className="text-red-600">*</span>
                  </label>
                  {booking.actual_return_datetime ? (
                    <div className="py-2.5 px-4 bg-purple-50 rounded-lg border border-purple-200 text-purple-800 font-medium">
                      {formatThaiDateTime(booking.actual_return_datetime)}
                    </div>
                  ) : (
                    <input
                      type="datetime-local"
                      name="actual_return_datetime"
                      value={formData.actual_return_datetime || ''}
                      onChange={handleChange}
                      className="block w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      required
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    คาดว่าจะคืน: {formatThaiDateTime(booking.booking_end_date)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ค่าปรับคืนรถช้า (คำนวณอัตโนมัติ)
                  </label>
                  <div className="py-2.5 px-5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-bold text-lg flex items-center justify-between">
                    <span>{calculatedLateFee.toLocaleString()} บาท</span>
                    {returnLateDays > 0 && (
                      <span className="text-sm font-normal text-amber-700">
                        (ล่าช้า ≈ {returnLateDays} วัน)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    อัตราปรับ: {Number(settings?.late_fee_per_hour ?? 300).toLocaleString()} บาท/ชม. (หลัง grace 2 ชม.)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    เงินที่หักจากประกัน
                  </label>
                  <input
                    type="number"
                    name="insurance_deducted"
                    value={formData.insurance_deducted || booking.insurance_deducted || ''}
                    onChange={handleChange}
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    เงินประกันที่คืน
                  </label>
                  <input
                    type="number"
                    name="insurance_refund_amount"
                    value={formData.insurance_refund_amount || booking.insurance_refund_amount || ''}
                    onChange={handleChange}
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">เดิม: {Number(booking.insurance_amount).toLocaleString()} บาท</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ค่าเสียหายรถ
                  </label>
                  <input
                    type="number"
                    name="damage_fee"
                    value={formData.damage_fee || booking.damage_fee || ''}
                    onChange={handleChange}
                    className="block w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              {!booking.actual_return_datetime && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleRecordReturn}
                    disabled={saving || !formData.actual_return_datetime}
                    className={`px-12 py-4 rounded-xl text-white font-medium text-lg shadow-md transition ${saving || !formData.actual_return_datetime
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                  >
                    {saving ? 'กำลังบันทึก...' : 'ยืนยันการคืนรถ'}
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    ระบบจะบันทึกเวลาคืนรถ + ค่าปรับล่าช้า/เสียหาย และอัปเดตสถานะอัตโนมัติ
                  </p>
                </div>
              )}

              {booking.actual_return_datetime && (
                <div className="text-center py-10 bg-green-50 rounded-xl border border-green-100 mt-8">
                  <p className="text-2xl font-bold text-green-700 mb-2">คืนรถเรียบร้อยแล้ว</p>
                  <p className="text-gray-700">
                    สถานะปัจจุบัน: {getStatusLabel(booking.booking_status)}
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'payment' && (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border text-green-600 bg-green-50 border-green-100 mb-6">
                <FaWallet className="h-5 w-5" />
                <h2 className="text-lg font-semibold">สรุปการเงิน</h2>
              </div>

              <div className="bg-green-50/60 border border-green-100 rounded-xl p-6 lg:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">ยอดรวมทั้งสิ้น</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {Number(booking.booking_total_price).toLocaleString()}
                      <span className="text-xl font-normal"> บาท</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">ชำระแล้ว (ค่าเช่า)</p>
                    <p className="text-3xl font-bold text-green-700">
                      {Number(booking.total_paid).toLocaleString()}
                      <span className="text-xl font-normal"> บาท</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">ชำระแล้ว (เงินประกัน)</p>
                    <p className="text-3xl font-bold text-teal-700">
                      {paidInsuranceTotal.toLocaleString()}
                      <span className="text-xl font-normal"> บาท</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">ยอดคงเหลือค่าเช่า</p>
                    <p
                      className={`text-3xl font-bold ${displayRemaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}
                    >
                      {displayRemaining.toLocaleString()}
                      <span className="text-xl font-normal"> บาท</span>
                    </p>
                  </div>
                </div>

                {displayRemaining > 0 && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    <p className="font-medium">ยังมีส่วนค้างชำระ</p>
                    <p className="text-sm mt-1">
                      ยอดคงเหลือค่าเช่า: {displayRemaining.toLocaleString()} บาท (ไม่รวมเงินประกันและค่าปรับเพิ่มเติม)
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 bg-blue-50 p-5 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <FaInfoCircle className="inline mr-2" />
                  หมายเหตุ: ยอดคงเหลือคำนวณเฉพาะค่าเช่า (deposit/full/remaining) ไม่รวมเงินประกันและค่าปรับ
                </p>
              </div>
            </>
          )}

          {activeTab === 'penalties' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border text-amber-600 bg-amber-50 border-amber-100 mb-6">
                <FaHandPaper className="h-5 w-5" />
                <h2 className="text-lg font-semibold">สรุปค่าปรับและการหักทั้งหมด</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-sm text-amber-700 mb-2">ค่าปรับคืนช้า</p>
                  <p className="text-4xl font-bold text-amber-800">
                    {Number(booking.late_fee || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">บาท</p>
                </div>

                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-sm text-red-700 mb-2">ค่าปรับยกเลิก</p>
                  <p className="text-4xl font-bold text-red-800">
                    {Number(booking.cancellation_fee_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-red-600 mt-1">บาท</p>
                </div>

                <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl text-center">
                  <p className="text-sm text-orange-700 mb-2">ค่าปรับไม่มารับ (No Show)</p>
                  <p className="text-4xl font-bold text-orange-800">
                    {Number(booking.no_show_fee_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-orange-600 mt-1">บาท</p>
                </div>

                <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <p className="text-sm text-rose-700 mb-2">ค่าเสียหายรถ</p>
                  <p className="text-4xl font-bold text-rose-800">
                    {Number(booking.damage_fee || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-rose-600 mt-1">บาท</p>
                </div>

                <div className="p-6 bg-teal-50 border border-teal-200 rounded-xl text-center">
                  <p className="text-sm text-teal-700 mb-2">หักจากเงินประกัน</p>
                  <p className="text-4xl font-bold text-teal-800">
                    {Number(booking.insurance_deducted || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-teal-600 mt-1">บาท</p>
                </div>

                <div className="p-6 bg-cyan-50 border border-cyan-200 rounded-xl text-center">
                  <p className="text-sm text-cyan-700 mb-2">เงินประกันที่คืน</p>
                  <p className="text-4xl font-bold text-cyan-800">
                    {Number(booking.insurance_refund_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-cyan-600 mt-1">บาท</p>
                </div>
              </div>

              {(booking.late_fee > 0 || booking.damage_fee > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl text-center">
                  <p className="text-lg font-medium text-yellow-800">
                    มีค่าปรับเพิ่มเติมจากรถรวม {Number(booking.late_fee + booking.damage_fee).toLocaleString()} บาท
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border text-amber-600 bg-amber-50 border-amber-100 mb-6">
                <FaExclamationTriangle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">การดำเนินการพิเศษ</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl border ${canCancelOrNoShow ? 'bg-red-50 border-red-200' : 'bg-gray-100 opacity-60'}`}>
                  <h3 className="text-lg font-semibold text-red-800 mb-4">ยกเลิกการจอง</h3>
                  <p className="text-sm text-red-700 mb-6">
                    การยกเลิกจะคิดค่าปรับตามที่ระบบกำหนด และเปลี่ยนสถานะเป็น "ยกเลิก"
                  </p>
                  <button
                    onClick={handleCancelBooking}
                    disabled={saving || !canCancelOrNoShow}
                    className={`w-full py-3 px-6 rounded-lg text-white font-medium ${!canCancelOrNoShow || saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {saving ? 'กำลังดำเนินการ...' : 'ยกเลิกการจอง'}
                  </button>
                </div>

                <div className={`p-6 rounded-xl border ${canCancelOrNoShow ? 'bg-orange-50 border-orange-200' : 'bg-gray-100 opacity-60'}`}>
                  <h3 className="text-lg font-semibold text-orange-800 mb-4">ไม่มารับรถ (No Show)</h3>
                  <p className="text-sm text-orange-700 mb-6">
                    ใช้เมื่อลูกค้าไม่มาตามนัด จะคิดค่าปรับ No Show และเปลี่ยนสถานะ
                  </p>
                  <button
                    onClick={handleMarkNoShow}
                    disabled={saving || !canCancelOrNoShow}
                    className={`w-full py-3 px-6 rounded-lg text-white font-medium ${!canCancelOrNoShow || saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                  >
                    {saving ? 'กำลังดำเนินการ...' : 'ทำเครื่องหมายไม่มารับ'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 text-sm text-blue-800">
                <FaInfoCircle className="inline mr-2" />
                การยกเลิกหรือทำเครื่องหมายไม่มารับ สามารถทำได้เฉพาะก่อนรับรถ และสถานะยังเป็น pending / pending_balance / confirmed เท่านั้น
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}