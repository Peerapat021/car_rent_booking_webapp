'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { FaUser, FaSignOutAlt, FaCar } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { AiOutlineHome } from "react-icons/ai";
import { LuBookMarked } from "react-icons/lu";
import { IoMdChatbubbles } from "react-icons/io";
import { BsGridFill } from "react-icons/bs";
import Image from "next/image";
import { getCompany } from "@/lib/services/client/company/get";

interface Company {
  company_name: string;
  company_logo: string;
}

const CustomCarIcon = () => {
  return (
    <div className="relative transition-all duration-300">
      <div
        className="w-22 h-22 rounded-full flex flex-col items-center justify-center shadow-xl"
        style={{
          background: 'linear-gradient(180deg, #38bdf8 0%, #0068F9 40%, #00347D 100%)',
          boxShadow: '0 4px 24px rgba(0,104,249,0.5), 0 0 0 3px rgba(255,255,255,0.15)',
        }}
      >
        <Image
          src="/logocar.png"
          alt="car"
          width={60}
          height={60}
          className="-mt-4"
        />
        <span className="text-white text-[13px] -mt-3 font-semibold leading-tight tracking-wide">
          ค้นหารถเช่า
        </span>
      </div>
    </div>
  );
};

export default function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const [factCompany, setFactCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const baseNavItems = [
    { name: 'หน้าแรก', href: '/', icon: <AiOutlineHome /> },
    { name: 'การจอง', href: '/cart', icon: <LuBookMarked /> },
    {
      name: 'ค้นหารถเช่า',
      href: '/product',
      icon: null,
      isCustom: true,
    },
    { name: 'ข้อความ', href: '/message', icon: <IoMdChatbubbles /> },
    { name: 'อื่นๆ', href: '/other', icon: <BsGridFill /> },
  ];

  // ✅ เพิ่มปุ่มเข้าสู่ระบบเฉพาะตอนยังไม่ login
  const navItems = session?.user
    ? baseNavItems
    : [
        ...baseNavItems,
        { name: 'เข้าสู่ระบบ', href: '/login', icon: <FaUser /> },
      ];

  const mainMobileItems = navItems.slice(0, 5);
  const moreMobileItems = navItems.slice(5);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await getCompany();

        const companyData =
          response?.data ??
          response?.[0] ??
          response ??
          null;

        setFactCompany(companyData);
      } catch (error) {
        console.error("โหลด company ไม่สำเร็จ", error);
      } finally {
        setLoadingCompany(false);
      }
    };

    fetchCompany();
  }, []);

  return (
    <>
      {/* ===== TOP NAVBAR ===== */}
      <div className="hidden sm:block fixed top-0 left-0 right-0 z-50">
        <div className="max-w-[960px] mx-auto">
          <div
            className="flex items-center justify-between h-[60px] px-5"
            style={{
              background: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,104,249,0.12), 0 1px 0 rgba(0,104,249,0.08)',
              borderBottom: '1.5px solid rgba(0,104,249,0.1)',
            }}
          >
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0068F9 0%, #00347D 100%)' }}
              >
                {factCompany?.company_logo ? (
                  <img src={factCompany.company_logo} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  <FaCar className="text-white text-sm" />
                )}
              </div>
              <span
                className="text-base font-black hidden sm:block"
                style={{
                  letterSpacing: '0.2em',
                  background: 'linear-gradient(135deg, #0068F9 0%, #00347D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {loadingCompany
                  ? "Loading..."
                  : factCompany?.company_name ?? "RentCar"}
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                    style={
                      isActive
                        ? {
                            background: 'linear-gradient(135deg, #0068F9 0%, #0047c8 100%)',
                            color: '#ffffff',
                            boxShadow: '0 2px 10px rgba(0,104,249,0.35)',
                          }
                        : { color: '#374151' }
                    }
                  >
                    {!isActive && (
                      <span
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: 'rgba(0,104,249,0.07)' }}
                      />
                    )}

                    {item.isCustom ? (
                      <>
                        <FaCar
                          className="text-sm relative z-10"
                          style={{ color: isActive ? '#fff' : '#0068F9' }}
                        />
                        <span className="relative z-10">{item.name}</span>
                      </>
                    ) : (
                      <>
                        <span
                          className="text-sm relative z-10"
                          style={{ color: isActive ? '#fff' : '#0068F9' }}
                        >
                          {item.icon}
                        </span>
                        <span className="relative z-10">{item.name}</span>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 backdrop-blur-xl bg-opacity-90 dark:bg-opacity-90 relative shadow-[0_-4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex justify-around items-end py-2 px-4">
            {mainMobileItems.map((item) => {
              const isActive = pathname === item.href;

              if (item.isCustom) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center flex-1 relative"
                  >
                    <div className="h-8"></div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-15 z-20">
                      <CustomCarIcon />
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-200 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <div className={`text-base transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </div>
                  <p className="text-xs text-center">{item.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}