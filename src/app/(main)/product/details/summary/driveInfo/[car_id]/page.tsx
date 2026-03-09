"use client"

import React, { useState, useEffect} from 'react'
import Goback from '@/components/goback'
import { useRouter, useParams } from 'next/navigation'

export default function ProductDriveInfoPage() {
    const router = useRouter()
    const params = useParams();
    const carId = Number(
        Array.isArray(params.car_id) ? params.car_id[0] : params.car_id
    );                  
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
    })
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const [bookingSummary, setBookingSummary] = useState<any>(null)

    useEffect(() => {
        if (!carId || Number.isNaN(carId)) {
            setError("ไม่พบรหัสรถ");
            setLoading(false);
            return;
        }
        const savedSummary = localStorage.getItem("BookingSummary")
        if (savedSummary) {
            try {
                const parsed = JSON.parse(savedSummary)
                 setBookingSummary(parsed)
            } catch (err) {
                console.error("ไม่สามารถ parse BookingSummary ได้", err)
            }
        }
        setLoading(false);
    }, [carId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
        setErrors(prev => ({ ...prev, [e.target.name]: "" }))
    }

    const validateForm = () => {
        const newErrors: typeof errors = {}
        if (!formData.firstName.trim()) newErrors.firstName = "กรุณากรอกชื่อ"
        if (!formData.lastName.trim()) newErrors.lastName = "กรุณากรอกนามสกุล"
        if (!formData.email.trim()) newErrors.email = "กรุณากรอกอีเมล"
        if (!formData.phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทร"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (!validateForm()) return

        const updatedSummary = {
            ...bookingSummary,     
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim()
        }
        localStorage.setItem("BookingSummary", JSON.stringify(updatedSummary))

        console.log("Updated BookingSummary:", updatedSummary)
        router.push(`/product/details/summary/driveInfo/payment/${carId}`)
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
        <div className='container mx-auto sm:px-5 sm:min-h-screen sm:flex sm:items-center sm:justify-center'>
            <div className='w-full max-w-2xl sm:p-3 lg:p-5 sm:rounded-lg md:rounded-2xl shadow-2xl sm:mt-15'>
                <Goback title='จองรถเช่า' />

                <div className='p-4 flex justify-center'>
                    <div className='w-full max-w-xl'>
                        <h3 className='text-base sm:text-lg lg:text-xl font-semibold mb-6'>
                            รายละเอียดของผู้ขับรถ
                        </h3>

                        <div className='flex flex-col gap-4'>
                            {/* ชื่อ */}
                            <div className='flex flex-col gap-1 text-sm sm:text-base'>
                                <label>ชื่อ <span className="text-red-500">*</span></label>
                                <input
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className='p-3 border border-(--gray-light) rounded focus:border-(--blue-primary) focus:outline-none'
                                    placeholder="ชื่อ"
                                />
                                {errors.firstName && <p className='text-red-500 text-sm'>{errors.firstName}</p>}
                            </div>

                            {/* นามสกุล */}
                            <div className='flex flex-col gap-1 text-sm sm:text-base'>
                                <label>นามสกุล <span className="text-red-500">*</span></label>
                                <input
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className='p-3 border border-(--gray-light) rounded focus:border-(--blue-primary) focus:outline-none'
                                    placeholder="นามสกุล"
                                />
                                {errors.lastName && <p className='text-red-500 text-sm'>{errors.lastName}</p>}
                            </div>

                            {/* อีเมล */}
                            <div className='flex flex-col gap-1 text-sm sm:text-base'>
                                <label>อีเมล <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className='p-3 border border-(--gray-light) rounded focus:border-(--blue-primary) focus:outline-none'
                                    placeholder="อีเมลสำหรับยืนยันการจอง"
                                />
                                {errors.email && <p className='text-red-500 text-sm'>{errors.email}</p>}
                            </div>

                            {/* เบอร์โทร */}
                            <div className='flex flex-col gap-1 text-sm sm:text-base'>
                                <label>เบอร์โทร <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    maxLength={10}
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className='p-3 border border-(--gray-light) rounded focus:border-(--blue-primary) focus:outline-none'
                                    placeholder="หมายเลขโทรศัพท์มือถือ 10 หลัก"
                                />
                                {errors.phone && <p className='text-red-500 text-sm'>{errors.phone}</p>}
                            </div>

                            <div className='sm:flex sm:justify-end mt-3 text-sm sm:text-base'>
                                <button
                                    onClick={handleNext}
                                    className='w-full sm:w-auto px-10 py-3 rounded-md bg-(--blue-primary) text-(--white) hover:bg-blue-700 cursor-pointer transition-all'
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}