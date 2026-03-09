"use client"

import React, { useState, useEffect } from 'react'
import { FaChevronRight, FaExclamationTriangle, FaCheck, FaHome, FaUser, FaMoneyBillWave } from 'react-icons/fa'
import { IoMdWallet } from "react-icons/io";
import { LuQrCode } from "react-icons/lu";
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import Goback from '@/components/goback'
import { postBooking } from "@/lib/services/client/admin/bookings/post";
import { postPayment } from "@/lib/services/client/admin/payments/post";
import type { PaymentCreateData } from '@/lib/services/client/admin/payments/post';
import { updateBookingStatus } from '@/lib/services/client/admin/bookings/patch';

type PaymentMethod = 'qr' | 'credit_card' | 'online' | ''
type PaymentType = 'deposit' | 'full'

export default function ProductPaymentPage() {
    const router = useRouter()
    const params = useParams();
    const carId = Number(
        Array.isArray(params.car_id) ? params.car_id[0] : params.car_id
    );

    const [bookingSummary, setBookingSummary] = useState<any>(null);

    // ── Payment state ──
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('')
    const [selectedBank, setSelectedBank] = useState('')
    const [selectedType, setSelectedType] = useState<PaymentType>('deposit')

    // ── Error state ──
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    // Confirm booking state
    const [isConfirming, setIsConfirming] = useState(false)
    const [confirmError, setConfirmError] = useState<string | null>(null)
    
    // ── Modal & flow state ──
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [isModal, setIsModal] = useState(false);

    const banks = [
        { id: "BBL", img: "/bbl.svg", bg: "bg-[#1e4598]" },
        { id: "KBANK", img: "/kbank.svg", bg: "bg-[#138f2d]" },
        { id: "KTB", img: "/ktb.svg", bg: "bg-[#1ba0e2]" },
        { id: "BAY", img: "/bay.svg", bg: "bg-[#fec43b]" },
        { id: "SCB", img: "/scb.svg", bg: "bg-[#4e2e7f]" },
    ]

    useEffect(() => {
        if (!carId || Number.isNaN(carId)) {
            setError("ไม่พบรหัสรถ");
            setLoading(false);
            return;
        }
        const savedSummary = localStorage.getItem("BookingSummary");
        if (savedSummary) {
            try {
                const parsed = JSON.parse(savedSummary);
                setBookingSummary(parsed);

                console.log("BookingSummary payment:", parsed);

            } catch (err) {
                console.error("ไม่สามารถ parse BookingSummary ได้:", err);
                setError("ข้อมูลการจองไม่ถูกต้อง กรุณาเริ่มใหม่");
            }
        } else {
            console.warn("ไม่พบ BookingSummary ใน localStorage");
        }
        setLoading(false);
    }, [carId])

    // deposit
    const rentalAmount = bookingSummary
        ? (bookingSummary.car_price_per_day ?? 0) * (bookingSummary.rentalDays ?? 0) //ค่าเช่าทั้งงวด
        : 0
    const depositAmount = Number(bookingSummary?.car_deposit ?? 0)                   //ค่ามัดจำ
    // full
    const insuranceFee = Number(bookingSummary?.car_insurance_fee ?? 0)              //เงินประกันค่ำรถ

    const bookingTotal = Number(bookingSummary?.booking_total_price ?? 0)            // ยอดรวมสุทธิ (หลังหักส่วนลด)
    const remaining_rent = bookingTotal - depositAmount                              // ค่าเช่าที่เหลือ
    const fullPayAmount = bookingTotal + insuranceFee                                //ยอดที่ต้องชำระสุทธิ
    const netAfterDeposit = bookingTotal - depositAmount                             //ยอดที่ต้องชำระสุทธิ
    const discountCoupon = Number(bookingSummary?.discount_coupon ?? 0)
    const discountPromo = Number(bookingSummary?.discount_promo ?? 0);
    const totalDiscount = Number(bookingSummary?.total_discount ?? 0);
    const nowPayAmount = selectedType === 'deposit' ? depositAmount : fullPayAmount

    const getActiveClass = (value: string) =>
        selectedPayment === value
            ? "shadow-md border-blue-600 text-blue-600 font-semibold"
            : "border-gray-300"

    const getBankActiveClass = (id: string) =>
        selectedBank === id ? "border-blue-600 scale-105 shadow-md" : "border-gray-300"

    const validatePayment = () => {
        const newErrors: typeof errors = {}
        if (!selectedPayment) {
            newErrors.payment = "กรุณาเลือกวิธีการชำระเงิน"
        }
        if (selectedPayment === 'online' && !selectedBank) {
            newErrors.bank = "กรุณาเลือกธนาคาร"
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleConfirmBooking = () => {
        if (!validatePayment()) return
        if (selectedPayment === 'online') {
            return
        }
        setShowConfirmModal(true)
        setTimeout(() => {
            setIsModal(true);
        }, 100);
    }
    const handleClose = () => {
        setIsModal(false);
        setTimeout(() => setShowConfirmModal(false), 300);
    }

    const handleFinalConfirm = async () => {
        if (!bookingSummary) {
            setConfirmError("ไม่พบข้อมูลการจอง กรุณาทำรายการใหม่")
            return
        }
        setIsConfirming(true)
        setConfirmError(null)

        try{
            const startDate = bookingSummary.pickupDate || null
            const endDate = bookingSummary.returnDate || null
            if (!startDate || !endDate) {
                console.warn("วันที่ไม่ครบถ้วน", {
                start: startDate,
                end: endDate,
                availableKeys: Object.keys(bookingSummary),
                })

                setConfirmError(
                "ไม่พบข้อมูลวันที่เริ่มต้นหรือสิ้นสุดการเช่า กรุณากลับไปเลือกวันเวลาใหม่อีกครั้ง"
                )
                setIsConfirming(false)
                return
            }
            
            let totalPaid: number = 0;
            let remainingAmount: number = 0;
            if (selectedType === 'deposit') {
                totalPaid = depositAmount
                remainingAmount = fullPayAmount - depositAmount
            } else {
                totalPaid = fullPayAmount
                remainingAmount = 0
            }
            const bookingData = {
                car_id: carId,                            //รถที่จอง
                booking_start_date: startDate,            //วันที่เริ่มจอง
                booking_end_date: endDate,               //วันที่สิ้นสุดจอง
                pickup_datetime: startDate,              // วันเวลาจริงที่รับรถ
                expected_return_datetime: endDate,       // วันเวลาที่ควรคืนรถ

                rental_amount: Number(
                bookingSummary.rental_amount ||
                (bookingSummary.car_price_per_day * bookingSummary.rentalDays) ||
                0
                ),                                        //ค่าเช่ารถทั้งงวด (ก่อนส่วนลด)
                discount_coupon: Number(bookingSummary.discount_coupon || 0),                          // ส่วนลดจากคูปอง
                discount_promo: discountPromo,                                                        // ส่วนลดจากโปรโมชั่น
                total_discount: totalDiscount,                                                      //รวมส่วนลดทั้งหมด

                booking_total_price: Number(bookingSummary.booking_total_price || 0),                  //ยอดรวมสุทธิ (หลังหักส่วนลด)
                total_paid:totalPaid,                           // จ่ายไปแล้วทั้งหมด
                remaining_amount:remainingAmount,                                                     // ยอดที่ยังต้องจ่าย
                deposit_amount: Number(bookingSummary.car_deposit || 0),                               // เงินมัดจำตอนจอง
                insurance_amount: Number(bookingSummary.car_insurance_fee || 0),                       // เงินประกันความเสียหาย

                coupon_id: bookingSummary.coupon_id || null,     //คูปองที่ใช้
                promo_id: bookingSummary.appliedPromotions?.[0]?.promo_id || null,      //โปรโมชั่นที่ใช้

                booking_status: 'pending' as const,    //สถานะการจอง

                contact_name: `${bookingSummary.firstName || ''} ${bookingSummary.lastName || ''}`.trim(),   // ชื่อผู้ติดต่อ
                contact_email: bookingSummary.email || bookingSummary.contact_email || '',                   // อีเมลผู้ติดต่อ
                contact_phone: bookingSummary.phone || bookingSummary.contact_phone || '',                   // เบอร์ติดต่อ
                special_request: null,            // คำขอพิเศษจากลูกค้า
                internal_note:   null,           // หมายเหตุภายใน (พนักงานเห็นเท่านั้น)
            };
            const bookingResponse = await postBooking(bookingData)
            const newBookingId = bookingResponse?.booking_id

            if (!newBookingId) {
                throw new Error("ไม่ได้รับ booking_id จากเซิร์ฟเวอร์")
            }
            const now = new Date().toISOString()
            const rentalTotal = Number(bookingSummary.booking_total_price || 0)
            const deposit = Number(bookingSummary.car_deposit || 0)
            const insurance = Number(bookingSummary.car_insurance_fee || 0)
            const remaining = rentalTotal - deposit

            let paymentMethod: 'qr' | 'credit_card' | 'cash';
            if (selectedPayment === 'qr') {
                paymentMethod = 'qr';
            } else if (selectedPayment === 'credit_card') {
                paymentMethod = 'credit_card';
            } else {
                paymentMethod = 'qr';
            }


            if (selectedType === 'deposit') {
                if (deposit > 0) {
                    const payload: PaymentCreateData = {
                        booking_id: newBookingId,
                        payment_amount: deposit,
                        payment_method: paymentMethod,
                        payment_type: 'deposit',      
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    };
                    await postPayment(payload);
                    await updateBookingStatus(newBookingId, 'pending_balance');
                    console.log("Payment created successfully:", payload);
                }
            }else{
                const payloads: PaymentCreateData[] = [];
                if (deposit > 0) {
                     payloads.push({
                        booking_id: newBookingId,
                        payment_amount: deposit,
                        payment_method: paymentMethod,
                        payment_type: 'deposit',
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    })
                }
                if(remaining > 0){
                    payloads.push({
                        booking_id: newBookingId,
                        payment_amount: remaining,
                        payment_method: paymentMethod,
                        payment_type: deposit > 0 ? 'remaining' : 'full',
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    })
                }else if (deposit === 0 && rentalTotal > 0){
                    payloads.push({
                        booking_id: newBookingId,
                        payment_amount: rentalTotal,
                        payment_method: paymentMethod,
                        payment_type: 'full',
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    })
                }

                if(insurance > 0) {
                    payloads.push({
                        booking_id: newBookingId,
                        payment_amount: insurance,
                        payment_method: paymentMethod,
                        payment_type: 'insurance',
                        payment_status: 'paid',
                        paid_at: now,
                        payment_note: '',
                    })
                }
                for (const p of payloads){
                    await postPayment(p);
                }
                await updateBookingStatus(newBookingId, 'confirmed');
                console.log("Payment created successfully:", { newBookingId, payloads });
            }
            console.log("Booking created successfully:", bookingResponse);
            localStorage.removeItem('BookingSummary')
            localStorage.removeItem('SearchData')
            localStorage.removeItem("SearchPerformed");
            setIsModal(false);
            setTimeout(() => {
                setShowConfirmModal(false);
                setShowSuccessModal(true);
                setTimeout(() => setIsModal(true), 100)
            }, 300)
        }catch(err: any){
            console.error("Create booking failed:", err)
            setConfirmError(
                err.message ||
                "เกิดข้อผิดพลาดในการบันทึกการจอง กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ"
            )
        }finally{
            setIsConfirming(false)
        }
        setIsModal(false);
        setTimeout(() => {
            setShowConfirmModal(false);
            setShowSuccessModal(true);
            setTimeout(() => setIsModal(true), 100)
        }, 300)
    }

    useEffect(() => {
        if (showSuccessModal) {
            const timeout = setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [showSuccessModal])
    if (loading) {
         return (
        <div className="container mx-auto px-4 sm:px-6 py-10">
            <div className="text-center py-20">
            กำลังโหลดข้อมูล...
            </div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="container mx-auto px-4 sm:px-6 py-10">
            <div className="text-center py-20">
            {error}
            </div>
        </div>
        );
    }

    return (
        <div className='min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8'>
            <div className='w-full max-w-4xl bg-(--white) rounded-2xl shadow-xl overflow-hidden'>
                {/* <Goback title='จองรถเช่า' /> */}
                <div className='flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100'>
                    {/* left */}
                    <div className='flex-1 px-5 sm:px-8 py-6'>
                        <h2 className='text-base sm:text-lg lg:text-xl font-semibold'>
                            ชำระเงิน
                        </h2>
                        <p className='text-sm mb-5'>เลือกชำระมัดจำหรือเต็มจำนวน</p>
                        <p className='text-sm font-semibold mb-3'>ประเภทการชำระ</p>
                        {/* deposit */}
                        <div onClick={() => setSelectedType('deposit')}
                            className={`border rounded-xl px-4 py-3.5 mb-3 cursor-pointer transition-all duration-200
                                ${selectedType === 'deposit' ? 'border-(--blue-primary) shadow-sm' : 'border-gray-200 hover:border-(--blue-primary)'}`}
                        >
                            <div className='flex items-start gap-3'>
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
                                    ${selectedType === 'deposit' ? 'border-(--blue-primary)' : 'border-gray-300'}`}>
                                    {selectedType === 'deposit' && <div className='w-2 h-2 rounded-full bg-(--blue-primary)' />}
                                </div>
                                <div>
                                    <p className='text-sm font-semibold'>ชำระมัดจำล่วงหน้า</p>
                                    <p className='text-sm'>฿{depositAmount.toLocaleString('th-TH')} (จองทันที)</p>
                                </div>
                            </div>
                        </div>
                        {/* full */}
                        <div onClick={() => setSelectedType('full')}
                            className={`border rounded-xl px-4 py-3.5 mb-5 cursor-pointer transition-all duration-200
                                ${selectedType === 'full' ? 'border-(--blue-primary) shadow-sm' : 'border-gray-200 hover:border-(--blue-primary)'}`}
                        >
                            <div className='flex items-start gap-3'>
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
                                    ${selectedType === 'full' ? 'border-(--blue-primary)' : 'border-gray-300'}`}>
                                    {selectedType === 'full' && <div className='w-2 h-2 rounded-full bg-(--blue-primary)' />}
                                </div>
                                <div>
                                    <p className='text-sm font-semibold'>ชำระเต็มจำนวน</p>
                                    <p className='text-sm'>฿{fullPayAmount.toLocaleString('th-TH')} (รวมเงินประกัน)</p>
                                </div>
                            </div>
                        </div>
                        {/* summary */}
                        <div className="border-t pt-5 space-y-3">
                            {selectedType === 'deposit' && (
                                <>
                                <div className="flex justify-between items-center text-sm">
                                    <span>ค่าเช่าก่อนส่วนลด</span>
                                    <span className="font-medium">฿{rentalAmount.toLocaleString('th-TH')}</span>
                                </div>
                                {bookingSummary.appliedPromotions?.length > 0 && (
                                    <div className="text-sm">
                                        <p className="font-semibold text-(--blue-primary) mb-1">ส่วนลดโปรโมชั่น</p>
                                        {bookingSummary.appliedPromotions.map((promo: any, index: number) => (
                                            <div key={index} className="flex justify-between text-(--blue-primary)">
                                                <span>{promo.displayText || promo.promo_code || `โปรโมชั่น #${promo.promo_id}`}</span>
                                                <span>-฿{Number(promo.discount_amount || 0).toLocaleString('th-TH')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {discountCoupon > 0 && (
                                    <div className="flex justify-between items-center text-sm text-(--blue-primary)">
                                        <span>ส่วนลดจากคูปอง</span>
                                        <span className="font-medium">-฿{discountCoupon.toLocaleString('th-TH')}</span>
                                    </div>
                                )}
                                <div className='border-t pt-3 space-y-2'>
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <span>ค่าเช่าสุทธิ (หลังหักส่วนลด)</span>
                                        <span className="font-medium">฿{bookingTotal.toLocaleString('th-TH')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span>หักค่ามัดจำล่วงหน้า</span>
                                        <span className="font-medium">-฿{depositAmount.toLocaleString('th-TH')}</span>
                                    </div>
                                </div>
                                </>
                            )}
                            {selectedType === 'full' && (
                                <>
                                <div className="flex justify-between items-center text-sm">
                                    <span>ค่าเช่าก่อนส่วนลด</span>
                                    <span className="font-medium">฿{rentalAmount.toLocaleString('th-TH')}</span>
                                </div>
                                {bookingSummary.appliedPromotions?.length > 0 && (
                                    <div className="text-sm">
                                        <p className="font-semibold text-(--blue-primary) mb-1">ส่วนลดโปรโมชั่น</p>
                                        {bookingSummary.appliedPromotions.map((promo: any, index: number) => (
                                            <div key={index} className="flex justify-between text-(--blue-primary)">
                                                <span>{promo.displayText || promo.promo_code || `โปรโมชั่น #${promo.promo_id}`}</span>
                                                <span>-฿{Number(promo.discount_amount || 0).toLocaleString('th-TH')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {discountCoupon > 0 && (
                                    <div className="flex justify-between items-center text-sm text-(--blue-primary)">
                                        <span>ส่วนลดจากคูปอง</span>
                                        <span className="font-medium">-฿{discountCoupon.toLocaleString('th-TH')}</span>
                                    </div>
                                )}
                                <div className='border-t pt-3 space-y-2'>
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <span>ค่าเช่าสุทธิ (หลังหักส่วนลด)</span>
                                        <span className="font-medium">฿{bookingTotal.toLocaleString('th-TH')}</span>
                                    </div>
                                </div>
                                <div className='border-t pt-3 space-y-2'>
                                    <div className="flex justify-between items-center text-sm">
                                        <span>ค่ามัดจำล่วงหน้า</span>
                                        <span className="font-medium">฿{depositAmount.toLocaleString('th-TH')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span>ค่าเช่าที่เหลือ</span>
                                        <span className="font-medium">฿{remaining_rent.toLocaleString('th-TH')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span>เงินประกันค้ำรถ</span>
                                        <span className="font-medium">฿{insuranceFee.toLocaleString('th-TH')}</span>
                                    </div>
                                </div>
                                </>
                            )}
                        </div>

                        {/* Total */}
                        <div className="mt-5 flex justify-between items-center bg-(--blue-primary) text-(--white) rounded-xl px-5 py-4">
                            <span className="text-lg font-semibold">ยอดชำระตอนนี้</span>
                            <span className="text-xl font-extrabold">฿{nowPayAmount.toLocaleString('th-TH')}</span>
                        </div>
                    </div>
                    {/* right */}
                    <div className='flex-1 px-5 sm:px-8 py-6 flex flex-col'>
                        <h2 className='text-base sm:text-lg lg:text-xl font-semibold mb-4'>
                            เลือกวิธีการชำระเงิน
                        </h2>
                        {errors.payment && <p className='text-red-500 text-xs sm:text-sm mb-4'>{errors.payment}</p>}
                         {/* ตัวเลือกชำระเงิน */}
                        <div className='space-y-3 flex-1'>
                            {/* qr */}
                            <div
                                onClick={() => { 
                                    setSelectedPayment('qr')
                                    setSelectedBank('')
                                    setErrors(prev => ({ ...prev, payment: '', bank: '' }))
                                }}
                                className={`border rounded-md py-3 px-4 sm:p-4 flex items-center gap-4 cursor-pointer transition ${getActiveClass('qr')}`}
                            >
                                <LuQrCode className='text-2xl shrink-0' />
                                <span className='text-sm'>PromptPay (QR Code)</span>
                            </div>
                            {/* credit_card */}
                            <div
                                onClick={() => { 
                                    setSelectedPayment('credit_card')
                                    setSelectedBank('')
                                    setErrors(prev => ({ ...prev, payment: '', bank: '' }))
                                }}
                                className={`border rounded-md py-3 px-4 sm:p-4 flex items-center justify-between cursor-pointer transition ${getActiveClass('credit_card')}`}
                            >
                                <div className='flex items-center gap-3'>
                                    <Image
                                        src="/card.png"
                                        alt="credit_card"
                                        width={24}
                                        height={24}
                                        className='shrink-0'
                                    />
                                    <span className="text-sm">Credit Card</span>
                                </div>
                                <FaChevronRight className='text-xs'/>
                            </div>
                            {/* banking */}
                            <div className={`border rounded-md p-4 ${getActiveClass('online')}`}>
                                <p className='text-sm font-semibold mb-3'>ออนไลน์แบงค์กิ้ง</p>
                                <div className='grid grid-cols-5 gap-2'>
                                    {banks.map(bank => (
                                        <div
                                            key={bank.id}
                                            onClick={() => {
                                                setSelectedPayment('online')
                                                setSelectedBank(bank.id)
                                                setErrors(prev => ({ ...prev, payment: '', bank: '' }))
                                            }}
                                            className={`border rounded-md p-2 flex justify-center cursor-pointer transition ${getBankActiveClass(bank.id)}`}
                                        >
                                            <Image src={bank.img} alt={bank.id} width={36} height={36} className={`w-9 h-9 sm:w-10 sm:h-10 p-1.5 rounded-md ${bank.bg}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ปุ่มยืนยัน */}
                        <div className='mt-5 flex justify-end text-sm sm:text-base'>
                            <button
                                onClick={handleConfirmBooking}
                                className='w-full sm:w-auto px-10 py-3 bg-(--blue-primary) text-(--white) rounded-lg cursor-pointer hover:bg-blue-700'
                            >
                                ยืนยันการจอง
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal Confirm ── */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className={`fixed inset-0 bg-(--gray-dark) transition-opacity duration-300 ${isModal ? 'opacity-50' : 'opacity-0'}`}
                            onClick={handleClose}
                        ></div>  
                        <div className={`relative transform overflow-hidden rounded-lg bg-(--white) text-left shadow-xl transition-all duration-300 w-full sm:my-8 sm:max-w-lg max-h-[90vh] overflow-y-auto ${
                            isModal
                                ? 'opacity-100 translate-y-0 scale-100'
                                : 'opacity-0 translate-y-4 scale-95'
                            }`}>
                            <div className="bg-(--white) px-4 sm:px-6 pt-5 sm:pt-6">
                                <div className="flex flex-col">
                                    {/* header */}
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="rounded-full p-2.5 sm:p-3 bg-blue-100">
                                            <FaExclamationTriangle className="text-2xl sm:text-3xl text-(--blue-primary)" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-center mb-4">ยืนยันการชำระเงิน</h3>

                                    {/* QR (เฉพาะ PromptPay) */}
                                    {selectedPayment === 'qr' && (
                                        <div className="flex flex-col items-center gap-2 mb-4">
                                            <div className="bg-(--white) rounded-xl p-3 shadow-sm border">
                                                <div className="w-37.5 h-37.5 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center gap-2">
                                                    <LuQrCode className="text-(--blue-primary) text-5xl" />
                                                    <span className="text-[10px] text-center leading-tight px-2">
                                                        {selectedType === 'deposit' ? (
                                                            <>ชำระมัดจำล่วงหน้า<br />฿{nowPayAmount.toLocaleString('th-TH')}</>
                                                        ) : (
                                                            <>ชำระเต็มจำนวน<br />฿{nowPayAmount.toLocaleString('th-TH')}</>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <LuQrCode className="text-(--blue-primary) text-sm" />
                                                <span className="font-semibold text-(--blue-primary) text-xs">PromptPay (QR Code)</span>
                                            </div>
                                            <p className="text-[11px] text-center">สแกน QR ด้วยแอปธนาคาร · หมดอายุใน 15 นาที</p>
                                        </div>
                                    )}
                                    {/* customer details */}
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                                        <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                                            <FaUser className="text-(--blue-primary) text-sm sm:text-base" />
                                            ข้อมูลผู้ขับรถ
                                        </h4>
                                        <div className="space-y-2 text-xs sm:text-sm">
                                            <div className="flex flex-row justify-between gap-1 sm:gap-2">
                                                <span>ชื่อ-นามสกุล :</span>
                                                <span className="font-medium">{bookingSummary.firstName} {bookingSummary.lastName}</span>
                                            </div>
                                            <div className="flex flex-row justify-between gap-1 sm:gap-2">
                                                <span> อีเมล :</span>
                                                <span className="font-medium">{bookingSummary.email}</span>
                                            </div>
                                            <div className="flex flex-row justify-between gap-1 sm:gap-2">
                                                <span> เบอร์โทร :</span>
                                                <span className="font-medium">{bookingSummary.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* payment details */}
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                                        <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                                            <FaMoneyBillWave className="text-(--blue-primary) text-sm sm:text-base" />
                                            รายละเอียดค่าใช้จ่าย
                                        </h4>
                                        <div className="space-y-2 text-xs sm:text-sm">
                                            <div className="flex justify-between gap-2">
                                                <span>ค่าเช่ารถ :</span>
                                                <span className="font-semibold whitespace-nowrap">฿{bookingSummary.car_price_per_day.toLocaleString('th-TH') || 0} บาท/วัน</span>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <span>จำนวนวันเช่า :</span>
                                                <span className="font-semibold whitespace-nowrap">{bookingSummary.rentalDays || 0} วัน</span>
                                            </div>
                                            {selectedType === 'deposit' && (
                                                <>
                                               <div className='space-y-2 border-t pt-2'>
                                                 <div className="flex justify-between gap-2">
                                                    <span>ค่าเช่าก่อนส่วนลด :</span>
                                                    <span className="font-semibold whitespace-nowrap"> ฿{rentalAmount.toLocaleString('th-TH')} บาท</span>
                                                </div>
                                                {bookingSummary.appliedPromotions?.length > 0 && (
                                                    <div className="text-sm">
                                                        <p className="font-semibold mb-1">ส่วนลดโปรโมชั่น</p>
                                                        {bookingSummary.appliedPromotions.map((promo: any, index: number) => (
                                                            <div key={index} className="flex justify-between">
                                                                <span>{promo.displayText || promo.promo_code || `โปรโมชั่น #${promo.promo_id}`} :</span>
                                                                <span className='font-semibold text-(--blue-primary)'>-฿{Number(promo.discount_amount || 0).toLocaleString('th-TH')} บาท</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {discountCoupon > 0 && (
                                                    <div className='flex justify-between gap-2 text'>
                                                        <span>ส่วนลดคูปอง :{bookingSummary?.discountPercentage ? ` (${bookingSummary.discountPercentage}%)` : ''}</span>
                                                        <span className='font-semibold whitespace-nowrap text-(--blue-primary)'>−฿{bookingSummary?.discount_coupon?.toLocaleString('th-TH')} บาท</span>
                                                    </div>
                                                )}
                                               </div>
                                               <div className="flex justify-between gap-2">
                                                    <span className='font-semibold'>ค่าเช่าสุทธิ (หลังหักส่วนลด) :</span>
                                                    <span className="font-semibold whitespace-nowrap"> ฿{bookingTotal.toLocaleString('th-TH')} บาท</span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <span>หักค่ามัดจำล่วงหน้า :</span>
                                                    <span className="font-semibold whitespace-nowrap"> -฿{depositAmount.toLocaleString('th-TH')} บาท</span>
                                                </div>
                                                </>
                                            )}
                                            {selectedType === 'full' && (
                                                <>
                                                <div className='space-y-2 border-t pt-2'>
                                                 <div className="flex justify-between gap-2">
                                                    <span>ค่าเช่าก่อนส่วนลด :</span>
                                                    <span className="font-semibold whitespace-nowrap"> ฿{rentalAmount.toLocaleString('th-TH')} บาท</span>
                                                </div>
                                                {bookingSummary.appliedPromotions?.length > 0 && (
                                                    <div className="text-sm">
                                                        <p className="font-semibold mb-1">ส่วนลดโปรโมชั่น</p>
                                                        {bookingSummary.appliedPromotions.map((promo: any, index: number) => (
                                                            <div key={index} className="flex justify-between">
                                                                <span>{promo.displayText || promo.promo_code || `โปรโมชั่น #${promo.promo_id}`} :</span>
                                                                <span className='font-semibold text-(--blue-primary)'>-฿{Number(promo.discount_amount || 0).toLocaleString('th-TH')} บาท</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {discountCoupon > 0 && (
                                                    <div className='flex justify-between gap-2 text'>
                                                        <span>ส่วนลดคูปอง :{bookingSummary?.discountPercentage ? ` (${bookingSummary.discountPercentage}%)` : ''}</span>
                                                        <span className='font-semibold whitespace-nowrap text-(--blue-primary)'>−฿{bookingSummary?.discount_coupon?.toLocaleString('th-TH')} บาท</span>
                                                    </div>
                                                )}
                                               </div>
                                               <div className="flex justify-between gap-2">
                                                    <span className='font-semibold'>ค่าเช่าสุทธิ (หลังหักส่วนลด) :</span>
                                                    <span className="font-semibold whitespace-nowrap"> ฿{bookingTotal.toLocaleString('th-TH')} บาท</span>
                                                </div>
                                                <div className='space-y-2 border-t pt-2'>
                                                    <div className="flex justify-between gap-2">
                                                        <span>ค่ามัดจำล่วงหน้า :</span>
                                                        <span className="font-semibold whitespace-nowrap"> ฿{depositAmount.toLocaleString('th-TH')} บาท</span>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <span>ค่าเช่าที่เหลือ :</span>
                                                        <span className="font-semibold whitespace-nowrap"> ฿{remaining_rent.toLocaleString('th-TH')} บาท</span>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <span>เงินประกันค้ำรถ :</span>
                                                        <span className="font-semibold whitespace-nowrap"> ฿{insuranceFee.toLocaleString('th-TH')} บาท</span>
                                                    </div>
                                                </div>
                                                </>
                                            )}
                                            <div className='border-t pt-2 mt-2'>
                                                <div className="flex justify-between gap-2 text-lg">
                                                    <span className="font-semibold">ยอดชำระตอนนี้ :</span>
                                                    <span className="font-semibold text-(--green-primary) whitespace-nowrap">฿{nowPayAmount.toLocaleString('th-TH')} บาท</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* pay method */}
                                    <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                                        <div className="flex flex-row items-center justify-between gap-2">
                                            <span className="text-xs sm:text-sm">วิธีการชำระเงิน :</span>
                                            <div className="flex items-center gap-2">
                                                 {selectedPayment === 'qr' ? (
                                                    <>
                                                    <span className="font-semibold text-(--blue-primary) text-sm sm:text-base">PromptPay (QR Code)</span>
                                                    </>
                                                 ) : (
                                                    <>
                                                    <span className="font-semibold text-(--blue-primary) text-sm sm:text-base">Credit Card</span>
                                                    </>
                                                 )}

                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center text-xs sm:text-sm mb-2 sm:mb-4 px-2">
                                        กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนทำการยืนยัน
                                    </div>
                                </div>
                            </div>
                            {/* Buttons */}
                            <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-col-reverse sm:flex-row sm:justify-center gap-2 sm:gap-3">
                                <button type="button" onClick={handleClose}
                                    className="inline-flex w-full sm:w-32 md:w-40 justify-center items-center rounded-md px-4 py-2.5 sm:py-2.5 text-sm shadow-sm bg-gray-200  hover:bg-gray-300 cursor-pointer transition-all">
                                    ยกเลิก
                                </button>
                                <button type="button" onClick={handleFinalConfirm}
                                    className="inline-flex w-full sm:w-32 md:w-40 justify-center items-center rounded-md bg-(--blue-primary) px-4 py-2.5 sm:py-2.5 text-sm text-(--white) shadow-sm hover:bg-blue-700 cursor-pointer transition-all">
                                    ยืนยัน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Success ── */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50">
                    <div className="fixed inset-0 flex min-h-screen sm:items-center sm:justify-center sm:p-4">
                        <div className={`fixed inset-0 bg-(--gray-dark) sm:transition-opacity sm:duration-300 opacity-50 ${
                                isModal ? 'sm:opacity-50' : 'sm:opacity-0'}`}
                        ></div>
                        <div className={`relative w-full h-full sm:h-auto sm:w-auto sm:rounded-lg bg-(--white) shadow-xl sm:transition-all sm:duration-300 sm:max-w-md md:max-w-lg ${
                            isModal ? 'sm:opacity-100 sm:translate-y-0 sm:scale-100' : 'sm:opacity-0 sm:translate-y-4 sm:scale-95'}`}>
                            <div className="bg-(--white) h-full sm:h-auto flex items-center justify-center sm:rounded-2xl px-6 sm:px-6 md:px-8 py-6 sm:py-8">
                                <div className="flex flex-col justify-center items-center gap-8 sm:gap-8 w-full max-w-sm">
                                    <div className="text-(--blue-primary) border-[6px] sm:border-8 border-(--blue-primary) p-8 sm:p-6 rounded-full shadow-lg">
                                        <FaCheck className="text-7xl sm:text-6xl md:text-7xl" />
                                    </div>
                                    <div className="flex flex-col justify-center items-center gap-3 sm:gap-3 px-2">
                                        <p className="text-(--blue-primary) text-xl sm:text-xl md:text-2xl font-semibold text-center">
                                            ยืนยันการจองรถสำเร็จ
                                        </p>
                                        <p className="text-sm sm:text-base text-center max-w-md leading-relaxed">
                                            กรุณาดูหน้า "การจอง" เพื่อตรวจสอบวันเวลานัดหมาย
                                        </p>
                                    </div>
                                    <div className="flex flex-col justify-center items-center gap-3 sm:gap-3 mt-12 sm:mt-4 w-full sm:w-auto">
                                        <button onClick={() => {router.push('/'); router.refresh();}} 
                                            className="flex items-center justify-center gap-2 bg-(--blue-primary) text-(--white) rounded-full py-3 sm:py-3 px-12 sm:px-12 shadow-md cursor-pointer hover:bg-blue-700 transition-all w-auto text-base">
                                            <FaHome className="text-xl sm:text-xl" />
                                            <span className="font-semibold text-base sm:text-base">กลับหน้าแรก</span>
                                        </button>
                                        <p className="text-xs sm:text-sm text-cente">ระบบจะกลับหน้าแรก อัตโนมัติ (3s)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}