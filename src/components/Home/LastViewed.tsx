'use client';
import React, { useState, useEffect } from "react";
import { FaHeart, FaCar, FaCog, FaUser } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import DragScroll from "../ui/DragScroll";
import { getCars } from "@/lib/services/client/cars/get";
import { getBranches } from "@/lib/services/client/branches/get";
import { useSession } from "next-auth/react";

interface Car {
  car_id: number;
  car_brand: string;
  car_model: string;
  car_image_cover: string | null;
  seat_count: number | null;
  fuel_type: string | null;
  transmission: string | null;
  branch_name?: string;
}

function LastViewed() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const loadLastViewed = async () => {
      try {
        // อ่าน car_id จาก localStorage (แยกตาม user)
        const userId = session?.user?.id || "guest";
        const KEY = `lastViewedCars_${userId}`;
        const viewedIds: number[] = JSON.parse(localStorage.getItem(KEY) || "[]");

        if (viewedIds.length === 0) {
          setLoading(false);
          return;
        }

        // ดึงข้อมูลรถทั้งหมดจาก service ที่มีอยู่แล้ว
        const [allCars, branchesData] = await Promise.all([
          getCars(),
          getBranches(),
        ]);

        // กรองเฉพาะรถที่ดูล่าสุด ตามลำดับใน localStorage
        const lastViewedCars = viewedIds
          .map((id) => allCars.find((c: any) => c.car_id === id))
          .filter(Boolean)
          .map((car: any) => {
            const branch = branchesData.find((br: any) => br.branch_id === car.branch_id);
            return {
              ...car,
              branch_name: branch?.branch_name || "ไม่ระบุสาขา",
            };
          }) as Car[];

        setCars(lastViewedCars);
      } catch (err) {
        console.error("Load last viewed error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLastViewed();
  }, [session]);

  // ไม่แสดงอะไรถ้าไม่มีประวัติ หรือกำลังโหลด
  if (loading || cars.length === 0) {
    return null;
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="lg:text-3xl md:text-2xl text-xl font-semibold">เข้าดูล่าสุด</h1>
        </div>

        <DragScroll className="flex gap-4 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
          {cars.map((car) => (
            <Link
              key={car.car_id}
              href={`/product/details/${car.car_id}`}
              className="shrink-0 w-44 md:w-58 lg:w-64 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] bg-white"
            >
              <div className="relative w-full aspect-4/3">
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
                  <FaHeart className="text-gray-300" />
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs md:text-sm inline-flex items-center gap-1 text-blue-500">
                    <FaCar /> {car.fuel_type === "diesel" ? "ดีเซล" : car.fuel_type === "hybrid" ? "ไฮบริด" : car.fuel_type === "electric" ? "ไฟฟ้า" : "เบนซิน"}
                  </span>
                  <span className="text-xs md:text-sm inline-flex items-center gap-1 text-blue-500">
                    <FaCog /> {car.transmission === "manual" ? "เกียร์ธรรมดา" : "ออโต้"}
                  </span>
                  <span className="text-xs md:text-sm inline-flex items-center gap-1 text-blue-500">
                    <FaUser /> {car.seat_count || 5}
                  </span>
                </div>
                <span className="text-gray-500 text-xs block mt-1">
                  {car.branch_name}
                </span>
              </div>
            </Link>
          ))}
        </DragScroll>
      </div>
    </>
  );
}

export default LastViewed;

