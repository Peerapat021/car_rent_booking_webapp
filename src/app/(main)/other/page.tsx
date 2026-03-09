'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ChevronRight, Bell } from 'lucide-react';
import { MdTranslate } from "react-icons/md";
import { SlUser } from "react-icons/sl";
import { BsHeadset } from "react-icons/bs";
import { PiSealWarning } from "react-icons/pi";
import { useTranslation } from 'react-i18next';
import { signOut, useSession } from 'next-auth/react';

export default function ProfileSettings() {
  const { t, ready, i18n } = useTranslation();
  const { data: session } = useSession(); // 👈 เพิ่มตรงนี้

  if (!ready) {
    return <div className="p-10 text-center">กำลังโหลดภาษา...</div>;
  }

  const currentLanguageDisplay =
    i18n.language === 'th' ? 'ไทย' : 'English';

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: '/',
      });
    } catch (error) {
      console.error("Logout error:", error);
      alert("เกิดข้อผิดพลาดในการออกจากระบบ กรุณาลองใหม่");
    }
  };

  return (
    <div>
      <div className="bg-gray-50 py-5 px-2 md:p-6">
        <div className="flex flex-col md:grid gap-4 lg:gap-6">
          <div className="md:col-span-2 space-y-2 md:space-y-2">

            {/* ข้อมูลประจำตัว */}
            <Link
              href="/other/profile"
              className="w-full flex items-center justify-between bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-blue-50 transition-colors p-2 md:p-4 border border-gray-200"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <SlUser className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                </div>
                <h3 className="text-sm md:text-lg">
                  {t('personal_info')}
                </h3>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 ml-2 md:ml-4" />
            </Link>

            {/* การแจ้งเตือน */}
            <Link
              href="/other/notification"
              className="w-full flex items-center justify-between bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-blue-50 transition-colors p-2 md:p-4 border border-gray-200"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                </div>
                <h3 className="text-sm md:text-lg">
                  {t('notifications')}
                </h3>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 ml-2 md:ml-4" />
            </Link>

            {/* ภาษา */}
            <Link
              href="/other/language"
              className="w-full flex items-center justify-between bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-blue-50 transition-colors p-2 md:p-4 border border-gray-200"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <MdTranslate className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <h3 className="text-sm md:text-lg">
                  ภาษา / Language
                </h3>
              </div>
              <div className="flex items-center">
                <span className="text-xs md:text-sm text-gray-500 bg-gray-100 px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                  {currentLanguageDisplay}
                </span>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 ml-2 md:ml-4" />
              </div>
            </Link>

            {/* นโยบาย */}
            <Link
              href="/other/policy"
              className="w-full flex items-center justify-between bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-blue-50 transition-colors p-2 md:p-4 border border-gray-200"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <PiSealWarning className="w-6 h-6 text-blue-800" />
                </div>
                <h3 className="text-sm md:text-lg">
                  {t('policy')}
                </h3>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 ml-2 md:ml-4" />
            </Link>

            {/* ศูนย์ช่วยเหลือ */}
            <Link
              href="/other/help"
              className="w-full flex items-center justify-between bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-blue-50 transition-colors p-2 md:p-4 border border-gray-200"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <BsHeadset className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <h3 className="text-sm md:text-lg">
                  {t('help_center')}
                </h3>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 ml-2 md:ml-4" />
            </Link>

            {/* 👇 แสดงเฉพาะตอน Login แล้ว */}
            {session && (
              <div className="mt-4">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md p-3 md:p-4 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}