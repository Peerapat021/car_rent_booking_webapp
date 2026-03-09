'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import {
    CreditCard, QrCode, Banknote, CheckCircle, AlertCircle,
    ArrowRight, Clock, Car, DollarSign, User, Phone, Calendar, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Services
import { getBookingById } from '@/lib/services/client/admin/bookings/get';
import { postPayment } from '@/lib/services/client/admin/payments/post';
import { updateBookingStatus } from '@/lib/services/client/admin/bookings/patch';
import { fetchSystemSettings } from '@/lib/services/client/admin/system_settings/get';

import type { PaymentCreateData } from '@/lib/services/client/admin/payments/post';

type UIPaymentMethod = 'promptpay' | 'credit' | 'cash';
type PaymentOption = 'deposit' | 'full';

// ── Safe Date Formatter ─────────────────────────────────────────────────────
function safeFormatDate(
    dateStr: string | null | undefined,
    pattern = 'dd MMM yyyy HH:mm น.'
): string {
    if (!dateStr) return 'ไม่ระบุ';

    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        const isoLike = dateStr.replace(/\s/, 'T');
        date = new Date(isoLike);
    }
    if (isNaN(date.getTime())) {
        const dateOnly = dateStr.split(' ')[0];
        date = new Date(dateOnly + 'T00:00:00');
    }
    if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateStr);
        return 'วันที่ไม่ถูกต้อง';
    }

    return format(date, pattern, { locale: th });
}

export default function PaymentPage() {
    const params = useParams();
    const bookingId = params.booking_id as string;

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [systemSettings, setSystemSettings] = useState<any>(null);

    const [paymentMethod, setPaymentMethod] = useState<UIPaymentMethod>('promptpay');
    const [paymentOption, setPaymentOption] = useState<PaymentOption>('deposit');

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // ── โหลด booking + systemSettings พร้อมกัน ──────────────────────────────
    useEffect(() => {
        async function fetchData() {
            if (!bookingId || isNaN(Number(bookingId))) {
                setError('รหัสการจองไม่ถูกต้อง');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [data, settings] = await Promise.all([
                    getBookingById(Number(bookingId)),
                    fetchSystemSettings(),
                ]);
                setBooking(data);
                setSystemSettings(settings);
            } catch (err: any) {
                setError(err.message || 'ไม่สามารถโหลดข้อมูลการจองได้');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [bookingId]);

    // ── ดึงค่า systemSettings ที่ใช้ในหน้านี้ ────────────────────────────────
    const enforceDeposit = systemSettings?.enforce_deposit ?? true;
    const requireInsurance = systemSettings?.require_insurance ?? true;
    const enableCash = systemSettings?.enable_cash ?? false;
    const enableCreditCard = systemSettings?.enable_credit_card ?? false;
    const enableQrPromptpay = systemSettings?.enable_qr_promptpay ?? false;

    // ── ตัวเลขทั้งหมด (ต้องประกาศก่อน useEffect ด้านล่าง) ─────────────────
    const rentalAmount = Number(booking?.rental_amount ?? 0);
    const discountCoupon = Number(booking?.discount_coupon ?? 0);
    const discountPromo = Number(booking?.discount_promo ?? 0);
    const totalDiscount = Number(booking?.total_discount ?? (discountCoupon + discountPromo));
    const netRental = Number(booking?.booking_total_price ?? Math.max(0, rentalAmount - totalDiscount));
    const depositAmount = Number(booking?.deposit_amount ?? 0);

    // ✅ insuranceAmount ขึ้นกับ requireInsurance
    const insuranceAmount = requireInsurance ? Number(booking?.insurance_amount ?? 0) : 0;
    const remainingRental = Math.max(0, netRental - depositAmount);

    // ✅ ถ้า enforceDeposit = false หรือไม่มีค่ามัดจำ → บังคับ full
    useEffect(() => {
        if (!enforceDeposit || depositAmount <= 0) {
            setPaymentOption('full');
        }
    }, [systemSettings, booking]);

    // ✅ ถ้าวิธีชำระที่เลือกอยู่ถูกปิด → reset ไปวิธีที่เปิดอยู่
    useEffect(() => {
        const availableMethods: UIPaymentMethod[] = [];

        if (enableQrPromptpay) availableMethods.push('promptpay');
        if (enableCreditCard) availableMethods.push('credit');
        if (enableCash) availableMethods.push('cash');

        if (!availableMethods.includes(paymentMethod)) {
            setPaymentMethod(availableMethods[0] ?? 'promptpay');
        }
    }, [systemSettings]);

    // ยอดที่ต้องจ่ายตามตัวเลือก
    const currentAmount =
        paymentOption === 'deposit'
            ? depositAmount
            : netRental + insuranceAmount; // ✅ insuranceAmount = 0 ถ้า requireInsurance = false

    const hasAnyMethod =
        enableCash || enableCreditCard || enableQrPromptpay;

    if (!hasAnyMethod) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>ยังไม่สามารถชำระเงินได้</CardTitle>
                </CardHeader>
                <CardContent>
                    ระบบยังไม่ได้เปิดใช้งานวิธีการชำระเงิน
                </CardContent>
            </Card>
        );
    }

    const handlePayment = async () => {
        if (!booking) return;

        setIsProcessing(true);
        setError(null);

        try {
            const paymentMethodMap: Record<UIPaymentMethod, 'qr' | 'credit_card' | 'cash'> = {
                promptpay: 'qr',
                cash: 'cash',
                credit: 'credit_card',
            };

            const backendMethod = paymentMethodMap[paymentMethod];
            const now = new Date().toISOString();

            if (paymentOption === 'deposit') {
                const payload: PaymentCreateData = {
                    booking_id: booking.booking_id,
                    payment_amount: depositAmount,
                    payment_method: backendMethod,
                    payment_type: 'deposit',
                    payment_status: 'paid',
                    paid_at: now,
                    payment_note: '',
                };
                await postPayment(payload);
                await updateBookingStatus(booking.booking_id, 'pending_balance');
            } else {
                const payloads: PaymentCreateData[] = [];

                if (depositAmount > 0) {
                    payloads.push({
                        booking_id: booking.booking_id,
                        payment_amount: depositAmount,
                        payment_method: backendMethod,
                        payment_type: 'deposit',
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    });
                }

                if (remainingRental > 0) {
                    payloads.push({
                        booking_id: booking.booking_id,
                        payment_amount: remainingRental,
                        payment_method: backendMethod,
                        payment_type: depositAmount > 0 ? 'remaining' : 'full',
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    });
                } else if (depositAmount === 0 && netRental > 0) {
                    payloads.push({
                        booking_id: booking.booking_id,
                        payment_amount: netRental,
                        payment_method: backendMethod,
                        payment_type: 'full',
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    });
                }

                // ✅ บันทึก insurance เฉพาะถ้า requireInsurance = true
                if (requireInsurance && insuranceAmount > 0) {
                    payloads.push({
                        booking_id: booking.booking_id,
                        payment_amount: insuranceAmount,
                        payment_method: backendMethod,
                        payment_type: 'insurance',
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    });
                }

                for (const p of payloads) {
                    await postPayment(p);
                }

                await updateBookingStatus(booking.booking_id, 'confirmed');
            }

            setPaymentSuccess(true);
        } catch (err: any) {
            setError(err.message || 'การชำระเงินล้มเหลว');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="ml-4 text-lg">กำลังโหลดข้อมูลการจอง...</p>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center border-destructive">
                    <CardHeader>
                        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-xl text-destructive">
                            {error || 'ไม่พบข้อมูลการจอง'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">รหัสการจอง: {bookingId}</p>
                        <Button asChild>
                            <a href="/admin/booking_overview">กลับไปหน้าการจอง</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <CardTitle className="text-2xl">ชำระเงินสำเร็จ!</CardTitle>
                        <CardDescription className="mt-4">
                            {paymentOption === 'deposit'
                                ? 'ชำระมัดจำเรียบร้อย กรุณาชำระส่วนที่เหลือ' +
                                (requireInsurance ? ' (รวมเงินประกัน)' : '') +
                                ' ตอนรับรถ'
                                : 'ชำระครบถ้วน' +
                                (requireInsurance ? 'ทั้งค่าเช่าและเงินประกัน' : 'ค่าเช่าทั้งหมด') +
                                ' การจองเสร็จสมบูรณ์'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-lg font-medium">หมายเลขการจอง: {booking.booking_id}</div>
                        <Button size="lg" className="w-full" asChild>
                            <a href="/admin/booking_overview">กลับไปหน้าการจองทั้งหมด</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const days = differenceInDays(
        new Date(booking.booking_end_date || booking.expected_return_datetime || Date.now()),
        new Date(booking.booking_start_date || booking.pickup_datetime || Date.now())
    ) + 1;

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    ชำระเงินการจอง #{booking.booking_id}
                </h1>
                <p className="text-muted-foreground mb-8">
                    วันที่สร้าง: {safeFormatDate(booking.created_at_booking)}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* สรุปการจอง */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                สรุปการเช่ารถ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-20 bg-muted rounded flex items-center justify-center text-3xl font-bold text-muted-foreground">
                                    {booking.car_brand?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {booking.car_brand || 'ไม่ระบุยี่ห้อ'} {booking.car_model || 'ไม่ระบุรุ่น'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        ทะเบียน {booking.car_license_plate || '—'} • ปี {booking.car_year || '—'} • สี {booking.car_color || '—'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <Label className="text-muted-foreground">รับรถ</Label>
                                    <p className="font-medium">{safeFormatDate(booking.pickup_datetime || booking.booking_start_date)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">คืนรถ</Label>
                                    <p className="font-medium">{safeFormatDate(booking.expected_return_datetime || booking.booking_end_date)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">ระยะเวลา</Label>
                                    <p className="font-medium">{days} วัน</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">สถานะ</Label>
                                    <p className="font-medium capitalize">{booking.booking_status || 'pending'}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">ผู้เช่า</Label>
                                <p className="font-medium">{booking.contact_name || 'ไม่ระบุ'}</p>
                                <p className="text-sm text-muted-foreground">{booking.contact_phone || 'ไม่ระบุ'}</p>
                            </div>

                            {totalDiscount > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        ส่วนลดที่ได้รับ
                                    </p>
                                    {discountPromo > 0 && (
                                        <div className="flex justify-between text-sm text-blue-700 dark:text-blue-400">
                                            <span>ส่วนลดโปรโมชัน</span>
                                            <span>-฿{discountPromo.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {discountCoupon > 0 && (
                                        <div className="flex justify-between text-sm text-blue-700 dark:text-blue-400">
                                            <span>
                                                ส่วนลดคูปอง
                                                {booking.coupon_code && (
                                                    <span className="ml-1 text-xs opacity-70">({booking.coupon_code})</span>
                                                )}
                                            </span>
                                            <span>-฿{discountCoupon.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm font-semibold text-blue-800 dark:text-blue-300 border-t border-blue-200 dark:border-blue-700 pt-2">
                                        <span>ส่วนลดรวม</span>
                                        <span>-฿{totalDiscount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ส่วนชำระเงิน */}
                    <Card className="h-fit lg:sticky lg:top-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                ชำระเงิน
                            </CardTitle>
                            <CardDescription>
                                {enforceDeposit && depositAmount > 0
                                    ? 'เลือกชำระมัดจำหรือเต็มจำนวน'
                                    : 'ชำระเต็มจำนวน'}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* ✅ ตัวเลือกประเภทการชำระ: แสดง deposit เฉพาะถ้า enforceDeposit = true และมีค่ามัดจำ */}
                            <div className="space-y-4">
                                <Label className="text-lg font-medium">ประเภทการชำระ</Label>
                                <RadioGroup
                                    value={paymentOption}
                                    onValueChange={(v) => setPaymentOption(v as PaymentOption)}
                                    className="space-y-3"
                                >
                                    {enforceDeposit && depositAmount > 0 && (
                                        <div className={cn(
                                            'flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors',
                                            paymentOption === 'deposit' && 'border-primary bg-primary/5'
                                        )}>
                                            <RadioGroupItem value="deposit" id="deposit" />
                                            <Label htmlFor="deposit" className="flex flex-col flex-1 cursor-pointer">
                                                <span className="font-medium">ชำระมัดจำล่วงหน้า</span>
                                                <span className="text-sm text-muted-foreground">
                                                    ฿{depositAmount.toLocaleString()} (จองทันที)
                                                </span>
                                            </Label>
                                        </div>
                                    )}

                                    <div className={cn(
                                        'flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors',
                                        paymentOption === 'full' && 'border-primary bg-primary/5'
                                    )}>
                                        <RadioGroupItem value="full" id="full" />
                                        <Label htmlFor="full" className="flex flex-col flex-1 cursor-pointer">
                                            <span className="font-medium">ชำระเต็มจำนวน</span>
                                            <span className="text-sm text-muted-foreground">
                                                ฿{(netRental + insuranceAmount).toLocaleString()}
                                                {requireInsurance && insuranceAmount > 0 ? ' (รวมเงินประกัน)' : ''}
                                            </span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* ✅ สรุปยอดเงิน */}
                            <div className="space-y-3 text-sm bg-muted/40 p-4 rounded-lg">
                                <div className="flex justify-between">
                                    <span>ค่าเช่าก่อนส่วนลด</span>
                                    <span>฿{rentalAmount.toLocaleString()}</span>
                                </div>

                                {discountPromo > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            ส่วนลดโปรโมชัน
                                        </span>
                                        <span>-฿{discountPromo.toLocaleString()}</span>
                                    </div>
                                )}

                                {discountCoupon > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            ส่วนลดคูปอง
                                        </span>
                                        <span>-฿{discountCoupon.toLocaleString()}</span>
                                    </div>
                                )}

                                {totalDiscount > 0 && (
                                    <div className="flex justify-between font-medium border-t pt-2">
                                        <span>ค่าเช่าสุทธิ (หลังหักส่วนลด)</span>
                                        <span className="text-primary">฿{netRental.toLocaleString()}</span>
                                    </div>
                                )}

                                {/* ✅ แสดงมัดจำเฉพาะถ้า enforceDeposit = true */}
                                {enforceDeposit && depositAmount > 0 && (
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>หักค่ามัดจำล่วงหน้า</span>
                                        <span>-฿{depositAmount.toLocaleString()}</span>
                                    </div>
                                )}

                                <Separator />

                                {paymentOption === 'full' && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-primary">รายการที่จะบันทึกแยก:</p>
                                        {enforceDeposit && depositAmount > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span>มัดจำล่วงหน้า</span>
                                                <span>฿{depositAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xs">
                                            <span>{enforceDeposit && depositAmount > 0 ? 'ค่าเช่าที่เหลือ' : 'ค่าเช่าทั้งหมด'}</span>
                                            <span>฿{(enforceDeposit && depositAmount > 0 ? remainingRental : netRental).toLocaleString()}</span>
                                        </div>
                                        {/* ✅ แสดงเงินประกันเฉพาะถ้า requireInsurance = true */}
                                        {requireInsurance && insuranceAmount > 0 && (
                                            <div className="flex justify-between text-xs">
                                                <span>เงินประกันค้ำรถ</span>
                                                <span>฿{insuranceAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <Separator />
                                    </div>
                                )}

                                <div className="flex justify-between text-xl font-bold">
                                    <span>ยอดชำระตอนนี้</span>
                                    <span className="text-primary">฿{currentAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* ✅ วิธีชำระเงิน: แสดงเฉพาะที่ systemSettings เปิดไว้ */}
                            <div className="space-y-4">
                                <Label className="text-lg font-medium">วิธีการชำระเงิน</Label>
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={(v) => setPaymentMethod(v as UIPaymentMethod)}
                                    className="space-y-3"
                                >
                                    {enableQrPromptpay && (
                                        <div className={cn(
                                            'flex items-center space-x-3 border rounded-lg p-4 cursor-pointer',
                                            paymentMethod === 'promptpay' && 'border-primary bg-primary/5'
                                        )}>
                                            <RadioGroupItem value="promptpay" id="promptpay" />
                                            <Label htmlFor="promptpay" className="flex items-center gap-2 flex-1 cursor-pointer">
                                                <QrCode className="h-5 w-5" />
                                                PromptPay (QR Code)
                                            </Label>
                                        </div>
                                    )}

                                    {enableCreditCard && (
                                        <div className={cn(
                                            'flex items-center space-x-3 border rounded-lg p-4 cursor-pointer',
                                            paymentMethod === 'credit' && 'border-primary bg-primary/5'
                                        )}>
                                            <RadioGroupItem value="credit" id="credit" />
                                            <Label htmlFor="credit" className="flex items-center gap-2 flex-1 cursor-pointer">
                                                <CreditCard className="h-5 w-5" />
                                                บัตรเครดิต / เดบิต
                                            </Label>
                                        </div>
                                    )}

                                    {enableCash && (
                                        <div className={cn(
                                            'flex items-center space-x-3 border rounded-lg p-4 cursor-pointer',
                                            paymentMethod === 'cash' && 'border-primary bg-primary/5'
                                        )}>
                                            <RadioGroupItem value="cash" id="cash" />
                                            <Label htmlFor="cash" className="flex items-center gap-2 flex-1 cursor-pointer">
                                                <Banknote className="h-5 w-5" />
                                                โอนเงิน / ชำระที่สาขา
                                            </Label>
                                        </div>
                                    )}
                                </RadioGroup>

                                {paymentMethod === 'promptpay' && enableQrPromptpay && (
                                    <div className="text-center space-y-3 border-t pt-4">
                                        <div className="bg-white p-4 rounded-lg inline-block mx-auto shadow-sm">
                                            <div className="w-56 h-56 md:w-64 md:h-64 bg-gradient-to-br from-gray-50 to-gray-200 rounded-xl flex items-center justify-center text-gray-500 text-sm">
                                                [ QR PromptPay ฿{currentAmount.toLocaleString()} ]
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            สแกน QR ด้วยแอปธนาคาร • หมดอายุใน 15 นาที
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 pt-6 border-t">
                            {error && (
                                <p className="text-sm text-destructive flex items-center gap-1.5 w-full">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {error}
                                </p>
                            )}

                            <Button
                                size="lg"
                                className="w-full text-lg"
                                onClick={handlePayment}
                                disabled={isProcessing || currentAmount <= 0}
                            >
                                {isProcessing ? (
                                    'กำลังดำเนินการ...'
                                ) : (
                                    <>
                                        ชำระ {paymentOption === 'deposit' ? 'มัดจำ' : 'เต็มจำนวน'} ฿{currentAmount.toLocaleString()}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                การชำระเงินปลอดภัย • ไม่เก็บข้อมูลบัตรเครดิต
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}