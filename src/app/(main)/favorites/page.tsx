"use client";

import React from "react";
import Image from "next/image";
import { FaHeart, FaCar, FaCog, FaUser, FaSuitcase, FaCheck, FaStar } from "react-icons/fa";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function FavoritesPage() {
  const router = useRouter();
  const items = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-7xl bg-white">

        {/* Mobile Header */}
        <div
          className="md:hidden flex items-center p-2 
                     border-b border-gray-200 sticky top-0 bg-white z-50 shadow-lg"
        >
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition z-10"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
            รายการโปรด
          </h1>
        </div>

  <div className="hidden md:block w-full bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-8 py-12">
      
          <h1 className="text-4xl font-bold text-slate-900">รายการโปรด</h1>
      </div>
    </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8  md:pt-0">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {items.map((item) => (
              <div key={item} className="sm:rounded-md shadow-lg overflow-hidden flex sm:flex-col bg-white">

                {/* Image */}
                <div className="relative w-[40%] sm:w-full shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=764&auto=format&fit=crop"
                    width={300}
                    height={200}
                    alt="items-car"
                    className="w-full h-full sm:h-44 lg:h-48 xl:h-52 object-cover sm:rounded-tl-md sm:rounded-tr-md"
                  />
                  <div className="absolute top-2 bg-[var(--orange-primary)] text-white text-sm py-1 px-3 rounded-r-lg">
                    ลด 48%
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-xl mb-1">Mazda 2 2025</h3>
                    <button className="text-2xl">
                      <FaHeart className="text-[var(--gray-light)]" />
                    </button>
                  </div>

                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <FaCar className="text-[var(--blue-primary)]" />
                      <span>รถยนต์เล็ก</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCog className="text-[var(--blue-primary)]" />
                      <span>ออโต้</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaUser className="text-[var(--blue-primary)]" />
                      <span>5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaSuitcase className="text-[var(--blue-primary)]" />
                      <span>2</span>
                    </div>
                  </div>

                  <hr className="my-2" />

                  <div className="mb-2 space-y-1 text-xs sm:text-sm">
                    <div className="flex items-start gap-2">
                      <FaCheck className="text-[var(--blue-primary)] mt-0.5 border border-[var(--blue-primary)] rounded-full p-0.5" />
                      <span>บริการรับส่งรถนอกสถานที่</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaCheck className="text-[var(--blue-primary)] mt-0.5 border border-[var(--blue-primary)] rounded-full p-0.5" />
                      <span>ประกันภัยคุ้มครอง</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaCheck className="text-[var(--blue-primary)] mt-0.5 border border-[var(--blue-primary)] rounded-full p-0.5" />
                      <span>การันตีราคาเดียวกันหน้าร้าน</span>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2 text-xs sm:text-sm">
                    <button className="w-full bg-[var(--orange-primary)] text-white py-2 rounded-full">
                      ไม่ต้องใช้บัตรเครดิตจอง
                    </button>
                    <button className="w-full bg-[var(--green-primary)] text-white py-2 rounded-full">
                      ต้องใช้เอกสารเพิ่มเติม
                    </button>
                  </div>

                  <div className="flex justify-between mb-4">
                    <Link href="/product/details/reviews" className="flex">
                      <Image
                        src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=764&auto=format&fit=crop"
                        alt="สไมล์รถเช่า"
                        width={40}
                        height={40}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="ml-2">
                        <p className="text-xs sm:text-sm">สไมล์รถเช่า</p>
                        <div className="flex items-center gap-1 mt-2">
                          <FaStar className="text-[var(--orange-primary)] w-3 h-3" />
                          <span className="text-xs text-[var(--orange-primary)]">8.5 ดีเยี่ยม</span>
                          <span className="text-xs">| (235)</span>
                        </div>
                      </div>
                    </Link>

                    <div className="text-right shrink-0">
                      <p className="text-xs">สำหรับ 1 วัน</p>
                      <p className="text-[var(--orange-primary)] text-xl">฿1,999/วัน</p>
                    </div>
                  </div>

                  <Link
                    href="/product/details"
                    className="bg-[var(--blue-primary)] text-white w-full block px-5 py-2 rounded-md text-center shadow-md"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default FavoritesPage;
