"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  FaBars, FaUser, FaHome, FaCar, FaCalendarCheck, FaKey,
  FaCreditCard, FaTags, FaFileContract, FaImages, FaClipboardCheck,
  FaMoneyBillWave, FaTools, FaUsers, FaBell, FaCalendar, FaFileInvoice,
  FaChevronDown, FaChevronRight, FaCog
} from "react-icons/fa";
import SignOutButton from "./SingOutButton";

const menuItems = [
  { name: "หน้าแรก", href: "/staff", icon: <FaHome /> },
  { name: "ปฏิทิน", href: "/staff/calendar", icon: <FaCalendar /> },
  {
    name: "การจองและการเช่า", icon: <FaCalendarCheck />,
    subItems: [
      { name: "การจอง", href: "/staff/bookings", icon: <FaCalendarCheck /> },
      { name: "สัญญาเช่า", href: "/staff/invoices", icon: <FaFileInvoice /> },
      { name: "เช็คสภาพรถ", href: "/staff/checklists", icon: <FaClipboardCheck /> },
      { name: "รูปภาพเช็คสภาพรถ", href: "/staff/checklistImages", icon: <FaClipboardCheck /> },
    ]
  },
  {
    name: "การจัดการรถ", icon: <FaCar />,
    subItems: [
      { name: "รถ", href: "/staff/cars", icon: <FaCar /> },
      { name: "รูปรถ", href: "/staff/carImage", icon: <FaImages /> },
    ]
  },
  {
    name: "การจัดการเงิน", icon: <FaCreditCard />,
    subItems: [
      { name: "การชำระเงิน", href: "/staff/payments", icon: <FaCreditCard /> },
      { name: "ค่าบริการเพิ่มเติม", href: "/staff/extra_charges", icon: <FaMoneyBillWave /> },
      { name: "โปรโมชั่น", href: "/staff/promotions", icon: <FaTags /> },
    ]
  },
  { name: "ผู้ใช้", href: "/staff/users", icon: <FaUsers /> },
  { name: "การแจ้งเตือน", href: "/staff/notificationLogs", icon: <FaBell /> },
];

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  // เปิด dropdown อัตโนมัติถ้าตรงกับ path
  useEffect(() => {
    const newOpenDropdowns: string[] = [];

    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActive = item.subItems.some((sub) => sub.href === pathname);
        if (hasActive) newOpenDropdowns.push(item.name);
      }
    });

    setOpenDropdowns(newOpenDropdowns);
  }, [pathname]);

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => pathname === href;

  const hasActiveChild = (subItems: any[]) =>
    subItems?.some(item => pathname === item.href);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="fixed top-4 left-4 z-50 sm:hidden p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBars size={20} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white dark:bg-gray-900 shadow-lg 
        transition-transform duration-300 overflow-y-auto 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}
      >
        <div className="flex flex-col h-full px-4 py-6">

          {/* Title */}
          <div className="mb-8 mt-12 sm:mt-0">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Staff Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ระบบจัดการรถเช่า
            </p>
          </div>

          {/* Menu */}
          <ul className="space-y-2 font-medium flex-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                {item.subItems ? (
                  <>
                    {/* Dropdown Button */}
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`flex items-center justify-between w-full gap-2 p-2 rounded-lg transition-colors 
                        ${hasActiveChild(item.subItems)
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>

                      {openDropdowns.includes(item.name)
                        ? <FaChevronDown size={12} />
                        : <FaChevronRight size={12} />
                      }
                    </button>

                    {/* Smooth Dropdown */}
                    <ul
                      className={`ml-4 space-y-1 overflow-hidden transition-all duration-300 
                      ${openDropdowns.includes(item.name)
                          ? "max-h-96 opacity-100 mt-2"
                          : "max-h-0 opacity-0 mt-0"
                        }`}
                    >
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <a
                            href={subItem.href}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-sm 
                              ${isActive(subItem.href)
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-semibold"
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                              }
                            `}
                          >
                            {subItem.icon}
                            <span>{subItem.name}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <a
                    href={item.href}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors 
                      ${isActive(item.href)
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>

          <hr className="my-4 border-gray-300 dark:border-gray-700" />

          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
            <FaUser className="text-gray-600 dark:text-gray-300" />
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {user?.name || "Staff User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>

          {/* Sign Out */}
          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
