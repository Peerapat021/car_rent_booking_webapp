'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Goback from '@/components/goback';
export default function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const router = useRouter();
  

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
     <Goback title="การแจ้งเตือนของแอพ" />

      {/* Content Container */}
      <div className="flex justify-center items-start py-6 sm:py-8 md:py-12 px-4 sm:px-6">
        <div className="w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl">
          {/* Push Notifications Toggle */}
          <h1 className='font-semibold text-lg md:text-2xl'>การแจ้งเตือนของแอพ</h1>
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer rounded-t-lg mt-6">
            <span className="text-sm sm:text-base md:text-lg text-gray-900 font-medium">
              โปรโมชั่น
            </span>
            <button
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`relative inline-flex h-7 sm:h-8 w-14 sm:w-16 md:w-18 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                pushEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              aria-label="Toggle promotional notifications"
              aria-pressed={pushEnabled}
            >
              <span
                className={`inline-block h-5 sm:h-6 w-5 sm:w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  pushEnabled ? 'translate-x-7 sm:translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer rounded-b-lg">
            <span className="text-sm sm:text-base md:text-lg text-gray-900 font-medium">
              ข้อความ
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-7 sm:h-8 w-14 sm:w-16 md:w-18 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              aria-label="Toggle message notifications"
              aria-pressed={soundEnabled}
            >
              <span
                className={`inline-block h-5 sm:h-6 w-5 sm:w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  soundEnabled ? 'translate-x-7 sm:translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}