"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { FaHeart, FaCar, FaCog, FaUser, FaCheck, FaStar } from 'react-icons/fa'
import { GiCarDoor } from "react-icons/gi";
import Link from 'next/link';
import Searchbar from '@/components/searchbar';
import Goback from "@/components/goback";
import { getCars } from "@/lib/services/client/cars/get";
import { getCarClasses } from "@/lib/services/client/car_classes/get";
import { getBranches } from "@/lib/services/client/branches/get";
import { getCompany } from "@/lib/services/client/admin/company/get";
import { getPromotionCars } from "@/lib/services/client/admin/promotionCars/get";
import { getPromotions } from "@/lib/services/client/admin/promotions/get";

import { tr } from 'date-fns/locale';
import { company } from '@/lib/db/schema';


interface DisplayCar {
  car_id: number
  car_brand: string
  car_model: string
  car_year?: number | null
  car_color?: string | null
  class_name: string | undefined
  car_price_per_day: string | number
  car_deposit?: string | number
  car_insurance_fee?: string | number
  car_image_cover?: string | null
  transmission?: string | null
  seat_count?: number
  door_count?: number
  branch_name?: string
  hasPromotion: boolean
  promotions: Array<{
    promo_id: number
    promo_code?: string
    discount_type: 'percent' | 'fixed'
    discount_value: number
    displayText: string
  }> | null
}
export default function ProductPage() {
  const [cars, setCars] = useState<DisplayCar[]>([])
  const [displayedCars, setDisplayedCars] = useState<DisplayCar[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [rentalDays, setRentalDays] = useState<number>(1)
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  
  useEffect( ()=> {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)
        const [carsData, classesData, branchesData, companyData, promotionCarsData, promotionsData] = await Promise.all([
          getCars(),  
          getCarClasses(),
          getBranches(),
          getCompany(),
          getPromotionCars(),
          getPromotions()
        ])
        if (!isMounted) return
         type ClassInfo = {
          class_name: string
        }
        const classMap = new Map<number, ClassInfo>(
          classesData.map((cls: any) => [
            cls.class_id,
            {
              class_name: cls.class_name,
            },
          ])
        )

        const branchMap = new Map<number, { branch_name: string; branch_short?: string }>(
          branchesData.map((branch: any) => [
            branch.branch_id,
            {
              branch_name: branch.branch_name
            },
          ])
        )
        const promotionCarMap = new Map<number, any[]>()
        promotionCarsData.forEach((pc: any) => {
          const existing = promotionCarMap.get(pc.car_id) || []
          existing.push(pc)
          promotionCarMap.set(pc.car_id, existing)
        })
        const promotionMap = new Map<number, any>(
          promotionsData.map((p: any) => [p.promo_id, p])
        )
        // Mapping / ปรับแต่งข้อมูล
       const formattedCars: DisplayCar[] = carsData.map((car: any) => {
          const classInfo = classMap.get(car.class_id)
          const branchInfo = car.branch_id ? branchMap.get(car.branch_id) : null

          let displayTransmission = "ไม่ระบุ";
          if (car.transmission) {
            const trans = car.transmission.toLowerCase().trim();
            if (trans === "automatic") {
              displayTransmission = "ออโต้";
            } else if (trans === "manual") {
              displayTransmission = "กระปุก";
            } else {
              displayTransmission = car.transmission; 
            }
          }
          const promotionsForThisCar = promotionCarMap.get(car.car_id) || []
          const carPromotions = promotionsForThisCar
            .map((pc: any) => {
              const promoData = promotionMap.get(pc.promo_id)
              if (!promoData) return null

              const displayText =
                promoData.discount_type === 'percent'
                  ? `ลด ${Number(promoData.discount_value).toLocaleString()}%`
                  : `ลด ${Number(promoData.discount_value).toLocaleString()}฿`

              return {
                promo_id: promoData.promo_id,
                promo_code: promoData.promo_code,
                discount_type: promoData.discount_type,
                discount_value: Number(promoData.discount_value),
                displayText,
              }
            })
            .filter((p): p is NonNullable<typeof p> => !!p)

          carPromotions.sort((a, b) => {
            if (a.discount_type === 'percent' && b.discount_type === 'percent') {
              return b.discount_value - a.discount_value
            }
            if (a.discount_type === 'percent') return -1
            if (b.discount_type === 'percent') return 1
            return b.discount_value - a.discount_value
          })
          return {
            car_id: car.car_id,
            car_brand: car.car_brand,
            car_model: car.car_model,
            car_year: car.car_year,
            class_name: classInfo?.class_name,
            car_price_per_day: Math.round(Number(car.car_price_per_day)),
            car_deposit: Math.round(Number(car.car_deposit)),
            car_insurance_fee: Math.round(Number(car.car_insurance_fee)),
            car_image_cover: car.car_image_cover,
            transmission: displayTransmission,
            seat_count: car.seat_count,
            door_count: car.door_count,
            branch_name: branchInfo?.branch_name,
            hasPromotion: carPromotions.length > 0,
            promotions: carPromotions.length > 0 ? carPromotions : null,
          }
        })
        setCars(formattedCars)
        setCompany(companyData)

        let searchData: any = {}
        const savedSearch = localStorage.getItem("SearchData")

        if (savedSearch) {
          try {
            searchData = JSON.parse(savedSearch)
            if (searchData.location) {
              setHasSearched(true)
            }
          } catch (parseErr) {
            console.warn("parse SearchData ล้มเหลว:", parseErr)
          }
        } else {
          console.log("ไม่พบ SearchData ใน localStorage")
        }

        const branchName = searchData?.selectedBranches?.trim() || null
        setSelectedBranch(branchName)

        let calculatedDays = 1

        if (searchData?.pickupDate && searchData?.returnDate) {
          const pickup = new Date(searchData.pickupDate)
          const returnD = new Date(searchData.returnDate)

          if (!isNaN(pickup.getTime()) && !isNaN(returnD.getTime())) {
            const diffMs = returnD.getTime() - pickup.getTime()
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
            calculatedDays = diffDays > 0 ? diffDays : 1
          } else {
            console.warn("วันที่ใน SearchData ไม่ถูกต้อง")
          }
        } else {
          console.log("ไม่มี pickupDate หรือ returnDate → ใช้ค่า default 1 วัน")
        }
        setRentalDays(calculatedDays)
        const updatedSearchData = {
          ...searchData,                    // รักษาข้อมูลเดิมทั้งหมด
          rentalDays: calculatedDays,
        }

        localStorage.setItem("SearchData", JSON.stringify(updatedSearchData))
        console.log("SearchData Product", updatedSearchData)
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'ไม่สามารถโหลดข้อมูลรถได้')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
    
  },[])

  useEffect(() => {
    if (!cars.length) return

    if (!hasSearched) {
      setDisplayedCars([])
      return
    }

    if (!selectedBranch || selectedBranch.trim() === '') {
      setDisplayedCars([]);
      return
    }

    const normalizedSelected = selectedBranch.toLowerCase().trim()

    const filtered = cars.filter((car) => 
      car.branch_name?.toLowerCase().trim() === normalizedSelected
    )

    setDisplayedCars(filtered)
  }, [cars, selectedBranch, hasSearched])
  return (
    <>
    <div className='container mx-auto sm:px-6 sm:-mt-15 sm:-mb-25'>
      <div className='flex flex-col'>
        {/* Goback */}
        <Goback title="จองรถเช่า"/>
        {/* search */}
        <Searchbar />
        {/* product */}
        {loading ? (
          <div className="text-center py-20 text-sm sm:text-base">
              กำลังโหลดรายการรถ...
          </div>
        ): error ? (
          <div className="text-center py-20 text-sm sm:text-base">
              {error}
          </div>
        ): displayedCars.length === 0 ? (
          <div className="text-center py-16 px-4 text-sm sm:text-base">
            {hasSearched 
              ? "ไม่พบรถที่พร้อมให้เช่าในสาขาที่เลือก กรุณาลองเลือกสาขาอื่น"
              : <p>กรุณาเลือกสถานที่ และวันที่รับ-คืนรถ<br /> เพื่อดูรถที่ว่างให้บริการ</p>}
          </div>
        ):(
           <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:mb-20'>
            {displayedCars.map((car) => (
              <div key={car.car_id}
                className='sm:rounded-md shadow-[0_-4px_30px_rgba(0,0,0,0.25)] overflow-hidde flex sm:flex-col'>
                {/* image */}
                <div className='relative w-[38%] sm:w-full shrink-0'>
                  <Image 
                    src={car.car_image_cover || 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} 
                    width={300} 
                    height={200} 
                    alt={`${car.car_brand} ${car.car_model}`}
                    className='w-full h-full sm:h-44 lg:h-48 object-cover sm:rounded-tl-md sm:rounded-tr-md'
                  />
                  {/* แสดงโปรโมชั่น */}
                  {car.hasPromotion && car.promotions && car.promotions.length > 0 && (
                    <div className="absolute top-2 flex flex-col gap-1">
                      {car.promotions.map((promo) => (
                        <div
                          key={promo.promo_id}
                          className="bg-(--orange-primary) text-(--white) text-sm py-1 px-3 rounded-r-lg"
                        >
                          {promo.displayText}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* info */}
                <div className='flex flex-col flex-1 gap-1.5 p-3 sm:p-4 min-w-0'>
                  <div className='flex items-start justify-between'>
                    <h3 className='text-base sm:text-xl line-clamp-2'>{car.car_brand} {car.car_model} {car.car_year}</h3>
                    <button className='text-2xl cursor-pointer'>
                      <FaHeart className='shrink-0 mt-0.5 text-(--gray-light) hover:text-gray-400 transition-colors' />
                    </button>
                  </div>
                  <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                    <span className="flex items-center gap-1">
                      <FaCar className="text-(--blue-primary) shrink-0" />
                      {car.class_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaCog className="text-(--blue-primary) shrink-0" />
                      {car.transmission}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaUser className="text-(--blue-primary) shrink-0" />
                      {car.seat_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GiCarDoor className="text-(--blue-primary) shrink-0" />
                      {car.door_count}
                    </span>
                  </div>
                  <hr/>
                  <div className='space-y-1 text-xs'>
                    <div className='flex items-start gap-1.5'>
                      <FaCheck className='text-(--blue-primary) mt-0.5 border border-(--blue-primary) rounded-full p-0.5' />
                      <span>บริการรับส่งรถนอกสถานที่</span>
                    </div>
                    <div className='flex items-start gap-1.5'>
                      <FaCheck className='text-(--blue-primary) mt-0.5 border border-(--blue-primary) rounded-full p-0.5' />
                      <span>ประกันภัยคุ้มครอบ</span>
                    </div>
                    <div className='flex items-start gap-1.5'>
                      <FaCheck className='text-(--blue-primary) mt-0.5 border border-(--blue-primary) rounded-full p-0.5' />
                      <span>การันตีราคาเดียวกันหน้าร้าน</span>
                    </div>
                  </div>
                  <div className='flex flex-col gap-1.5 text-xs'>
                      <button className='w-45 sm:w-full bg-(--orange-primary) text-(--white) py-1.5 rounded-full'>
                        ไม่ต้องใช้บัตรเครดิตจอง
                      </button>
                      <button className='w-45 sm:w-full bg-(--green-primary) text-(--white) py-1.5 rounded-full'>
                        ต้องใช้เอกสารเพิ่มเติม
                      </button>
                  </div>
                  <div className='flex items-center justify-between gap-2 mt-auto pt-1'>
                    <Link href={`/product/details/reviews/${car.car_id}`} className='flex items-center gap-2 min-w-0'>
                      <Image
                        src={company?.company_logo || 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                        alt={company?.company_name}
                        width={40}
                        height={40}
                        className='w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0'
                      />
                      <div className='min-w-0'>
                        <p className='text-xs truncate'>{company?.company_name}</p>
                        <div className='flex items-center gap-1 mt-0.5'>
                          <FaStar className='text-(--orange-primary) w-3 h-3 shrink-0' />
                          <span className='text-[10px] text-(--orange-primary) truncate'>8.5 ดีเยี่ยม</span>
                          <span className='text-[10px] truncate'>| (235)</span>
                        </div>
                      </div>
                    </Link>
                    <div className='text-right shrink-0'>
                      <p className='text-xs'>สำหรับ {rentalDays} วัน</p>
                      <p className='text-(--orange-primary) text-lg leading-tight'>฿{car.car_price_per_day}/วัน</p>
                    </div>
                  </div>
                  <Link href={`/product/details/${car.car_id}`} className='bg-(--blue-primary) hover:bg-blue-700 text-(--white) w-full block py-2 rounded-md text-sm lg:text-base text-center shadow-md'>
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  )
}