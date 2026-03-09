'use client';
import { FaHeart, FaCar, FaCog, FaUser } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import DragScroll from "../ui/DragScroll";
function Favorites() {
  return (
    <>
      {/* รายการโปรด*/}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="lg:text-3xl md:text-2xl text-xl font-semibold">รายการโปรด</h1>
          {/* <Link href="/favorites" className="text-blue-500 text-sm md:text-base">
            ทั้งหมด
          </Link> */}
        </div>

        <DragScroll
          className="flex gap-4 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
        >
          <Link
            href="/product/details"
            className="shrink-0 w-44 md:w-58 lg:w-64 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]"
          >
            <div className="relative w-full aspect-4/3">
              <Image
                src="https://img.th.my-best.com/product_images/0fbd685714d7fcd6d95bd0522b6f5ccb.png"
                fill
                alt=""
                className="object-optain"
              />
            </div>
            <div className="px-3 py-3  lg:space-y-0">
              <div className="flex justify-between items-center pb-1 md:pb-0">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">Mazda 2 2017</h3>
                <FaHeart className="text-gray-300" />
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs md:text-sm lg:text-base inline-flex items-center gap-1 text-blue-500">
                  <FaCar /> รถขนาดเล็ก
                </span>
                <span className="text-xs md:text-sm lg:text-base inline-flex items-center gap-1 text-blue-500">
                  <FaCog /> ออโต้
                </span>
                <span className="text-xs md:text-sm lg:text-base inline-flex items-center gap-1 text-blue-500">
                  <FaUser /> 5
                </span>
              </div>
              <span className="text-gray-500 text-xs md:text-xs lg:text-sm">สไมล์รถเช่า</span>
            </div>
          </Link>



        </DragScroll>
      </div>
    </>
  )
}

export default Favorites

