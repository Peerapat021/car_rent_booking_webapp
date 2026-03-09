"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaBars, FaUser, FaHome, FaCar, FaCalendarCheck,
  FaCreditCard, FaTags, FaUsers, FaBell, FaCalendar,
  FaUserFriends, FaPlus,
  FaChevronRight, FaCog, FaTicketAlt,
  FaSignInAlt, FaHistory, FaExclamationTriangle, FaInfoCircle, FaBullhorn, FaCalendarAlt, FaAd, FaHeart
} from "react-icons/fa";
import { FaLocationDot, FaMapPin } from "react-icons/fa6";
import SignOutButton from "./SingOutButton";
import { getUnreadCount } from "@/lib/services/client/admin/notifications/unread-count";
import { getCompany } from "@/lib/services/client/admin/company/get";

const menuItems = [
  { name: "หน้าแรก", href: "/admin/dashboard", icon: <FaHome /> },
  { name: "การแจ้งเตือน", href: "/admin/notifications", icon: <FaBell /> },
  { name: "ปฏิทิน", href: "/admin/calendar", icon: <FaCalendar /> },
  { name: "จองรถ", href: "/admin/schedule", icon: <FaPlus /> },
  {
    name: "การจองและการเช่า", icon: <FaCalendarCheck />,
    subItems: [
      { name: "การจอง", href: "/admin/booking_overview", icon: <FaInfoCircle /> },
    ]
  },
  {
    name: "การจัดการรถ", icon: <FaCar />,
    subItems: [
      { name: "รถ", href: "/admin/cars", icon: <FaCar /> },
      { name: "คราส", href: "/admin/car_classes", icon: <FaCar /> },
    ]
  },
  {
    name: "การตลาด", icon: <FaCreditCard />,
    subItems: [
      { name: "โปรโมชั่น", href: "/admin/promotions", icon: <FaTags /> },
      { name: "คูปอง", href: "/admin/coupons", icon: <FaTicketAlt /> },
      { name: "ประวัติการใช้คูปอง", href: "/admin/couponUsages", icon: <FaHistory /> },
      { name: "รถยอดนิยม", href: "/admin/favorites", icon: <FaHeart /> },
    ]
  },
  {
    name: "การจัดการผู้ใช้", icon: <FaUser />,
    subItems: [
      { name: "ลูกค้า", href: "/admin/users", icon: <FaUsers /> },
      { name: "ทีมงาน", href: "/admin/team_members", icon: <FaUserFriends /> },
    ]
  },
  {
    name: "ประชาสัมพันธ์", icon: <FaBullhorn />,
    subItems: [
      { name: "กิจกรรม", href: "/admin/activities", icon: <FaCalendarAlt /> },
      { name: "แบนเนอร์", href: "/admin/banners", icon: <FaAd /> },
    ]
  },
  {
    name: "ตั้งค่า", icon: <FaCog />,
    subItems: [
      { name: "จังหวัด", href: "/admin/cities", icon: <FaMapPin /> },
      { name: "สาขา", href: "/admin/branches", icon: <FaLocationDot /> },
      { name: "ตั้งค่าระบบ", href: "/admin/systemSettings", icon: <FaCog /> },
    ]
  },
  {
    name: "บันทึกระบบ", icon: <FaHistory />,
    subItems: [
      { name: "บันทึกการเข้าสู่ระบบ", href: "/admin/login_logs", icon: <FaSignInAlt /> },
      { name: "ประวัติการทำรายการ", href: "/admin/notificationlogs", icon: <FaHistory /> },
      { name: "บันทึกข้อผิดพลาดระบบ", href: "/admin/error_logs", icon: <FaExclamationTriangle /> },
    ]
  },
];

interface Company {
  company_name: string;
}

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [companyData, setCompanyData] = useState<Company | null>(null);

  useEffect(() => {
    const open: string[] = [];
    menuItems.forEach(item => {
      if (item.subItems) {
        const active = item.subItems.some(sub =>
          pathname === sub.href || pathname.startsWith(sub.href + "/")
        );
        if (active) open.push(item.name);
      }
    });
    setOpenDropdowns(prev => [...new Set([...prev, ...open])]);
  }, [pathname]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await getUnreadCount();
        setUnreadCount(data.unread);
      } catch (err) { console.error(err); }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await getCompany();
        setCompanyData(data);
      } catch (err) { console.error(err); }
    };
    fetchCompany();
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const hasActiveChild = (subs: any[]) =>
    subs.some(s => isActive(s.href));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');

        .cs { font-family: 'Sarabun', sans-serif; }

        .cs-nav::-webkit-scrollbar { width: 0; }

        .cs-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 8px 10px;
          border-radius: 5px;
          font-size: 15px;
          font-weight: 500;
          color: #4b5563;
          background: transparent;
          border: none;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
          position: relative;
          text-align: left;
        }
        .cs-item:hover { background: #f3f4f6; color: #111827; }
        .cs-item:hover .cs-icon { color: #1d4ed8; }

        .cs-item.is-active {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
        }
        .cs-item.is-active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; height: 60%;
          width: 3px;
          background: #1d4ed8;
          border-radius: 0 2px 2px 0;
        }
        .cs-item.is-active .cs-icon { color: #1d4ed8; }

        .cs-item.parent-open { color: #1d4ed8; }
        .cs-item.parent-open .cs-icon { color: #1d4ed8; }

        .cs-icon {
          font-size: 15px;
          color: #9ca3af;
          width: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: color 0.12s;
        }

        .cs-label { flex: 1; }

        .cs-chevron {
          font-size: 9px;
          color: #d1d5db;
          transition: transform 0.18s ease;
          flex-shrink: 0;
        }
        .cs-chevron.open { transform: rotate(90deg); }

        .cs-submenu-wrap {
          overflow: hidden;
          transition: max-height 0.22s ease;
        }
        .cs-submenu {
          padding: 2px 0 3px 16px;
          margin: 1px 0 1px 10px;
          border-left: 1.5px solid #e5e7eb;
        }

        .cs-subitem {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 5px;
          font-size: 14px;
          font-weight: 400;
          color: #6b7280;
          text-decoration: none;
          transition: background 0.12s, color 0.12s;
          position: relative;
        }
        .cs-subitem:hover { background: #f9fafb; color: #111827; }
        .cs-subitem.is-active {
          color: #1d4ed8;
          font-weight: 600;
          background: #eff6ff;
        }
        .cs-subitem.is-active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; height: 60%;
          width: 3px;
          background: #1d4ed8;
          border-radius: 0 2px 2px 0;
        }

        .cs-badge {
          min-width: 18px; height: 18px;
          padding: 0 4px;
          border-radius: 99px;
          background: #dc2626;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }

        .cs-section-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #9ca3af;
          padding: 10px 10px 4px;
        }
      `}</style>

      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 sm:hidden bg-white border border-gray-200 shadow-sm rounded-md p-2.5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBars size={14} className="text-gray-600" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 sm:hidden bg-black/25"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`cs fixed top-0 left-0 z-40 w-[252px] h-screen flex flex-col bg-white
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}
        style={{ borderRight: "1px solid #e5e7eb" }}
      >
        {/* Header / Logo */}
        <div className="flex items-center gap-3 px-4 h-[62px] flex-shrink-0"
          style={{ borderBottom: "1px solid #f0f0f0" }}>
          <div className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center flex-shrink-0"
            style={{ background: "#1d4ed8" }}>
            <FaCar size={14} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, letterSpacing: "0.03em" }}>
              ระบบจัดการ
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {companyData?.company_name || "Company Name"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="cs-nav flex-1 overflow-y-auto px-3 py-3 space-y-[1px]">
          {menuItems.map(item => {
            const isGroup = !!item.subItems;
            const parentActive = isGroup && hasActiveChild(item.subItems!);
            const isDropOpen = openDropdowns.includes(item.name);

            return (
              <div key={item.name}>
                {isGroup ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`cs-item ${parentActive ? "parent-open" : ""}`}
                    >
                      <span className="cs-icon">{item.icon}</span>
                      <span className="cs-label">{item.name}</span>
                      <FaChevronRight className={`cs-chevron ${isDropOpen ? "open" : ""}`} />
                    </button>

                    <div
                      className="cs-submenu-wrap"
                      style={{ maxHeight: isDropOpen ? "400px" : "0" }}
                    >
                      <div className="cs-submenu">
                        {item.subItems!.map(sub => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`cs-subitem ${isActive(sub.href) ? "is-active" : ""}`}
                          >
                            <span style={{ fontSize: 11, color: isActive(sub.href) ? "#1d4ed8" : "#c4c9d4" }}>
                              {sub.icon}
                            </span>
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    className={`cs-item ${isActive(item.href!) ? "is-active" : ""}`}
                  >
                    <span className="cs-icon">{item.icon}</span>
                    <span className="cs-label">{item.name}</span>
                    {item.name === "การแจ้งเตือน" && unreadCount > 0 && (
                      <span className="cs-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: "1px solid #f0f0f0" }}>
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-[6px]"
            style={{ background: "#f9fafb", border: "1px solid #f0f0f0" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#dbeafe" }}>
              <FaUser size={12} color="#1d4ed8" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name || "Admin User"}
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>
                {user?.role || "ผู้ดูแลระบบ"}
              </p>
            </div>
          </div>

          <SignOutButton />
        </div>
      </aside>
    </>
  );
}