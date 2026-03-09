"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaCar, FaCog, FaUser, FaStar, FaSearch, FaFilter } from "react-icons/fa";
import { getCars } from "@/lib/services/client/admin/cars/get";
import { getCarClasses } from "@/lib/services/client/admin/car_classes/get";
import { getBranches } from "@/lib/services/client/admin/branches/get";

// Hide scrollbar styles
const hideScrollbarStyle = `
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

interface Car {
  car_id: number;
  class_id: number | null;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_color: string;
  car_license_plate: string;
  car_status: "available" | "maintenance";
  car_mileage: number;
  car_image_cover: string | null;
  create_at_car: string;
  transmission?: string | null;
  seat_count?: number | null;
  branch_id?: number | null;
  car_price_per_day?: string | null;
}

interface CarClass {
  class_id: number | null;
  class_code: string;
  class_name: string;
  class_description?: string | null;
  base_daily_price: string;
  deposit_amount: string;
  sort_order?: number;
  seats: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
}

export default function Filter() {
  const [cars, setCars] = useState<Car[]>([]);
  const [carClasses, setCarClasses] = useState<CarClass[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    sortPrice: "",
    class_id: "",
    brand: "",
    gear: "",
    province: "",
    seats: "",
  });

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedCars, fetchedClasses, fetchedBranches] = await Promise.all([
          getCars(),
          getCarClasses(),
          getBranches(),
        ]);
        setCars(fetchedCars as Car[]);
        setCarClasses(
          fetchedClasses.filter((cls: CarClass) => cls.is_active)
        );
        setBranches(fetchedBranches);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getCarClass = (class_id: number): CarClass | undefined => {
    return carClasses.find((cls) => cls.class_id === class_id);
  };

  const getBranchName = (branch_id?: number | null): string => {
    if (!branch_id) return "ไม่ระบุสาขา";
    const branch = branches.find((b) => b.branch_id === branch_id);
    return branch ? branch.branch_name : "ไม่ระบุสาขา";
  };

  const getDailyPrice = (class_id: number): number => {
    const cls = getCarClass(class_id);
    return cls ? parseFloat(cls.base_daily_price) : 0;
  };

  const getSeats = (class_id: number): number => {
    const cls = getCarClass(class_id);
    return cls?.seats || 4;
  };

  const getClassName = (class_id: number): string => {
    const cls = getCarClass(class_id);
    return cls?.class_name || "ไม่ระบุประเภท";
  };

  const uniqueBrands = Array.from(new Set(cars.map((car) => car.car_brand))).sort();

  const filteredCars = cars
    .filter((car) => car.car_status === "available")
    .filter((car) => {
      const carClass = getCarClass(car.class_id!);
      if (!carClass) return false;

      if (filters.class_id && car.class_id !== Number(filters.class_id))
        return false;
      if (filters.brand && car.car_brand !== filters.brand) return false;
      if (filters.seats && getSeats(car.class_id!) !== Number(filters.seats))
        return false;

      if (search) {
        const searchLower = search.toLowerCase();
        const fullText = `${car.car_brand} ${car.car_model} ${car.car_year} ${getClassName(car.class_id!)}`;
        if (!fullText.toLowerCase().includes(searchLower)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = parseFloat(a.car_price_per_day || getDailyPrice(a.class_id!).toString());
      const priceB = parseFloat(b.car_price_per_day || getDailyPrice(b.class_id!).toString());
      if (filters.sortPrice === "asc") return priceA - priceB;
      if (filters.sortPrice === "desc") return priceB - priceA;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500 text-lg">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="mx-4 sm:mx-6 md:mx-10">
      <style>{hideScrollbarStyle}</style>
      {/* SEARCH + FILTER BUTTON */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ค้นหาชื่อรถ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 pr-10 border rounded-lg"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <button
          className="p-2 bg-blue-500 text-white rounded-lg flex items-center gap-1 cursor-pointer hover:bg-blue-600 transition"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> ตัวกรอง
        </button>
      </div>

      {/* FILTER BAR */}
      {showFilters && (
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pt-2 mb-4 pb-2 hide-scrollbar">
          <select
            name="sortPrice"
            value={filters.sortPrice}
            onChange={handleChange}
            className="p-2 border rounded-lg min-w-[140px] flex-shrink-0 text-sm"
          >
            <option value="">ราคารถ</option>
            <option value="asc">ราคาจากน้อยไปมาก</option>
            <option value="desc">ราคาจากมากไปน้อย</option>
          </select>

          <select
            name="class_id"
            value={filters.class_id}
            onChange={handleChange}
            className="p-2 border rounded-lg min-w-[140px] flex-shrink-0 text-sm"
          >
            <option value="">ประเภทรถ</option>
            {carClasses
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((cls) => (
                <option key={cls.class_id} value={cls.class_id!}>
                  {cls.class_name}
                </option>
              ))}
          </select>

          <select
            name="brand"
            value={filters.brand}
            onChange={handleChange}
            className="p-2 border rounded-lg min-w-[140px] flex-shrink-0 text-sm"
          >
            <option value="">ยี่ห้อ</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            name="gear"
            value={filters.gear}
            onChange={handleChange}
            className="p-2 border rounded-lg min-w-[140px] flex-shrink-0 text-sm"
          >
            <option value="">เกียร์</option>
            <option value="auto">ออโต้</option>
            <option value="manual">ธรรมดา</option>
          </select>

          <select
            name="province"
            value={filters.province}
            onChange={handleChange}
            className="p-2 border rounded-lg min-w-[140px] flex-shrink-0 text-sm"
          >
            <option value="">จังหวัด</option>
            <option value="bangkok">กรุงเทพ</option>
            <option value="chiangmai">เชียงใหม่</option>
          </select>

          <select
            name="seats"
            value={filters.seats}
            onChange={handleChange}
            className="p-2 border rounded-lg min-w-[140px] flex-shrink-0 text-sm"
          >
            <option value="">จำนวนที่นั่ง</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="7">7</option>
          </select>
        </div>
      )}

      {/* DISPLAY CARS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-4 mb-8">
        {filteredCars.length === 0 ? (
          <div className="col-span-full flex justify-center items-center h-40">
            <p className="text-center font-extrabold text-gray-500">ไม่พบรถตามเงื่อนไข</p>
          </div>
        ) : (
          filteredCars.map((car) => {
            const carClass = getCarClass(car.class_id!);
            if (!carClass) return null;

            const price = parseFloat(car.car_price_per_day || carClass.base_daily_price);

            return (
              <Link
                key={car.car_id}
                href={`/product/details/${car.car_id}`}
                className="rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] cursor-pointer block"
              >
                <div className="relative w-full aspect-4/2 bg-gray-100">
                  {car.car_image_cover ? (
                    <Image
                      src={car.car_image_cover}
                      fill
                      alt={`${car.car_brand} ${car.car_model}`}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                      ไม่มีรูปภาพ
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">
                      {car.car_brand} {car.car_model} {car.car_year}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-blue-500 text-xs">
                      <FaCar /> {carClass.class_name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-500 text-xs">
                      <FaCog /> {car.transmission === "manual" ? "ธรรมดา" : "ออโต้"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-500 text-xs">
                      <FaUser /> {car.seat_count ?? carClass.seats}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span>ราคา</span>
                    <span className="font-bold">฿{price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs break-words max-w-[70%]">
                      {getBranchName(car.branch_id)}
                    </span>
                    <span className="text-[#FFD700] inline-flex items-center gap-1 text-sm">
                      <FaStar /> 5
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}