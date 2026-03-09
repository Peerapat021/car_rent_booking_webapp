"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FaStar, FaTimes } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import Goback from "@/components/goback";
import { getCarDetail } from "@/lib/services/client/cars/get";
import { getCompany } from "@/lib/services/client/admin/company/get";

/* ===================== Types ===================== */

export interface CarDetail {
  car_id: number;
  car_brand: string;
  car_model: string;
  car_year: number | null;
  branch_id: number | null;
  class_id: number | null;
  class_name: string | null;
  seat_count: number | null;
  door_count: number | null;
  transmission: string | null;
  car_price_per_day?: string;
  car_deposit?: string;
  important_notes?: string | null;
  business_hours: string | null;
  after_hours_service: string | null;
  payment_policy: string | null;
  insurance_options: string | null;
  extra_equipment: string | null;
  additional_information: string | null;
}

export interface CarImage {
  car_image_id: number;
  car_id: number;
  car_image_url: string;
  car_image_type: string;
}

interface CarDetailResponse {
  success: boolean;
  car: CarDetail;
  images: CarImage[];
}

const getTransmissionText = (trans: string | null | undefined): string => {
  if (!trans) return "ไม่ระบุ";
  const value = trans.toLowerCase().trim();
  if (value === "automatic") return "ออโต้";
  if (value === "manual") return "กระปุก";
  return trans;
};

/* ===================== Page ===================== */

export default function ProductDetailsPage() {
  const params = useParams();

  const carId = Number(
    Array.isArray(params.car_id) ? params.car_id[0] : params.car_id
  );
  /* ====== STATE ====== */
  const [data, setData] = useState<CarDetailResponse | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);

  const maxThumbnails = 5;
  /* ====== FETCH DATA ====== */
  useEffect(() => {
    if (!carId || Number.isNaN(carId)) {
      setError("ไม่พบรหัสรถที่ถูกต้อง");
      setLoading(false);
      return;
    }

    const fetchCar = async () => {
      try {
        setLoading(true);
        const response = await getCarDetail(carId);
        const companyData = await getCompany();

        console.log("Data:", response);

        if (!response?.success || !response.car) {
          throw new Error("ไม่พบข้อมูลรถคันนี้");
        }

        setData(response);
        setCompany(companyData);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลรถ");
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [carId]);

  /* ===================== UI STATES ===================== */

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="text-center py-20">
          กำลังโหลดรายการรถ...
        </div>
      </div>
    )
  }

  if (error || !data?.car) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="text-center py-20">
          {error}
        </div>
      </div>
    )
  }

  /* ===================== DATA ===================== */

  const car = data?.car;
  const images = data?.images ?? [];
  const imageUrls = images.map((img) => img.car_image_url).filter(Boolean);

  const primaryImage =
    imageUrls[selectedImage] || "/images/car-placeholder.jpg";

  const formatPrice = (price: string) => {
    const num = Number(price);
    return Number.isNaN(num) ? price : num.toLocaleString("th-TH");
  };

  const handleShowAllImages = () => {
    setShowAllImages(true);
    setTimeout(() => setIsModalReady(true), 100);
  };

  return (
    <>
      {/* ================= MODAL ALL IMAGES ================= */}
      {showAllImages && (
        <div className="fixed inset-0 z-51 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className={`fixed inset-0 bg-(--gray-dark) transition-opacity duration-300 ${
                isModalReady ? "opacity-50" : "opacity-0"
              }`}
            ></div>
            <div
              className={`relative transform overflow-hidden bg-(--white) rounded-lg sm:rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl transition-all duration-300 ${
                isModalReady
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-4 scale-95"
              }`}
            >
              {/* Header */}
              <div className="p-3 sm:p-4 flex items-center justify-between border-b border-(--gray-light)">
                <h2 className="text-lg sm:text-xl font-semibold">
                  รูปภาพทั้งหมด ({imageUrls.length})
                </h2>
                <button
                  onClick={() => setShowAllImages(false)}
                  className="text-xl cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Image Grid */}
              <div className="overflow-y-auto p-3 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        setShowAllImages(false);
                      }}
                      className={`relative rounded-lg overflow-hidden aspect-4/3 cursor-pointer transition-all ${
                        selectedImage === index
                          ? "ring-2 sm:ring-4 ring-(--orange-primary) shadow-lg"
                          : "ring-1 sm:ring-2 ring-(--gray-light) hover:opacity-80"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-1 right-1  bg-(--gray-dark) bg-opacity-75 text-(--white) text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {index + 1}/{imageUrls.length}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <div className="container mx-auto mb-5 sm:-mb-15 sm:px-5 sm:pt-10">
        <div className="sm:rounded-2xl shadow-lg sm:pt-8">
          <Goback title="รายละเอียดรถ" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 sm:px-6 lg:px-8 py-0">
            {/* ================= IMAGE SECTION ================= */}
            <div className="space-y-3 sm:space-y-4">
              {/* Main Image */}
              <div className="relative sm:rounded-lg md:rounded-xl overflow-hidden">
                <div className="relative w-full h-48 sm:h-64 lg:h-80">
                  <Image
                    src={primaryImage}
                    alt={`${car.car_brand} ${car.car_model}`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-6 gap-2 sm:gap-3 px-3">
                {imageUrls.slice(0, maxThumbnails).map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative rounded-md sm:rounded-lg overflow-hidden aspect-4/3 cursor-pointer ${
                      selectedImage === idx
                        ? "ring-2 sm:ring-4 ring-(--orange-primary)"
                        : "ring-1 sm:ring-2 ring-(--gray-light) hover:opacity-80"
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`View ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}

                {imageUrls.length > maxThumbnails && (
                  <button
                    onClick={handleShowAllImages}
                    className="relative rounded-md sm:rounded-lg overflow-hidden aspect-4/3 ring-1 sm:ring-2 ring-(--gray-light) cursor-pointer"
                  >
                    <Image
                      src={imageUrls[maxThumbnails]}
                      alt={`View ${maxThumbnails + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-(--gray-dark)/60 flex items-center justify-center">
                      <span className="text-(--white) text-sm sm:text-xl font-semibold">
                        +{imageUrls.length - maxThumbnails}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* ================= DETAILS SECTION ================= */}
            <div className="space-y-4 sm:space-y-6 px-3 pb-1 lg:pb-0">
              {/* Title and Price */}
              <div>
                <div className="flex flex-wrap justify-between items-start gap-x-2 gap-y-1">
                  <h1 className="text-xl sm:text-2xl">
                    {car.car_brand} {car.car_model} {car.car_year}
                  </h1>
                  <div className="sm:text-right">
                    <p className="text-xl sm:text-2xl text-(--orange-primary) ml-auto shrink-0">
                      {car.car_price_per_day ? formatPrice(car.car_price_per_day) : "ไม่ระบุ"}/วัน
                    </p>
                  </div>
                </div>
              </div>

              <hr />

              {/* Car Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  ข้อมูลรถ
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="px-3 sm:px-4">
                    <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                      <p>ปีจดทะเบียน : {car.car_year}</p>
                      <p>เกียร์ : {getTransmissionText(car.transmission)}</p>
                      <p>ประเภท : {car.class_name}</p>
                      <p>จำนวนผู้โดยสาร : {car.seat_count}</p>
                      <p>จำนวนประตู : {car.door_count}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Section (Optional - can be populated from API) */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  อุปกรณ์ภายในรถ
                </h3>
                <div>
                  <div className="px-3 sm:px-4">
                    <p className="text-(--blue-primary) text-sm sm:text-base">
                      FA/AM Radio, USB/AUX, CD/MP3, Bluetooth
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= ADDITIONAL INFORMATION ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 p-3 sm:p-6 lg:p-8">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3 sm:mb-4">
                  ข้อควรรู้
                </h3>
                <div className="px-3 sm:px-4 space-y-2 sm:space-y-5 text-sm sm:text-base">
                  {Array.isArray(car?.important_notes) && car.important_notes.length > 0 ? (
                    car.important_notes.map((note, idx) => (
                      <p key={idx}>
                        {idx + 1}. {note}
                      </p>
                    ))
                  ) : (
                    <p>ไม่มีข้อมูลข้อควรรู้เพิ่มเติม</p>
                  )}
                </div>
              </div>

              <hr className="my-4 sm:my-5" />

              {/* Provider Info (Optional - can be added from API) */}
              <div className='flex items-center gap-3 sm:gap-4'>
                  <Link href={`/product/details/reviews/${carId}`} className='flex justify-center items-center'>
                    <img 
                      src={company?.company_logo || 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                      alt={company?.company_name}
                      className='w-20 h-16 sm:w-24 sm:h-20 rounded-lg object-cover shrink-0'
                      />
                      <div className='ml-2 space-y-2'>
                          <p className='text-sm sm:text-base'>{company?.company_name}</p>
                          <div className='flex items-center gap-1'>
                            <FaStar className='text-(--orange-primary) w-3 h-3' />
                            <span className='text-xs sm:text-sm text-(--orange-primary)'>8.5 ดีเยี่ยม</span>
                            <span className='text-xs'>| (235)</span>
                          </div>
                      </div>
                  </Link>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold">
                    เวลาทำการ
                  </h3>
                  <p className='px-3 sm:px-4 text-sm sm:text-base'>{car?.business_hours || 'ไม่มีข้อมูล'}</p>
              </div>
              
              <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold">
                    รับส่งรถนอกเวลาทำการ
                  </h3>
                  <p className='px-3 sm:px-4 text-sm sm:text-base'>{car?.after_hours_service || 'ไม่มีข้อมูล'}</p>
              </div>
              
              <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold">
                    การชำระเงิน
                  </h3>
                  <p className='px-3 sm:px-4 text-sm sm:text-base'>{car?.payment_policy || 'ไม่มีข้อมูล'}</p>
              </div>
              
              <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold">
                    ประกันเสริม
                  </h3>
                  <p className='px-3 sm:px-4 text-sm sm:text-base'>{car?.insurance_options || 'ไม่มีข้อมูล'}</p>
              </div>
              
              <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold">
                    อุปกรณ์เสริม
                  </h3>
                  <p className='px-3 sm:px-4 text-sm sm:text-base'>{car?.extra_equipment || 'ไม่มีข้อมูล'}</p>
              </div>
              
              <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold">
                    ข้อมูลอื่นๆ
                  </h3>
                  <p className='px-3 sm:px-4 text-sm sm:text-base'>{car?.additional_information || 'ไม่มีข้อมูล'}</p>
              </div>

              <Link
                href={`/product/details/summary/${carId}`}
                className="bg-(--blue-primary) hover:bg-blue-700 text-(--white) w-full block px-4 sm:px-5 py-2.5 sm:py-3 rounded-md text-base sm:text-md text-center shadow-md mt-3 sm:mt-5 transition-colors"
              >
                จองรถคันนี้
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}