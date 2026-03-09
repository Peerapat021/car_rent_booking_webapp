"use client";
import React, { useState, useEffect } from "react";
import { FaHeart, FaCar, FaCog, FaUser } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import DragScroll from "../ui/DragScroll";
import { getPopularCars } from "@/lib/services/client/popular/get";

interface PopularCar {
  car_id: number;
  car_brand: string;
  car_model: string;
  car_image_cover: string | null;
  seat_count: number | null;
  fuel_type: string | null;
  transmission: string | null;
  branch_name: string;
  booking_count: number;
}

export default function Popular() {
  const [cars, setCars] = useState<PopularCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPopularCars = async () => {
      try {
        // ใช้ service เรียก API popular
        const data = await getPopularCars();
        setCars(data);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        console.error("Fetch popular cars error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPopularCars();
  }, []);

  if (loading) {
    return (
      <div className="py-6">
        <h1 className="lg:text-3xl md:text-2xl text-xl font-semibold mb-4">
          ได้รับความนิยม
        </h1>
        <div className="text-center text-gray-500">กำลังโหลดรถ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <h1 className="lg:text-3xl md:text-2xl text-xl font-semibold mb-4">
          ได้รับความนิยม
        </h1>
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="py-6">
        <h1 className="lg:text-3xl md:text-2xl text-xl font-semibold mb-4">
          ได้รับความนิยม
        </h1>
        <div className="text-center text-gray-600">ยังไม่มีรถในระบบ</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="lg:text-3xl md:text-2xl text-xl font-semibold">
          ได้รับความนิยม
        </h1>
        {/* <Link href="/favorites" className="text-blue-500 text-sm md:text-base hover:underline">
          ทั้งหมด
        </Link> */}
      </div>

      <DragScroll
        className="flex gap-4 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        {cars.map((car) => (
          <Link
            key={car.car_id}
            href={`/product/details/${car.car_id}`}
            className="shrink-0 w-44 md:w-58 lg:w-64 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] bg-white"
          >
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={car.car_image_cover || "/images/car-placeholder.jpg"}
                fill
                alt={`${car.car_brand} ${car.car_model}`}
                className="object-contain"
              />
            </div>

            <div className="px-3 py-3">
              <div className="flex justify-between items-center pb-1">
                <h3 className="text-sm md:text-base lg:text-lg font-medium truncate">
                  {car.car_brand} {car.car_model}
                </h3>
                <FaHeart className="text-gray-300 hover:text-red-500 cursor-pointer transition-colors" />
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs md:text-sm inline-flex items-center gap-1 text-blue-600">
                  <FaCar /> {car.fuel_type === "diesel" ? "ดีเซล" : car.fuel_type === "hybrid" ? "ไฮบริด" : car.fuel_type === "electric" ? "ไฟฟ้า" : "เบนซิน"}
                </span>
                <span className="text-xs md:text-sm inline-flex items-center gap-1 text-blue-600">
                  <FaCog /> {car.transmission === "manual" ? "เกียร์ธรรมดา" : "ออโต้"}
                </span>
                <span className="text-xs md:text-sm inline-flex items-center gap-1 text-blue-600">
                  <FaUser /> {car.seat_count || 5}
                </span>
              </div>

              <span className="text-gray-500 text-xs block">
                {car.branch_name}
              </span>
            </div>
          </Link>
        ))}
      </DragScroll>
    </div>
  );
}