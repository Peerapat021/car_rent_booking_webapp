"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaCar, FaCog, FaUser, FaCheck, FaStar, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BsCalendarWeek } from "react-icons/bs";
import { GiCarDoor } from "react-icons/gi";
import { Clock } from "lucide-react";
import { RxCross2 } from "react-icons/rx";
import Image from "next/image";
import Link from "next/link";
import Goback from "@/components/goback";
import { useRouter } from "next/navigation";
import { getCarDetail } from "@/lib/services/client/cars/get";
import { getCoupons } from "@/lib/services/client/coupons/get";
import { getBranches } from "@/lib/services/client/branches/get";
import { getCities } from "@/lib/services/client/cities/get";
import { getCompany } from "@/lib/services/client/admin/company/get";
import { getPromotionCars } from "@/lib/services/client/admin/promotionCars/get";
import { getPromotions } from "@/lib/services/client/admin/promotions/get";
import { parse } from "path";
import { set } from "date-fns";

// Types
export interface CarDetail {
  car_id: number;
  car_brand: string;
  car_model: string;
  car_year: number | null;
  class_name: string | null;
  transmission: string | null;
  seat_count: number | null;
  door_count: number | null;
  car_price_per_day?: string;
  car_deposit?: string;
  car_insurance_fee?: string | number;
  branch_id: number | null;
  branch_name?: string;
}

export interface CarImage {
  car_image_id: number;
  car_id: number;
  car_image_url: string;
}

interface CarDetailResponse {
  success: boolean;
  car: CarDetail;
  images: CarImage[];
}
export interface Coupon {
  coupon_id: number;
  coupon_code: string;
  coupon_image?: string | null;
  discount_type: "percent" | "fixed";
  discount_value: string;
  max_discount_amount?: string | null;
  min_booking_amount?: string | null;
  usage_limit?: number | null;
  used_count: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}
interface City {
  city_id: number;
  city_name: string;
}

interface Branch {
  branch_id: number;
  city_id: number;
  branch_name: string;
}


const formatDateTime = (dateString?: string, timeString?: string) => {
  if (!dateString) return " ";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return " ";

  let hours = date.getHours();
  let minutes = date.getMinutes();

  if (timeString) {
    const [h, m] = timeString.split(":");
    hours = Number(h);
    minutes = Number(m);
  }

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTransmissionText = (trans: string | null | undefined): string => {
  if (!trans) return "ไม่ระบุ";
  const value = trans.toLowerCase().trim();
  if (value === "automatic") return "ออโต้";
  if (value === "manual") return "กระปุก";
  return trans;
};

const generateTimeOptions = () => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return times;
};
const timeOptions = generateTimeOptions();

const getNext30MinTime = (): string => {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = now.getHours();
  
  if (minutes < 30) {
    return `${hours.toString().padStart(2, '0')}:30`;
  } else {
    const nextHour = (hours + 1) % 24;
    return `${nextHour.toString().padStart(2, '0')}:00`;
  }
};

interface DateTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPickupDate?: string;
  initialReturnDate?: string;
  initialPickupTime?: string;
  initialReturnTime?: string;
  onConfirm: (data: {
    pickupDate: string;
    returnDate: string;
    pickupTime: string;
    returnTime: string;
    rentalDays: number;
  }) => void;
}
function DateTimePickerModal({
  isOpen,
  onClose,
  initialPickupDate,
  initialReturnDate,
  initialPickupTime,
  initialReturnTime,
  onConfirm,
}: DateTimePickerModalProps) {
  const [pickupDate, setPickupDate] = useState<Date>(
    initialPickupDate ? new Date(initialPickupDate) : new Date()
  );
  const [returnDate, setReturnDate] = useState<Date>(
    initialReturnDate ? new Date(initialReturnDate) : new Date(Date.now() + 86400000)
  );

  const [pickupTime, setPickupTime] = useState<string>(
    initialPickupTime || getNext30MinTime()
  );
  const [returnTime, setReturnTime] = useState<string>(
    initialReturnTime || getNext30MinTime()
  );

  const [showPickupCalendar, setShowPickupCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);
  const [showPickupTimeDropdown, setShowPickupTimeDropdown] = useState(false);
  const [showReturnTimeDropdown, setShowReturnTimeDropdown] = useState(false);

  const [pickupMonth, setPickupMonth] = useState<Date>(pickupDate);
  const [returnMonth, setReturnMonth] = useState<Date>(returnDate);
  

  if (!isOpen) return null;

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const calculateRentalDays = () => {
    const start = new Date(pickupDate);
    const [ph, pm] = pickupTime.split(":").map(Number);
    start.setHours(ph, pm, 0, 0);

    const end = new Date(returnDate);
    const [rh, rm] = returnTime.split(":").map(Number);
    end.setHours(rh, rm, 0, 0);

    if (end <= start) return 1;
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const handleConfirm = () => {
    onConfirm({
      pickupDate: pickupDate.toISOString(),
      returnDate: returnDate.toISOString(),
      pickupTime,
      returnTime,
      rentalDays: calculateRentalDays(),
    });
    onClose();
  };

  const thaiFullMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const renderCalendar = (
    currentMonth: Date,
    selected: Date,
    onSelect: (d: Date) => void,
    onMonthChange: (newMonth: Date) => void
  ) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isSelected = date.toDateString() === selected.toDateString();
      const past = isPastDate(date);

      days.push(
        <button
          key={d}
          disabled={past}
          onClick={() => {
            onSelect(date);
            if (onSelect === setPickupDate) {
              setShowPickupCalendar(false);
            } else if (onSelect === setReturnDate) {
              setShowReturnCalendar(false);
            }
            if (onSelect === setPickupDate && date > returnDate) {
              const nextDay = new Date(date);
              nextDay.setDate(nextDay.getDate() + 1);
              setReturnDate(nextDay);
              setReturnMonth(nextDay);
            }
          }}
          className={`h-10 w-10 flex items-center justify-center rounded-full text-sm transition-colors
            ${past ? "text-gray-300 cursor-not-allowed" : "cursor-pointer"}
            ${isSelected ? "bg-(--blue-primary) text-(--white)" : "hover:bg-gray-200"}
          `}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => onMonthChange(new Date(year, month - 1, 1))}
            className="p-2 rounded-full"
          >
            <FaChevronLeft size={18} />
          </button>

          <span className="font-medium text-base">
            {thaiFullMonths[month]} {year + 543}
          </span>

          <button
            onClick={() => onMonthChange(new Date(year, month + 1, 1))}
            className="p-2 rounded-full"
          >
            <FaChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs  mb-3">
          <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
        </div>

        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-(--white) rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">เลือกวันและเวลา</h3>
          <button onClick={onClose} className="corsor-pointer">
            <RxCross2 size={20} className=" hover:text-gray-800 cursor-pointer" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* วันที่ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm mb-1.5 font-medium">วันที่รับรถ</label>
              <button
                onClick={() => {
                  setShowPickupCalendar(!showPickupCalendar);
                  setShowReturnCalendar(false);
                }}
                className="w-full p-4 border border-gray-300 rounded-xl text-left flex justify-between items-center hover:border-(--blue-primary) focus:border-(--blue-primary) transition cursor-pointer"
              >
                <span>{pickupDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                <BsCalendarWeek className="text-(--blue-primary)" size={20} />
              </button>

              {showPickupCalendar && (
                <div className="absolute left-0 top-full mt-2 bg-(--white) border border-gray-200 rounded-xl shadow-xl z-50 w-full sm:w-80">
                  {renderCalendar(pickupMonth, pickupDate, setPickupDate, setPickupMonth)}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm  mb-1.5 font-medium">วันที่คืนรถ</label>
              <button
                onClick={() => {
                  setShowReturnCalendar(!showReturnCalendar);
                  setShowPickupCalendar(false);
                }}
                className="w-full p-4 border border-gray-300 rounded-xl text-left flex justify-between items-center hover:border-(--blue-primary) focus:border-(--blue-primary) transition cursor-pointer"
              >
                <span>{returnDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                <BsCalendarWeek className="text-(--blue-primary)" size={20} />
              </button>

              {showReturnCalendar && (
                <div className="absolute right-0 top-full mt-2 bg-(--white) border border-gray-200 rounded-xl shadow-xl z-50 w-full sm:w-80">
                  {renderCalendar(returnMonth, returnDate, setReturnDate, setReturnMonth)}
                </div>
              )}
            </div>
          </div>

          {/* เวลา */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm mb-1.5 font-medium">เวลารับรถ</label>
              <button
                onClick={() => {
                  setShowPickupTimeDropdown(!showPickupTimeDropdown);
                  setShowReturnTimeDropdown(false);
                }}
                className="w-full p-4 border border-gray-300 rounded-xl text-left flex justify-between items-center hover:border-(--blue-primary) focus:border-(--blue-primary) transition cursor-pointer"
              >
                <span>{pickupTime}</span>
                <Clock className="text-(--blue-primary)" size={20} />
              </button>

              {showPickupTimeDropdown && (
                <div className="absolute left-0 top-full mt-2 bg-(--white) border border-gray-200 rounded-xl shadow-xl z-100 max-h-64 overflow-y-auto w-48">
                  {timeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setPickupTime(t);
                        setShowPickupTimeDropdown(false);
                      }}
                      className={`w-full text-left px-5 py-3 hover:bg-blue-50 transition ${t === pickupTime ? "bg-blue-50 text-(--blue-primary) font-medium" : ""}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm mb-1.5 font-medium">เวลาคืนรถ</label>
              <button
                onClick={() => {
                  setShowReturnTimeDropdown(!showReturnTimeDropdown);
                  setShowPickupTimeDropdown(false);
                }}
                className="w-full p-4 border border-gray-300 rounded-xl text-left flex justify-between items-center hover:border-(--blue-primary) focus:border-(--blue-primary) transition cursor-pointer"
              >
                <span>{returnTime}</span>
                <Clock className="text-(--blue-primary)" size={20} />
              </button>

              {showReturnTimeDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-(--white) border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto w-48">
                  {timeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setReturnTime(t);
                        setShowReturnTimeDropdown(false);
                      }}
                      className={`w-full text-left px-5 py-3 hover:bg-blue-50 transition ${t === returnTime ? "bg-blue-50 text-(--blue-primary) font-medium" : ""}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-center pt-2">
            รวม <span className="font-bold text-(--blue-primary)">{calculateRentalDays()}</span> วัน
          </div>
        </div>

        <div className="flex gap-4 p-5 border-t rounded-b-2xl bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 border bg-gray-200  hover:bg-gray-300 rounded-xl transition font-medium cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3.5 bg-(--blue-primary) text-(--white) rounded-xl hover:bg-blue-700 transition font-medium cursor-pointer"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductSummaryPage() {
  const params = useParams();
  const router = useRouter(); 
  const { data: session, status } = useSession();
  const carId = Number(
    Array.isArray(params.car_id) ? params.car_id[0] : params.car_id
  );

  const [carData, setCarData] = useState<CarDetailResponse | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [baseTotal, setBaseTotal] = useState(0);   
  const [total, setTotal] = useState(0);
  const [discountcode, setDiscountCode] = useState("");
  const [discountmessage, setDiscountMessage] = useState("");
  const [showdiscount, setShowDiscount] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [carPromotions, setCarPromotions] = useState<Array<{
    promo_id: number;
    promo_code?: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    displayText: string;
  }> | null>(null);

  const [hasPromotion, setHasPromotion] = useState(false);

  // เก็บข้อมูลคูปองที่ใช้สำเร็จ
  const [appliedCouponId, setAppliedCouponId] = useState<number | null>(null);
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState<number>(0);
  const [appliedDiscountPercentage, setAppliedDiscountPercentage] = useState<number | null>(null);
  
  const [searchData, setSearchData] = useState<{
    pickupDate?: string;
    returnDate?: string;
    pickupTime?: string;
    returnTime?: string;
    rentalDays?: number;
    location?: string;
    selectedProvince?: string;
  } | null>(null);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);

  // Fetch car detail
  useEffect(() => {
    if (!carId || Number.isNaN(carId)) {
      setError("ไม่พบรหัสรถ");
      setLoading(false);
      return;
    }

    const fetchCar = async () => {
      try {
        setLoading(true);
        const [carResponse, branchesResponse, citiesResponse, companyData, promotionCarsData, promotionsData] = await Promise.all([
          getCarDetail(carId),
          getBranches(),
          getCities(),
          getCompany(),
          getPromotionCars(),
          getPromotions()
        ]);
        if (!carResponse?.success || !carResponse.car) {
          throw new Error("ไม่พบข้อมูลรถคันนี้");
        }

        // จัดการข้อมูลสาขา
        let enhancedCar: CarDetail = { ...carResponse.car };

        if (carResponse.car.branch_id != null && branchesResponse) {
          const branchList = Array.isArray(branchesResponse.branches)
            ? branchesResponse.branches
            : branchesResponse || [];

          const foundBranch = branchList.find(
            (b: any) => b.branch_id === carResponse.car.branch_id
          );

          if (foundBranch) {
            enhancedCar.branch_name = foundBranch.branch_name;
            setSelectedBranch(foundBranch);
          } else {
            console.warn(`ไม่พบสาขาที่มี branch_id = ${carResponse.car.branch_id}`);
          }
        }
        setCarData({
          success: true,
          car: enhancedCar,
          images: carResponse.images || [],
        });
        setCompany(companyData);

        const promotionCarMap = new Map<number, any[]>();

        promotionCarsData.forEach((pc: any) => {
          const existing = promotionCarMap.get(pc.car_id) || [];
          existing.push(pc);
          promotionCarMap.set(pc.car_id, existing);
        });

        const promotionMap = new Map<number, any>(
          promotionsData.map((p: any) => [p.promo_id, p])
        );

        const promotionsForThisCar = promotionCarMap.get(carId) || [];

        const formattedPromotions = promotionsForThisCar
          .map((pc: any) => {
            const promoData = promotionMap.get(pc.promo_id);
            if (!promoData) return null;

            const displayText =
              promoData.discount_type === 'percent'
                ? `ลด ${Number(promoData.discount_value).toLocaleString()}%`
                : `ลด ${Number(promoData.discount_value).toLocaleString()}฿`;

            return {
              promo_id: promoData.promo_id,
              promo_code: promoData.promo_code,
              discount_type: promoData.discount_type,
              discount_value: Number(promoData.discount_value),
              displayText,
            };
          })
          .filter((p): p is NonNullable<typeof p> => !!p);

        // เรียงลำดับโปรโมชั่น
        formattedPromotions.sort((a, b) => {
          if (a.discount_type === 'percent' && b.discount_type === 'percent') {
            return b.discount_value - a.discount_value;
          }
          if (a.discount_type === 'percent') return -1;
          if (b.discount_type === 'percent') return 1;
          return b.discount_value - a.discount_value;
        });

        setCarPromotions(formattedPromotions.length > 0 ? formattedPromotions : null);
        setHasPromotion(formattedPromotions.length > 0);

        if (citiesResponse?.cities) {
          setCities(citiesResponse.cities);
        } else if (Array.isArray(citiesResponse)) {
          setCities(citiesResponse);
        }

        if (branchesResponse?.branches) {
          setBranches(branchesResponse.branches);
        } else if (Array.isArray(branchesResponse)) {
          setBranches(branchesResponse);
        }
        
        const couponResponse = await getCoupons();
        let couponList: Coupon[] = [];

        if (Array.isArray(couponResponse)) {
          couponList = couponResponse;
        } else if (couponResponse?.coupons && Array.isArray(couponResponse.coupons)) {
          couponList = couponResponse.coupons;
        } else if (couponResponse?.data && Array.isArray(couponResponse.data)) {
          couponList = couponResponse.data;
        } else if (couponResponse?.success && Array.isArray(couponResponse.coupons)) {
          couponList = couponResponse.coupons;
        }

        const activeCoupons = couponList.filter((c) => c.is_active === true);
        setCoupons(activeCoupons);

      } catch (err: any) {
        setError(err.message || "โหลดข้อมูลรถไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [carId]);
  
useEffect(() => {
  const savedSearch = localStorage.getItem("SearchData");
  let searchDataToUse: any = null;

  if (savedSearch) {
    try {
      const parsed = JSON.parse(savedSearch);
      if (
        parsed &&
        parsed.pickupDate &&
        parsed.returnDate &&
        parsed.pickupTime &&
        parsed.returnTime
      ) {
        searchDataToUse = parsed;
      }
      else {
        console.warn("SearchData ใน localStorage ไม่ครบถ้วน → ใช้ค่า default");
      }
    } catch (err) {
      console.error("อ่านหรือ parse SearchData ไม่ได้:", err);
    }
  } else {
    console.log("ไม่พบ SearchData ใน localStorage เลย → ใช้ค่า default");
  }
  if (!searchDataToUse) {
    const now = new Date();

    let minutes = now.getMinutes();
    let hours = now.getHours();
    minutes = Math.ceil(minutes / 30) * 30;
    if (minutes >= 60) {
      minutes -= 60;
      hours = (hours + 1) % 24;
    }
    const defaultTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    searchDataToUse = {
      pickupDate: now.toISOString(),
      returnDate: tomorrow.toISOString(),
      pickupTime: defaultTime,
      returnTime: defaultTime,
      rentalDays: 1,   
    };
    localStorage.setItem("SearchData", JSON.stringify(searchDataToUse));
  }

  setSearchData(searchDataToUse);
}, []);

  useEffect(() => {
    if (!carData?.car || !searchData?.rentalDays) {
      setBaseTotal(0);
      setTotal(0);
      return;
    }

    const dailyPrice = Number(carData.car.car_price_per_day);
    const rentalDays = searchData.rentalDays;

    if (!isNaN(dailyPrice) && rentalDays > 0) {
      const base = dailyPrice * rentalDays;
      setBaseTotal(base);

      let couponDiscount = 0;
      if (showdiscount && discountcode) {
        const matchedCoupon = coupons.find(
          (c) => c.coupon_code.toUpperCase() === discountcode.trim().toUpperCase()
        );

        if (matchedCoupon) {
          const value = Number(matchedCoupon.discount_value);
          if (!isNaN(value) && value > 0) {
            if (matchedCoupon.discount_type === "fixed") {
              couponDiscount = value;
            } else if (matchedCoupon.discount_type === "percent") {
              couponDiscount = (base * value) / 100;
              couponDiscount = Math.round(couponDiscount * 100) / 100;
              if (matchedCoupon.max_discount_amount) {
                const maxDisc = Number(matchedCoupon.max_discount_amount);
                if (!isNaN(maxDisc) && couponDiscount > maxDisc) {
                  couponDiscount = maxDisc;
                }
              }
            }
          }
        }
      }
      let promoDiscountTotal = 0;
      if (carPromotions && carPromotions.length > 0) {
        promoDiscountTotal = carPromotions.reduce((sum, promo) => {
          let amount = 0;
          if (promo.discount_type === "fixed") {
            amount = promo.discount_value;
          } else if (promo.discount_type === "percent") {
            amount = (base * promo.discount_value) / 100;
            amount = Math.round(amount * 100) / 100;
          }
          return sum + amount;
        }, 0);
      }

      const finalTotal = Math.max(0, base - couponDiscount - promoDiscountTotal);
      setTotal(finalTotal);
    }
  }, [carData, searchData, coupons, showdiscount, discountcode, carPromotions]);
  
useEffect(() => {
  // ต้องมีข้อมูลครบทั้ง 3 อย่างจึงจะบันทึก
  if (!carData?.car || !searchData || !searchData.rentalDays || total <= 0) {
    return;
  }
  let appliedPromotions: any[] = [];
  let promoDiscountTotal = 0;

  if (carPromotions && carPromotions.length > 0) {
    appliedPromotions = carPromotions.map((promo) => {
      let discountAmount = 0;
      if (promo.discount_type === "fixed") {
        discountAmount = promo.discount_value;
      } else if (promo.discount_type === "percent") {
        discountAmount = (baseTotal * promo.discount_value) / 100;
        discountAmount = Math.round(discountAmount * 100) / 100;
      }
      promoDiscountTotal += discountAmount;

      return {
        promo_id: promo.promo_id,
        promo_code: promo.promo_code || null,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: discountAmount,
        displayText: promo.displayText,
      };
    });
  }
  const couponDiscount = showdiscount ? appliedDiscountAmount : 0;
  const totalDiscount = promoDiscountTotal + couponDiscount;
  const finalTotal = Math.max(0, baseTotal - totalDiscount);

  const bookingSummary = {
    car_id: carId,
    pickupDate: searchData.pickupDate,
    returnDate: searchData.returnDate,
    pickupTime: searchData.pickupTime,
    returnTime: searchData.returnTime,
    car_price_per_day: Number(carData.car.car_price_per_day), //ราคาเช่าต่อวัน
    rentalDays: searchData.rentalDays,

    booking_total_price: finalTotal,                           //ยอดรวมสุทธิ
    rental_amount: baseTotal,                                   //ยอดรวมก่อนหักส่วนลด

    car_deposit: Number(carData.car.car_deposit),               //ค่ามัดจำ
    car_insurance_fee: Number(carData.car.car_insurance_fee),
    
    discountCode: showdiscount ? discountcode.trim().toUpperCase() : null,
    coupon_id: showdiscount ? appliedCouponId : null,
    discount_coupon: couponDiscount,
    discountPercentage: showdiscount ? appliedDiscountPercentage : null,

    appliedPromotions: appliedPromotions,
    discount_promo: promoDiscountTotal,

    total_discount: totalDiscount,
  };

  localStorage.setItem("BookingSummary", JSON.stringify(bookingSummary));
  console.log("BookingSummary :", bookingSummary);

}, [carData, 
    searchData, total, 
    baseTotal, 
    showdiscount, 
    carPromotions,
    discountcode, 
    discountmessage, 
    appliedCouponId, 
    appliedDiscountAmount, 
    carId]);

  const resetDiscount = () => {
    setAppliedCouponId(null);
    setAppliedDiscountAmount(0);
    setAppliedDiscountPercentage(null);
    setTotal(baseTotal);
  }
  const handleDiscount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!carData?.car) return;

    const basePrice = baseTotal
    const inputCode = discountcode.trim().toUpperCase();

    if (!inputCode) {
      setDiscountMessage("กรุณากรอกรหัสส่วนลด");
      setShowDiscount(false);
      resetDiscount();
      return;
    }

    const matchedCoupon = coupons.find(
      (c) => c.coupon_code.toUpperCase() === inputCode
    );

    if (!matchedCoupon) {
      setDiscountMessage("รหัสส่วนลดไม่ถูกต้อง กรุณาลองใหม่");
      setShowDiscount(false);
      resetDiscount();
      return;
    }

    // เช็คการใช้งานส่วนลด
    if (!matchedCoupon.is_active) {
      setDiscountMessage("รหัสส่วนลดนี้ไม่สามารถใช้งานได้");
      setShowDiscount(false);
      resetDiscount();
      return;
    }

    // เช็ควันที่เริ่มต้นและสิ้นสุด
    const now = new Date();

    if (matchedCoupon.start_date) {
      const start = new Date(matchedCoupon.start_date);
      if (isNaN(start.getTime()) || now < start) {
        setDiscountMessage("รหัสส่วนลดนี้ยังไม่เริ่มใช้งาน");
        setShowDiscount(false);
        resetDiscount();
        return;
      }
    }

    if (matchedCoupon.end_date) {
      const end = new Date(matchedCoupon.end_date);
      if (isNaN(end.getTime()) || now > end) {
        setDiscountMessage("รหัสส่วนลดนี้หมดอายุแล้ว");
        setShowDiscount(false);
        resetDiscount();
        return;
      }
    }

    // เช็คโควต้าการใช้งาน
    if (
      matchedCoupon.usage_limit != null &&
      matchedCoupon.usage_limit > 0 &&
      matchedCoupon.used_count >= matchedCoupon.usage_limit
    ) {
      setDiscountMessage("รหัสส่วนลดนี้ใช้ครบโควต้าแล้ว");
      setShowDiscount(false);
      resetDiscount();
      return;
    }
    // ยอดขั้นต่ำ
    if (matchedCoupon.min_booking_amount) {
      const minAmount = Number(matchedCoupon.min_booking_amount);
      if (!isNaN(minAmount) && basePrice < minAmount) {
        setDiscountMessage(
          `ต้องมียอดขั้นต่ำ ฿${minAmount.toLocaleString("th-TH")} จึงใช้ส่วนลดนี้ได้`
        );
        setShowDiscount(false);
        resetDiscount();
        return;
      }
    }

    // คำนวณ
    let discountAmount = 0;
    const value = Number(matchedCoupon.discount_value);

    if (Number.isNaN(value) || value <= 0) {
      setDiscountMessage("ค่าส่วนลดไม่ถูกต้อง");
      setShowDiscount(false);
      resetDiscount();
      return;
    }

    if (matchedCoupon.discount_type === "fixed") {
      discountAmount = value;
    } else if (matchedCoupon.discount_type === "percent") {
      discountAmount = (basePrice * value) / 100;
      discountAmount = Math.round(discountAmount * 100) / 100;


      if (matchedCoupon.max_discount_amount) {
        const maxDisc = Number(matchedCoupon.max_discount_amount);
        if (!isNaN(maxDisc) && discountAmount > maxDisc) {
          discountAmount = maxDisc;
        }
      }
    }

    const newTotal = Math.max(0, basePrice - discountAmount);

    setAppliedCouponId(matchedCoupon.coupon_id);
    setAppliedDiscountAmount(discountAmount);
    setAppliedDiscountPercentage(
      matchedCoupon.discount_type === "percent" ? Number(matchedCoupon.discount_value) : null
    );
    setTotal(newTotal);
    setDiscountMessage(
      matchedCoupon.discount_type === "percent"
        ? `-฿ ${discountAmount.toLocaleString("th-TH", { minimumFractionDigits: 0 })} (${value}%)`
        : `-฿ ${discountAmount.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`
    );
    setShowDiscount(true);

  };

  const deleteDiscount = (e: React.FormEvent) => {
    e.preventDefault();

    setDiscountCode("");
    setShowDiscount(false);
    setDiscountMessage("");
    
    resetDiscount();
  };
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();

    if(!searchData){
      setError("ไม่พบข้อมูลการค้นหา");
      return;
    }
    if (!session) {
      router.replace('/login');
      return;
    }
    router.push(`/product/details/summary/driveInfo/${carId}`);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="text-center py-20">
          กำลังโหลดรายการรถ...
        </div>
      </div>
    );
  }

  if (error || !carData?.car) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="text-center py-20">
          {error}
        </div>
      </div>
    );
  }

  const car = carData.car;
  const mainImage = carData.images?.[0]?.car_image_url || "/images/car-placeholder.jpg";

  const locationDisplay = selectedBranch && cities.length > 0
  ? `${cities.find(c => c.city_id === selectedBranch.city_id)?.city_name || "-"}>${selectedBranch.branch_name || "-"}`
  : "-";

  return (
    <div className='min-h-screen flex items-center justify-center -mt-10 sm:px-5 sm:-mb-25 sm:-mt-15'>
      <div className='w-full max-w-7xl sm:p-3 lg:p-5 sm:rounded-2xl shadow-2xl sm:mt-30 sm:mb-15 lg:mt-15 lg:mb-0'>
        <Goback title="จองรถเช่า"/>
        <div className='flex flex-col lg:flex-row sm:gap-4'>
          {/* Left */}
          <div className='w-full lg:w-[50%]'>
            <div>
              <div className='overflow-hidde flex sm:flex-col'>
                {/* image */}
                <div className='relative w-[40%] sm:w-full shrink-0'>
                  <Image 
                    src={mainImage}
                    width={300} 
                    height={200} 
                    alt={`${car.car_brand} ${car.car_model}`}
                    className='w-full h-full sm:h-66 lg:h-77 object-cover sm:rounded-md'
                  />
                  {hasPromotion && carPromotions && (
                    <div className="absolute top-2 flex flex-col gap-1">
                      {carPromotions.map((promo) => (
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
                <div className='p-3 sm:p-4 flex flex-col flex-1'>
                  <h3 className='text-xl sm:text-2xl mb-1 sm:mb-0'>
                    {car.car_brand} {car.car_model} {car.car_year}
                  </h3>
                  <div className='flex flex-wrap items-start gap-2 sm:mt-1 text-xs sm:text-sm md:text-base'>
                    <span className="flex items-center gap-1">
                      <FaCar className="text-(--blue-primary) shrink-0" />
                      {car.class_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaCog className="text-(--blue-primary) shrink-0" />
                      {getTransmissionText(car.transmission)}
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
                  <hr className='my-2'/>
                  <div className='mb-2 sm:mb-4 space-y-1 text-xs sm:text-sm md:text-base'>
                    <div className='flex items-start gap-2'>
                      <FaCheck className='text-(--blue-primary) mt-0.5 border border-(--blue-primary) rounded-full p-0.5' />
                      <span>บริการรับส่งรถนอกสถานที่</span>
                    </div>
                    <div className='flex items-start gap-2'>
                      <FaCheck className='text-(--blue-primary) mt-0.5 border border-(--blue-primary) rounded-full p-0.5' />
                      <span>ประกันภัยคุ้มครอบ</span>
                    </div>
                    <div className='flex items-start gap-2'>
                      <FaCheck className='text-(--blue-primary) mt-0.5 border border-(--blue-primary) rounded-full p-0.5' />
                      <span>การันตีราคาเดียวกันหน้าร้าน</span>
                    </div>
                  </div>
                  <div className='mb-4 space-y-2 text-xs sm:text-sm md:text-base'>
                      <button className='w-45 sm:w-full bg-(--orange-primary) text-(--white) py-1 sm:py-2 rounded-full'>
                        ไม่ต้องใช้บัตรเครดิตจอง
                      </button>
                      <button className='w-45 sm:w-full bg-(--green-primary) text-(--white) py-1 sm:py-2 rounded-full'>
                        ต้องใช้เอกสารเพิ่มเติม
                      </button>
                  </div>
                  <div className='flex flex-row justify-between items-center'>
                    <Link href={`/product/details/reviews/${carId}`} className='flex items-center gap-2 min-w-0'>
                      <Image
                        src={company?.company_logo || 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                        alt={company?.company_name}
                        width={40}
                        height={40}
                        className='w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover shrink-0'
                      />
                      <div className='min-w-0'>
                        <p className='text-xs sm:text-sm md:text-base truncate'>{company?.company_name}</p>
                        <div className='flex items-center gap-1 mt-0.5'>
                          <FaStar className='text-(--orange-primary) w-3 h-3' />
                          <span className='text-[10px] sm:text-sm text-(--orange-primary) truncate'>8.5 ดีเยี่ยม</span>
                          <span className='text-[10px] truncate'>| (235)</span>
                        </div>
                      </div>
                    </Link>
                    <div className='text-right shrink-0'>
                      <p className='text-[10px] sm:text-sm'>สำหรับ {searchData?.rentalDays} วัน</p>
                      <p className='text-(--orange-primary) text-lg sm:text-xl xl:text-2xl'>{Number(car.car_price_per_day).toLocaleString('th-TH')}/วัน</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right */}
          <div className='w-full lg:w-[50%]'>
            {/* Info */}
            <div className='p-3 pt-0 sm:px-4 sm:py-4'>
              <div>
                <h3 className='text-base sm:text-lg font-semibold my-5 sm:mb-5 sm:mt-0'>รายละเอียดการจอง</h3>
                <div className='flex justify-between items-center gap-2'>
                  <div className='flex items-center gap-2 cursor-pointer' onClick={() => setShowDateTimeModal(true)}>
                    <BsCalendarWeek className='text-(--blue-primary) mb-0.5 shrink-0'/>
                    <p className='text-xs sm:text-sm'>
                        {formatDateTime(searchData?.pickupDate, searchData?.pickupTime)} -{" "}
                        {formatDateTime(searchData?.returnDate, searchData?.returnTime)}
                    </p>
                  </div>
                  <div>
                    <p className='text-(--blue-primary) text-xs sm:text-sm'>
                      {searchData?.rentalDays} วัน x ฿{Number(car.car_price_per_day).toLocaleString('th-TH')}
                    </p>
                  </div>
                </div>
                <hr className='my-3'/>
                
                <div className='flex justify-between items-center gap-2'>
                  <p className='text-xs sm:text-sm'>สถานที่รับ-ส่งรถ</p>
                  <p className='text-(--blue-primary) text-xs sm:text-sm'>
                    {locationDisplay}
                  </p>
                </div>
                <hr className='my-3'/>
                
                <div className='flex justify-between items-center'>
                  <p className='text-xs sm:text-sm'>ค่าบริการรับ-ส่งรถ</p>
                  <p className='text-(--blue-primary) text-xs sm:text-sm'>ฟรี</p>
                </div>
                <hr className='my-3'/>
                
                <div className='flex justify-between items-center'>
                  <p className='text-xs sm:text-sm'>ค่ารับส่งรถนอกเวลาทำการ</p>
                  <p className='text-(--blue-primary) text-xs sm:text-sm'>ฟรี</p>
                </div>
                <hr className='my-3'/>
                
                <div className='mt-5'>
                  <div className='flex gap-2'>
                    <div className='relative flex-1'>
                      <input
                        type="text"
                        placeholder="ใส่รหัสส่วนลด"
                        className='w-full p-3 border border-(--gray-light) rounded-md text-sm focus:border-(--blue-primary) focus:outline-none'
                        onChange={(e) => setDiscountCode(e.target.value)}
                        value={discountcode}
                      />
                      { discountcode && (
                        <div className='absolute right-3 top-1/2 -translate-y-1/2 text-(--white) bg-red-500 cursor-pointer border rounded-full text-xs p-0.5'>
                          <FaTimes 
                          onClick={deleteDiscount}
                          />
                        </div>
                      )}
                    </div>
                    <button onClick={handleDiscount} className='px-4 sm:px-6 py-3 bg-(--blue-primary) hover:bg-blue-700 text-(--white) rounded-md text-sm cursor-pointer'>
                      ใช้ส่วนลด
                    </button>
                  </div>
                </div>
                {discountmessage && (
                  <>
                    {showdiscount ? (
                      <div className='mt-4 text-sm flex justify-between'>
                        <p>ส่วนลดคูปอง</p>
                        <p className="text-(--blue-primary)">
                          {discountmessage}
                        </p>
                      </div>
                    ) : (
                      <p className="text-red-500 text-sm mt-4">
                        {discountmessage}
                      </p>
                    )}
                    <hr className="mt-3" />
                  </>
                )}
                {/* แสดงส่วนลดโปรโมชั่น */}
                {carPromotions && carPromotions.length > 0 && (
                  <div className="mt-4 text-sm space-y-1">
                    <p className="font-semibold text-(--blue-primary)">ส่วนลดโปรโมชั่น</p>
                    {carPromotions.map((promo) => (
                      <div key={promo.promo_id} className="flex justify-between">
                        <span>{promo.displayText}</span>
                        <span className="text-(--blue-primary)">
                          -฿{(baseTotal * (promo.discount_type === "percent" ? promo.discount_value / 100 : promo.discount_value / baseTotal)).toLocaleString("th-TH")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className='px-4 pb-4'>
              <div className='flex justify-between items-center font-bold text-sm sm:text-base mb-2'>
                <p>ยอดรวมสุทธิ</p>
                <p className='text-(--blue-primary)'>฿{total.toLocaleString('th-TH')}</p>
              </div>
              <hr className='my-4'/>
              
              <div className='bg-[#D2E5FF] rounded-md p-3 mb-4'>
                <div className='flex justify-between items-center mb-1'>
                  <p className='text-sm sm:text-base'>ค่ามัดจำจองล่วงหน้า</p>
                  <p className='text-sm sm:text-base'>
                    ฿{Number(car.car_deposit).toLocaleString('th-TH')}
                  </p>
                </div>
                <span className='text-xs'>ชำระ ณ วันที่รับรถเช่า และได้รับคืนเมื่อสิ้นสุดการเช่า</span>
              </div>
              <div className='bg-[#D2E5FF] rounded-md p-3 mb-4'>
                <div className='flex justify-between items-center mb-1'>
                  <p className='text-sm sm:text-base'>เงินประกันค้ำรถ</p>
                  <p className='text-sm sm:text-base'>
                    ฿{Number(car.car_insurance_fee).toLocaleString('th-TH')}
                  </p>
                </div>
                <span className='text-xs'>ชำระ ณ วันที่รับรถเช่า และได้รับคืนเมื่อสิ้นสุดการเช่า</span>
              </div>
              <button
                onClick={handleNext}
                className='w-full block text-center bg-(--blue-primary) hover:bg-blue-700 text-(--white) py-3 rounded-md cursor-pointer'
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* DateTime Modal */}
      <DateTimePickerModal
        isOpen={showDateTimeModal}
        onClose={() => setShowDateTimeModal(false)}
        initialPickupDate={searchData?.pickupDate}
        initialReturnDate={searchData?.returnDate}
        initialPickupTime={searchData?.pickupTime}
        initialReturnTime={searchData?.returnTime}
        onConfirm={(data) => {
          const updated = {
            ...searchData!,
            pickupDate: data.pickupDate,
            returnDate: data.returnDate,
            pickupTime: data.pickupTime,
            returnTime: data.returnTime,
            rentalDays: data.rentalDays,
          };
          setSearchData(updated);
          localStorage.setItem("SearchData", JSON.stringify(updated));
        }}
      />
    </div>
  );
}