"use client"

import React, { useState, useEffect } from 'react'
import { FaRegCreditCard } from 'react-icons/fa'
import { useRouter,useParams } from 'next/navigation'
import Goback from '@/components/goback'

export default function PaymentCreditPage() {
  const router = useRouter()
  const params = useParams();
  const carId = Number(
        Array.isArray(params.car_id) ? params.car_id[0] : params.car_id
    );                  

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors,setErrors] = useState({ cardNumber:'', cardName:'', expiryDate:'', cvv:''})

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (!carId || Number.isNaN(carId)) {
          setError("ไม่พบรหัสรถ");
          setLoading(false);
          return;
      }
      setLoading(false);
  }, [carId])
    
  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const groups = numbers.match(/.{1,4}/g)
    return groups ? groups.join(' ') : numbers
  }

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4)
    }
    return numbers
  }

   const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted)
      if(errors.cardNumber){
        setErrors({...errors, cardNumber:''})
      }
    }
  }

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(e.target.value.toUpperCase());
    if(errors.cardName){
      setErrors({...errors, cardName:''})
    }
  }

   const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value)
    if (formatted.replace(/\//g, '').length <= 4) {
      setExpiryDate(formatted)
      if(errors.expiryDate){
        setErrors({...errors, expiryDate:''})
      }
    }
  }

   const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, '')
    if (numbers.length <= 3) {
      setCvv(numbers)
    }
  }

  const validateForm = () => {
    const newErrors = { cardNumber:'', cardName:'', expiryDate:'', cvv:''}
    let isValid = true;

    if(!cardNumber){
      newErrors.cardNumber = 'กรุณากรอกหมายเลขบัตร'
      isValid = false;
    }else if (cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'หมายเลขบัตรต้องมี 16 หลัก'
      isValid = false;
    }

    if(!cardName.trim()){
      newErrors.cardName = 'กรุณากรอกชื่อผู้ถือบัตร'
      isValid = false;
    }

    if(!expiryDate){
      newErrors.expiryDate = 'กรุณากรอกวันหมดอายุ'
      isValid = false;
    }else if(expiryDate.replace(/\//g, '').length !== 4){
      newErrors.expiryDate = 'รูปแบบวันหมดอายุไม่ถูกต้อง'
      isValid = false;
    }else{
      const [month, year] = expiryDate.split('/')
      const monthNum = parseInt(month)
      if(monthNum < 1 || monthNum > 12){
        newErrors.expiryDate = 'เดือนไม่ถูกต้อง 01-12'
        isValid = false;
      }
    }

    if(!cvv){
      newErrors.cvv = 'กรุณากรอก CVV'
      isValid = false;
    }else if(cvv.length !== 3){
      newErrors.cvv = 'CVV ต้องมี 3 หลัก'
      isValid = false;
    }

    setErrors(newErrors);
    return isValid
  }

  const handleSubmit = () => {
    if (validateForm()) {
      alert('ยืนยันการชำระเงินสำเร็จ!')
      // addcode
    }
  }
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
    <div className="min-h-screen sm:mb-5 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto sm:rounded-2xl shadow-xl">
        <Goback title="จองรถเช่า"/>
        {/* header */}
        <div className="text-center my-6 px-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">ชำระเงินด้วยบัตรเครดิต</h1>
          <p className="mt-2">กรุณากรอกข้อมูลบัตรของคุณ</p>
        </div>
        {/* main */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="py-3 px-4 sm:px-6 lg:px-8 order-2 lg:order-1">
            <div className="max-w-md mx-auto lg:max-w-none">
              <h2 className="text-xl font-semibold mb-6">ข้อมูลบัตร</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">หมายเลขบัตร</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3.5 text-base border border-(--gray-light) rounded-xl focus:border-(--blue-primary) focus:outline-none"
                  />
                   {errors.cardNumber && (
                    <p className='mt-1 text-red-500 text-xs'>{errors.cardNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">ชื่อผู้ถือบัตร</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={handleCardNameChange}
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-3.5 text-base border border-(--gray-light) rounded-xl focus:border-(--blue-primary) focus:outline-none"
                  />
                  {errors.cardName && (
                    <p className='mt-1 text-red-500 text-xs'>{errors.cardName}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">วันหมดอายุ</label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3.5 text-base border border-(--gray-light) rounded-xl focus:border-(--blue-primary) focus:outline-none"
                    />
                    {errors.expiryDate && (
                      <p className='mt-1 text-red-500 text-xs'>{errors.expiryDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">CVV</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={handleCvvChange}
                      placeholder="123"
                       className="w-full px-4 py-3.5 text-base border border-(--gray-light) rounded-xl focus:border-(--blue-primary) focus:outline-none"
                    />
                    {errors.cvv && (
                      <p className='mt-1 text-red-500 text-xs'>{errors.cvv}</p>
                    )}
                  </div>
                </div>

                <button className="w-full block text-center py-4 rounded-md bg-(--blue-primary) text-(--white) hover:bg-blue-700 cursor-pointer transition-all"
                onClick={handleSubmit}>
                  ยืนยันการชำระเงิน
                </button>

                <div className="my-6 text-center lg:hidden">
                  <p className="text-sm mb-3">รับบัตรเครดิต/เดบิต</p>
                  <div className="flex justify-center gap-6">
                    <div className="w-14 h-10 rounded-lg flex items-center justify-center text-sm font-bold border border-(--gray-light)">VISA</div>
                    <div className="w-14 h-10 rounded-lg flex items-center justify-center text-sm font-bold border border-(--gray-light)">MC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* card preview  */}
          <div className="py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-center order-1 lg:order-2">
            <div className="w-full max-w-md">
              <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 text-(--white) shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

                <div className="relative z-10">
                  <div className="mb-10">
                    <FaRegCreditCard size={45} className="text-(--orange-primary)" />
                  </div>
                  <div className="mb-10 text-xl sm:text-2xl tracking-wider">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs mb-1">ชื่อผู้ถือบัตร</div>
                      <div className="font-medium text-base sm:text-lg">{cardName || 'YOUR NAME'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs mb-1">วันหมดอายุ</div>
                      <div className="font-medium text-base sm:text-lg">{expiryDate || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center hidden lg:block">
                  <p className="text-sm mb-3">รับบัตรเครดิต/เดบิต</p>
                  <div className="flex justify-center gap-6">
                    <div className="w-14 h-10 rounded-lg flex items-center justify-center text-sm font-bold border border-(--gray-light)">VISA</div>
                    <div className="w-14 h-10 rounded-lg flex items-center justify-center text-sm font-bold border border-(--gray-light)">MC</div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}