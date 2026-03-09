'use client';

import { useState, useEffect } from 'react';
import { format, addDays, differenceInDays, isBefore } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Calendar, Car, Clock, DollarSign, Search,
  AlertCircle, CheckCircle, ArrowRight, X, MapPin, Tag, Loader2, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// ── Services ────────────────────────────────────────────────────────────────
import { fetchSystemSettings } from '@/lib/services/client/admin/system_settings/get';
import { getCarClasses } from '@/lib/services/client/admin/car_classes/get';
import { getBranches } from '@/lib/services/client/admin/branches/get';
import { getAvailableCars } from '@/lib/services/client/admin/cars/get';
import { applyCoupon } from '@/lib/services/client/admin/coupons/apply';
import { postBooking } from '@/lib/services/client/admin/bookings/post';
import type { AvailableCar } from "@/lib/type/available-car";

// ── Interfaces ──────────────────────────────────────────────────────────────
interface CarClass {
  class_id: number;
  class_code: string;
  class_name: string;
  class_description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Branch {
  branch_id: number;
  branch_name: string;
  branch_address?: string | null;
  branch_phone?: string | null;
}

interface Coupon {
  coupon_id: number;
  coupon_code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  max_discount_amount: string | null;
  min_booking_amount: string | null;
  usage_limit_per_user: number;
  is_active: boolean;
}

interface PromoInfo {
  hasActive: boolean;
  hasUpcoming: boolean;
  maxActive?: { type: 'percent' | 'fixed'; value: number };
  maxUpcoming?: { type: 'percent' | 'fixed'; value: number };
}

// ── Helper: คำนวณส่วนลดจากโปรโมชั่น ────────────────────────────────────────
function calcPromoDiscount(promo: PromoInfo['maxActive'], baseAmount: number): number {
  if (!promo || promo.value <= 0) return 0;
  if (promo.type === 'percent') return Math.round((baseAmount * promo.value) / 100);
  return Math.min(promo.value, baseAmount);
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function QuickBookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [pickupDate, setPickupDate] = useState<Date>(addDays(new Date(), 1));
  const [returnDate, setReturnDate] = useState<Date>(addDays(new Date(), 3));
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('18:00');

  const [carClasses, setCarClasses] = useState<CarClass[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [selectedCar, setSelectedCar] = useState<AvailableCar | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [systemSettings, setSystemSettings] = useState<any>(null);

  const [initLoading, setInitLoading] = useState(true);
  const [carsLoading, setCarsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [promoInfo, setPromoInfo] = useState<Record<number, PromoInfo>>({});

  const isAuthenticated = status === 'authenticated';

  // ── ดึงค่า systemSettings ที่ใช้ในหน้านี้ ────────────────────────────────
  const enforceDeposit = systemSettings?.enforce_deposit ?? true;
  const requireInsurance = systemSettings?.require_insurance ?? true;
  const cancellationFee = Number(systemSettings?.cancellation_fee ?? 0);
  const lateFeePerHour = Number(systemSettings?.late_fee_per_hour ?? 0);
  const minRenterAge = systemSettings?.min_renter_age ?? 18;

  // ── คำนวณราคา ────────────────────────────────────────────────────────────
  const rentalDays = Math.max(1, differenceInDays(returnDate, pickupDate) + 1);
  const pricePerDay = selectedCar ? Number(selectedCar.car_price_per_day) : 0;
  const baseRentalAmount = pricePerDay * rentalDays;

  const selectedCarPromo = selectedCar ? promoInfo[selectedCar.car_id] : null;
  const promoDiscount = selectedCarPromo?.hasActive
    ? calcPromoDiscount(selectedCarPromo.maxActive, baseRentalAmount)
    : 0;

  const totalDiscount = Math.min(couponDiscount + promoDiscount, baseRentalAmount);
  const finalRentalAmount = Math.max(0, baseRentalAmount - totalDiscount);

  // ✅ ใช้ enforceDeposit และ requireInsurance ในการคำนวณ
  const depositAmount = (enforceDeposit && selectedCar?.car_deposit)
    ? Number(selectedCar.car_deposit)
    : 0;
  const insuranceAmount = (requireInsurance && selectedCar?.car_insurance_fee)
    ? Number(selectedCar.car_insurance_fee)
    : 0;
  const bookingTotalPrice = finalRentalAmount;

  // Reset คูปองเมื่อเปลี่ยนรถ
  useEffect(() => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  }, [selectedCar]);

  // ── โหลดข้อมูลเริ่มต้น ───────────────────────────────────────────────────
  useEffect(() => {
    async function loadInitialData() {
      setInitLoading(true);
      try {
        const [classesData, branchesData] = await Promise.all([
          getCarClasses(),
          getBranches(),
        ]);

        const settings = await fetchSystemSettings();
        setSystemSettings(settings);

        setCarClasses(classesData.filter((c: CarClass) => c.is_active));
        setBranches(branchesData);

        if (status !== 'authenticated') return;

        const userRole = session?.user?.role;
        const userBranchId = session?.user?.branch_id as number | null | undefined;

        if (userRole === 'admin') {
          if (branchesData.length > 0) setSelectedBranchId(branchesData[0].branch_id);
        } else if (userBranchId && branchesData.some((b: any) => b.branch_id === userBranchId)) {
          setSelectedBranchId(userBranchId);
        } else if (branchesData.length > 0) {
          setSelectedBranchId(branchesData[0].branch_id);
        }
      } catch (err: any) {
        setError(err.message || 'ไม่สามารถโหลดข้อมูลสาขาและประเภทรถได้');
      } finally {
        setInitLoading(false);
      }
    }

    loadInitialData();
  }, [session, status]);

  // Reset เมื่อเปลี่ยนช่วงเวลา / สาขา
  useEffect(() => {
    setSelectedClassId(null);
    setSelectedCar(null);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setAvailableCars([]);
    setPromoInfo({});
    setStep(1);
  }, [pickupDate, returnDate, pickupTime, returnTime, selectedBranchId]);

  // ── โหลดรถว่าง + โปรโมชั่น ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClassId || !selectedBranchId) {
      setAvailableCars([]);
      setSelectedCar(null);
      setPromoInfo({});
      return;
    }

    async function loadCars() {
      setCarsLoading(true);
      setError(null);

      try {
        const carsData = await getAvailableCars({
          class_id: selectedClassId ?? undefined,
          branch_id: selectedBranchId ?? undefined,
          start_date: pickupDate.toISOString().split('T')[0],
          end_date: returnDate.toISOString().split('T')[0],
        });
        setAvailableCars(carsData);
        setCarsLoading(false);

        if (carsData.length > 0) {
          const carIds = carsData.map((c: AvailableCar) => c.car_id).join(',');

          fetch(`/api/admin/promotionCars?scope=by_cars&car_ids=${carIds}`, { cache: 'no-store' })
            .then((res) => res.ok ? res.json() : null)
            .then((rawPromos) => {
              if (!rawPromos) return;

              const now = new Date();
              const infoMap: Record<number, PromoInfo> = {};

              for (const promo of rawPromos as Array<{
                car_id: number;
                discount_type: 'percent' | 'fixed';
                discount_value: string;
                promo_start: string;
                promo_end: string;
              }>) {
                const start = new Date(promo.promo_start);
                const end = new Date(promo.promo_end);
                const val = Number(promo.discount_value);
                const isActive = start <= now && now <= end;
                const isUpcoming = start > now && end > now;

                if (!infoMap[promo.car_id]) {
                  infoMap[promo.car_id] = { hasActive: false, hasUpcoming: false };
                }

                const entry = infoMap[promo.car_id];

                if (isActive) {
                  entry.hasActive = true;
                  if (!isNaN(val) && val > 0) {
                    if (!entry.maxActive || val > entry.maxActive.value || (entry.maxActive.type === 'fixed' && promo.discount_type === 'percent')) {
                      entry.maxActive = { type: promo.discount_type, value: val };
                    }
                  }
                }

                if (isUpcoming) {
                  entry.hasUpcoming = true;
                  if (!isNaN(val) && val > 0) {
                    if (!entry.maxUpcoming || val > entry.maxUpcoming.value || (entry.maxUpcoming.type === 'fixed' && promo.discount_type === 'percent')) {
                      entry.maxUpcoming = { type: promo.discount_type, value: val };
                    }
                  }
                }
              }

              setPromoInfo(infoMap);
            })
            .catch(() => { });
        }
      } catch (err: any) {
        setError(err.message || 'ไม่สามารถโหลดรถที่ว่างได้');
        setCarsLoading(false);
      }
    }

    loadCars();
  }, [selectedClassId, selectedBranchId, pickupDate, returnDate]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return setCouponError('กรุณากรอกรหัสคูปอง');
    if (!isAuthenticated || !session?.user?.id) return setCouponError('กรุณาเข้าสู่ระบบก่อนใช้คูปอง');

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await applyCoupon({ couponCode: code, bookingAmount: baseRentalAmount });
      if (!res.ok) return setCouponError(res.message || 'ไม่สามารถใช้คูปองได้');
      setAppliedCoupon(res.coupon);
      setCouponDiscount(Number(res.calculated_discount));
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'เกิดข้อผิดพลาดของระบบ');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedCar) return setError('กรุณาเลือกรถก่อน');
    if (!contactName.trim() || !contactPhone.trim()) return setError('กรุณากรอกชื่อและเบอร์โทรให้ครบถ้วน');
    if (!selectedBranchId) return setError('กรุณาเลือกสาขาก่อน');

    // ✅ ตรวจสอบ enforce_deposit: ถ้าบังคับแต่รถไม่มีค่ามัดจำ = ห้ามจอง
    if (enforceDeposit && depositAmount <= 0) {
      return setError('รถคันนี้ไม่มีค่ามัดจำ ไม่สามารถจองได้ (ระบบบังคับเก็บค่ามัดจำ)');
    }

    setBookingLoading(true);
    setError(null);

    const pickupDateTime = new Date(pickupDate);
    const [ph, pm] = pickupTime.split(':').map(Number);
    pickupDateTime.setHours(ph, pm, 0, 0);

    const expectedReturnDateTime = new Date(returnDate);
    const [rh, rm] = returnTime.split(':').map(Number);
    expectedReturnDateTime.setHours(rh, rm, 0, 0);

    const payload = {
      car_id: selectedCar.car_id,
      branch_id: selectedBranchId,
      booking_start_date: pickupDate.toISOString().split('T')[0],
      booking_end_date: returnDate.toISOString().split('T')[0],
      // pickup_datetime: pickupDateTime.toISOString(),
      // expected_return_datetime: expectedReturnDateTime.toISOString(),
      rental_amount: baseRentalAmount.toFixed(2),
      // ✅ ใช้ค่าที่ผ่าน enforceDeposit / requireInsurance แล้ว
      deposit_amount: depositAmount.toFixed(2),
      insurance_amount: insuranceAmount.toFixed(2),
      booking_total_price: bookingTotalPrice.toFixed(2),
      total_paid: bookingTotalPrice.toFixed(2),
      remaining_amount: '0.00',
      discount_coupon: couponDiscount.toFixed(2),
      discount_promo: promoDiscount.toFixed(2),
      total_discount: totalDiscount.toFixed(2),
      coupon_id: appliedCoupon?.coupon_id ?? null,
      promo_id: null,
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim() || '',
      contact_phone: contactPhone.trim(),
      special_request: specialRequest.trim() || null,
      internal_note: '',
      booking_status: 'pending' as const,
    };

    try {
      const booking = await postBooking(payload);
      router.push(`/admin/schedule/payment/${booking.booking_id}`);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างการจอง');
      setBookingLoading(false);
    }
  };

  // ── Loading State เริ่มต้น ───────────────────────────────────────────────
  if (initLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">จองรถด่วน (Quick Booking)</h1>
            <p className="text-muted-foreground mt-1">
              ระบบจองแบบเร็วสำหรับพนักงาน — สร้าง booking ได้รวดเร็ว
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn('w-3 h-3 rounded-full transition-colors', step >= s ? 'bg-primary' : 'bg-muted')}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                ข้อมูลการเช่า
              </CardTitle>
              <CardDescription>
                {step === 1 && 'เลือกสาขาและกำหนดช่วงเวลา'}
                {step === 2 && 'เลือกประเภทรถที่ต้องการ'}
                {step === 3 && 'เลือกรถคันที่ว่างในสาขานี้'}
                {step === 4 && 'กรอกข้อมูลลูกค้าและยืนยัน'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">

              {/* สาขา */}
              <div className="space-y-4">
                <Label className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  สาขาที่ต้องการรับ-คืนรถ *
                </Label>
                <Select
                  value={selectedBranchId?.toString() ?? ''}
                  onValueChange={(val) => {
                    setSelectedBranchId(Number(val));
                    setSelectedClassId(null);
                    setSelectedCar(null);
                    setAvailableCars([]);
                    setAppliedCoupon(null);
                    setCouponDiscount(0);
                    setStep(1);
                  }}
                  disabled={bookingLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                        {branch.branch_name}
                        {branch.branch_address && (
                          <span className="text-xs text-muted-foreground ml-2">
                            — {branch.branch_address.substring(0, 40)}
                            {branch.branch_address.length > 40 ? '...' : ''}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ช่วงเวลา */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">รับรถ</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left" disabled={!selectedBranchId || bookingLoading}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(pickupDate, 'dd MMM yyyy', { locale: th })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={pickupDate}
                          onSelect={(d) => d && setPickupDate(d)}
                          disabled={(d) => isBefore(d, addDays(new Date(), 1))}
                        />
                      </PopoverContent>
                    </Popover>
                    <Select value={pickupTime} onValueChange={setPickupTime} disabled={!selectedBranchId || bookingLoading}>
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const h = i.toString().padStart(2, '0');
                          return <SelectItem key={h} value={`${h}:00`}>{h}:00 น.</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">คืนรถ</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left" disabled={!selectedBranchId || bookingLoading}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(returnDate, 'dd MMM yyyy', { locale: th })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={returnDate}
                          onSelect={(d) => d && setReturnDate(d)}
                          disabled={(d) => isBefore(d, pickupDate)}
                        />
                      </PopoverContent>
                    </Popover>
                    <Select value={returnTime} onValueChange={setReturnTime} disabled={!selectedBranchId || bookingLoading}>
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const h = i.toString().padStart(2, '0');
                          return <SelectItem key={h} value={`${h}:00`}>{h}:00 น.</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ประเภทรถ */}
              {selectedBranchId && (
                <div className="space-y-4 pt-4">
                  <Label className="text-lg font-medium">ประเภทรถที่ต้องการ</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {carClasses.map((cls) => (
                      <Card
                        key={cls.class_id}
                        className={cn(
                          'cursor-pointer transition-all hover:border-primary hover:shadow-sm',
                          selectedClassId === cls.class_id && 'border-primary bg-primary/5 shadow-md',
                          bookingLoading && 'pointer-events-none opacity-60'
                        )}
                        onClick={() => { setSelectedClassId(cls.class_id); setStep(3); }}
                      >
                        <CardContent className="p-4 text-center space-y-2">
                          <div className="font-semibold text-lg">{cls.class_name}</div>
                          <div className="text-sm text-muted-foreground">{cls.class_code}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* รถว่าง */}
              {selectedClassId && selectedBranchId && (
                <div className="space-y-6 pt-6 border-t">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg font-medium">
                      รถที่ว่างในสาขานี้
                      {!carsLoading && ` (${availableCars.length} คัน)`}
                    </h3>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="ค้นหาทะเบียน / ยี่ห้อ / รุ่น" className="pl-10" />
                    </div>
                  </div>

                  {carsLoading ? (
                    <div className="text-center py-16 space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                      <p className="text-muted-foreground text-sm">กำลังโหลดรถที่ว่าง...</p>
                    </div>
                  ) : availableCars.length === 0 ? (
                    <div className="text-center py-12 bg-muted/40 rounded-lg border border-dashed">
                      <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-medium">ไม่มีรถว่างในสาขานี้ช่วงเวลานี้</h4>
                      <p className="text-sm text-muted-foreground mt-2">ลองเปลี่ยนวันที่ หรือเลือกสาขาอื่น</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableCars.map((car) => {
                        const p = promoInfo[car.car_id];
                        let badge: React.ReactNode = null;

                        if (p?.hasActive && p.maxActive) {
                          const d = p.maxActive;
                          badge = (
                            <div className="absolute top-2 left-2 z-10">
                              <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow animate-pulse">
                                {d.type === 'percent' ? `${d.value}% OFF` : `฿${d.value.toLocaleString()} ลด`}
                              </div>
                            </div>
                          );
                        } else if (p?.hasActive) {
                          badge = (
                            <div className="absolute top-2 left-2 z-10">
                              <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1 animate-pulse">
                                <Tag className="h-3 w-3" />
                                โปรโมชัน
                              </div>
                            </div>
                          );
                        } else if (p?.hasUpcoming && p.maxUpcoming) {
                          const d = p.maxUpcoming;
                          badge = (
                            <div className="absolute top-2 left-2 z-10">
                              <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {d.type === 'percent' ? `${d.value}% (รอเริ่ม)` : `฿${d.value.toLocaleString()} (รอเริ่ม)`}
                              </div>
                            </div>
                          );
                        } else if (p?.hasUpcoming) {
                          badge = (
                            <div className="absolute top-2 left-2 z-10">
                              <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                โปรล่วงหน้า
                              </div>
                            </div>
                          );
                        }

                        // ✅ badge เตือนถ้า enforce_deposit แต่รถไม่มีค่ามัดจำ
                        const carDepositVal = Number(car.car_deposit ?? 0);
                        const noDepositWarning = enforceDeposit && carDepositVal <= 0;

                        const discountedPricePerDay = p?.hasActive && p.maxActive?.type === 'percent'
                          ? Math.round(Number(car.car_price_per_day) * (1 - p.maxActive.value / 100))
                          : Number(car.car_price_per_day);

                        return (
                          <Card
                            key={car.car_id}
                            className={cn(
                              'cursor-pointer transition-all hover:shadow-md hover:border-primary relative overflow-hidden',
                              selectedCar?.car_id === car.car_id && 'border-primary shadow-lg bg-primary/5',
                              // ✅ ถ้า enforce_deposit แต่รถไม่มีมัดจำ = แสดง disabled style
                              noDepositWarning && 'opacity-60 cursor-not-allowed hover:border-border hover:shadow-none',
                              bookingLoading && 'pointer-events-none opacity-60'
                            )}
                            onClick={() => {
                              if (noDepositWarning) return; // ✅ ป้องกันเลือก
                              setSelectedCar(car);
                              setStep(4);
                            }}
                          >
                            {badge}

                            {/* ✅ Warning badge กรณี enforce_deposit แต่ไม่มีค่ามัดจำ */}
                            {noDepositWarning && (
                              <div className="absolute top-2 right-2 z-10">
                                <div className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  ไม่มีค่ามัดจำ
                                </div>
                              </div>
                            )}

                            <CardContent className="p-4 space-y-3">
                              {car.car_image_cover ? (
                                <img
                                  src={car.car_image_cover}
                                  alt={`${car.car_brand} ${car.car_model}`}
                                  className="w-full h-32 object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center text-4xl font-bold text-muted-foreground">
                                  {car.car_brand?.charAt(0) || '?'}
                                </div>
                              )}
                              <div>
                                <h4 className="font-semibold">{car.car_brand} {car.car_model}</h4>
                                <p className="text-sm text-muted-foreground">ทะเบียน: {car.car_license_plate}</p>
                                <p className="text-sm">
                                  สาขา: {branches.find(b => b.branch_id === car.branch_id)?.branch_name || 'ไม่ระบุ'}
                                </p>

                                {p?.hasActive && p.maxActive?.type === 'fixed' ? (
                                  <div className="mt-1">
                                    <p className="text-sm font-medium text-primary">
                                      ฿{Number(car.car_price_per_day).toLocaleString()} / วัน
                                    </p>
                                    <p className="text-xs text-red-600 font-medium">
                                      ส่วนลดโปร ฿{p.maxActive.value.toLocaleString()} / การจอง
                                    </p>
                                  </div>
                                ) : p?.hasActive && p.maxActive?.type === 'percent' ? (
                                  <div className="mt-1 flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground line-through">
                                      ฿{Number(car.car_price_per_day).toLocaleString()}
                                    </p>
                                    <p className="text-sm font-medium text-primary">
                                      ฿{discountedPricePerDay.toLocaleString()} / วัน
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm font-medium text-primary mt-1">
                                    ฿{Number(car.car_price_per_day).toLocaleString()} / วัน
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - สรุป */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  สรุปการจอง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedBranchId && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> สาขา
                    </span>
                    <span className="font-medium">
                      {branches.find(b => b.branch_id === selectedBranchId)?.branch_name || '—'}
                    </span>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">รับรถ</span>
                    <span className="font-medium">{format(pickupDate, 'dd MMM yy', { locale: th })} {pickupTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">คืนรถ</span>
                    <span className="font-medium">{format(returnDate, 'dd MMM yy', { locale: th })} {returnTime}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-medium">
                    <span>ระยะเวลา</span>
                    <span>{rentalDays} วัน</span>
                  </div>
                </div>

                {selectedCar && (
                  <div className="pt-4 border-t space-y-4">
                    <div>
                      <h4 className="font-medium">{selectedCar.car_brand} {selectedCar.car_model}</h4>
                      <p className="text-sm text-muted-foreground">
                        ทะเบียน {selectedCar.car_license_plate} • {branches.find(b => b.branch_id === selectedCar.branch_id)?.branch_name || '—'}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>ค่าเช่า ({rentalDays} วัน × ฿{pricePerDay.toLocaleString()})</span>
                        <span>฿{baseRentalAmount.toLocaleString()}</span>
                      </div>

                      {promoDiscount > 0 && selectedCarPromo?.maxActive && (
                        <div className="flex justify-between text-red-600">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            ส่วนลดโปรโมชัน
                            {selectedCarPromo.maxActive.type === 'percent' && (
                              <span className="text-xs opacity-70">({selectedCarPromo.maxActive.value}%)</span>
                            )}
                          </span>
                          <span>-฿{promoDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      {appliedCoupon && couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            คูปอง ({appliedCoupon.coupon_code})
                          </span>
                          <span>-฿{couponDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      {promoDiscount > 0 && couponDiscount > 0 && (
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>ส่วนลดรวม</span>
                          <span>-฿{totalDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>ยอดรวมสุทธิ</span>
                        <span className="text-primary">฿{bookingTotalPrice.toLocaleString()}</span>
                      </div>

                      {/* ✅ ค่ามัดจำ: แสดงตาม enforceDeposit */}
                      <div className="flex justify-between text-amber-700 text-sm">
                        <span className="flex items-center gap-1">
                          ค่ามัดจำจองล่วงหน้า
                          {enforceDeposit && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                              บังคับชำระ
                            </span>
                          )}
                        </span>
                        <span>฿{depositAmount.toLocaleString()}</span>
                      </div>

                      {/* ✅ เงินประกัน: แสดงเฉพาะถ้า requireInsurance = true */}
                      {requireInsurance && (
                        <div className="flex justify-between text-amber-700 text-sm">
                          <span>เงินประกันค้ำรถ</span>
                          <span>฿{insuranceAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* คูปอง */}
                    <div className="space-y-3">
                      <Label>คูปองส่วนลด</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="กรอกรหัสคูปอง"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={!!appliedCoupon || couponLoading || !isAuthenticated || bookingLoading}
                          className={cn(couponError && 'border-destructive')}
                        />
                        <Button
                          variant="secondary"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || !!appliedCoupon || couponLoading || !isAuthenticated || bookingLoading}
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ใช้'}
                        </Button>
                      </div>

                      {couponError && (
                        <p className="text-sm text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          {couponError}
                        </p>
                      )}

                      {appliedCoupon && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                          <div className="flex items-center justify-between font-medium">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {appliedCoupon.coupon_code}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-destructive hover:text-destructive/90"
                              disabled={bookingLoading}
                              onClick={() => {
                                setAppliedCoupon(null);
                                setCouponDiscount(0);
                                setCouponError(null);
                              }}
                            >
                              <X className="h-3.5 w-3.5 mr-1" /> ลบ
                            </Button>
                          </div>
                          <p className="text-green-700 mt-1">ส่วนลด ฿{couponDiscount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ข้อมูลลูกค้า */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                    <Input id="name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="สมชาย ใจดี" disabled={bookingLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                    <Input id="phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="098-765-4321" maxLength={10} disabled={bookingLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input id="email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="example@email.com" disabled={bookingLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="request">ความต้องการพิเศษ / หมายเหตุ</Label>
                    <Input id="request" value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)} placeholder="เบาะเด็ก, GPS, รับ-ส่งสนามบิน..." disabled={bookingLoading} />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                {error && <p className="text-sm text-destructive text-center w-full">{error}</p>}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleConfirmBooking}
                  disabled={
                    bookingLoading ||
                    !selectedBranchId ||
                    !selectedCar ||
                    !contactName.trim() ||
                    !contactPhone.trim() ||
                    !isAuthenticated ||
                    // ✅ ถ้าบังคับมัดจำแต่รถไม่มีค่ามัดจำ = ห้ามจอง
                    (enforceDeposit && depositAmount <= 0)
                  }
                >
                  {bookingLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังสร้างการจอง...
                    </span>
                  ) : (
                    <>
                      ยืนยันการจอง
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* ✅ นโยบายจาก systemSettings */}
                <div className="text-xs text-muted-foreground space-y-1 w-full border-t pt-3">
                  <p className="font-medium text-foreground flex items-center gap-1 mb-1">
                    <Info className="h-3.5 w-3.5" />
                    เงื่อนไขการเช่า
                  </p>
                  {minRenterAge > 0 && (
                    <p>• ผู้เช่าต้องมีอายุไม่ต่ำกว่า {minRenterAge} ปี</p>
                  )}
                  {cancellationFee > 0 && (
                    <p>• ค่าปรับยกเลิก: ฿{cancellationFee.toLocaleString()}</p>
                  )}
                  {lateFeePerHour > 0 && (
                    <p>• ค่าปรับคืนช้า: ฿{lateFeePerHour.toLocaleString()} / ชั่วโมง</p>
                  )}
                  <p className="pt-1 text-muted-foreground">ราคานี้ยังไม่รวมค่าบริการพิเศษอื่น ๆ</p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}