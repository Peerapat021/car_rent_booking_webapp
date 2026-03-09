"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Goback from '@/components/goback'

export default function PaymentOnlinePage() {
  const router = useRouter();
  const params = useParams();
  const carId = Number(
        Array.isArray(params.car_id) ? params.car_id[0] : params.car_id
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() =>{
      if (!carId || Number.isNaN(carId)) {
          setError("ไม่พบรหัสรถ");
          setLoading(false);
          return;
      }
      setLoading(false);
    },[carId])

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
    <div className='min-h-screen'>
      <div className='container mx-auto sm:p-6 lg:p-8'>
        <div className='max-w-2xl mx-auto sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-2xl'>
          <Goback title="จองรถเช่า"/>

          <div className='text-center py-6 px-4'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2'>ชำระเงิน</h1>
            <p className='text-sm sm:text-base'>สแกน QR Code เพื่อชำระเงิน</p>
          </div>

          <div className='mx-4 sm:mx-6 bg-gray-50 rounded-xl p-4 sm:p-6 mb-6 text-center'>
            <p className='text-sm sm:text-base md:text-xl lg:text-2xl mb-1 sm:mb-2 font-semibold'>ยอดชำระทั้งหมด</p>
            <p className='text-2xl sm:text-3xl lg:text-4xl font-semibold text-(--blue-primary)'>฿3,500.00</p>
          </div>

          {/* qrcode */}
          <div className='mx-4 sm:mx-6 border-2 border-(--gray-light) rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 flex flex-col items-center'>
            <div className='rounded-xl shadow-lg mb-3 sm:mb-4'>
              <Image 
                src='https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg' 
                alt='QR Code สำหรับชำระเงิน' 
                width={200} 
                height={200} 
                className='w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64'
              />
            </div>
            <p className='text-xs sm:text-sm text-center'>สแกนด้วยแอปฯ ธนาคารของคุณ</p>
          </div>

          <div className='mx-4 sm:mx-6 bg-gray-50 rounded-xl p-4 sm:p-6 mb-6'>
            <h3 className='font-semibold text-base sm:text-lg mb-3 sm:mb-4'>วิธีการชำระเงิน</h3>
            <ol className='space-y-2 sm:space-y-3'>
              <li className='flex gap-2 sm:gap-3'>
                <span className='shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-(--blue-primary) text-(--white) rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold'>1</span>
                <span className='text-sm sm:text-base leading-relaxed'>เปิดแอปฯ ธนาคารหรือ Mobile Banking</span>
              </li>
              <li className='flex gap-2 sm:gap-3'>
                <span className='shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-(--blue-primary) text-(--white) rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold'>2</span>
                <span className='text-sm sm:text-base leading-relaxed'>เลือกเมนู "สแกน QR Code"</span>
              </li>
              <li className='flex gap-2 sm:gap-3'>
                <span className='shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-(--blue-primary) text-(--white) rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold'>3</span>
                <span className='text-sm sm:text-base leading-relaxed'>สแกน QR Code ด้านบน</span>
              </li>
              <li className='flex gap-2 sm:gap-3'>
                <span className='shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-(--blue-primary) text-(--white) rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold'>4</span>
                <span className='text-sm sm:text-base leading-relaxed'>ยืนยันการชำระเงิน</span>
              </li>
              <li className='flex gap-2 sm:gap-3'>
                <span className='shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-(--blue-primary) text-(--white) rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold'>5</span>
                <span className='text-sm sm:text-base leading-relaxed'>กดปุ่ม "ยืนยันการชำระเงิน" ด้านล่าง</span>
              </li>
            </ol>
          </div>

          {/* btn */}
          <div className='px-4 sm:px-6 pb-6 sm:pb-8'>
            <div className='flex justify-center'>
              <button className="w-full sm:w-80 block text-center text-sm sm:text-base py-3 sm:py-4 rounded-md bg-(--blue-primary) text-(--white) hover:bg-blue-700 cursor-pointer transition-all">
                ยืนยันการชำระเงิน
              </button>
            </div>
            <p className='text-center text-xs sm:text-sm mt-3 sm:mt-4 px-2'>
              กรุณากดยืนยันหลังจากชำระเงินเรียบร้อยแล้ว
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}