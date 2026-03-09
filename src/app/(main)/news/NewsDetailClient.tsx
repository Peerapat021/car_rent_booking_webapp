'use client'

import { useState, useEffect } from 'react';
import { Calendar, Tag, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from "lucide-react";
import Image from 'next/image';
import { getActivityById } from '@/lib/services/client/activities/get';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

interface Activity {
  activities_id: number;
  activities_title: string;
  activities_content: string;
  activities_image_url: string | null;
  activities_start_date: string | null;
  activities_end_date: string | null;
  activities_status: 'draft' | 'published' | 'inactive';
  activities_created_by: number;
  activities_created_at: string;
  activities_updated_at: string;
}

// ────────────────────────────────────────────────
// Helper: format date range
// ────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const s = start ? new Date(start).toLocaleDateString('th-TH', opts) : null;
  const e = end ? new Date(end).toLocaleDateString('th-TH', opts) : null;
  if (s && e) return `${s} – ${e}`;
  if (s) return `เริ่ม ${s}`;
  if (e) return `ถึง ${e}`;
  return null;
}

export default function NewsDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError('ไม่พบรหัสกิจกรรม');
        setLoading(false);
        return;
      }

      try {
        const data = await getActivityById(Number(id));
        setActivity(data);
      } catch (err) {
        console.error('Failed to fetch activity:', err);
        setError('ไม่สามารถโหลดข้อมูลกิจกรรมได้');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // ────────────────────────────────────────────────
  // Loading State
  // ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-gray-50/50 min-h-screen font-sans antialiased flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // Error State
  // ────────────────────────────────────────────────

  if (error || !activity) {
    return (
      <div className="bg-gray-50/50 min-h-screen font-sans antialiased">
        <div className="flex items-center gap-4 p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-50">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
            ข่าวสาร & กิจกรรม
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-red-500 text-lg">{error || 'ไม่พบข้อมูลกิจกรรม'}</p>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // Detail View
  // ────────────────────────────────────────────────

  const dateRange = formatDateRange(activity.activities_start_date, activity.activities_end_date);

  return (
    <div className="bg-gray-50/50 min-h-screen font-sans antialiased">
      {/* Header */}
      <div className="flex items-center gap-4 p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-50">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        </button>
        <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
          {activity.activities_title}
        </h1>
      </div>

      {/* Main Content */}
      <main className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Image */}
          {activity.activities_image_url && (
            <div className="relative w-full h-48 sm:h-72 md:h-96 rounded-lg sm:rounded-2xl overflow-hidden shadow-lg sm:shadow-xl bg-gray-100 mb-6 sm:mb-10 lg:mb-12 ring-1 ring-gray-200/50">
              <Image
                src={activity.activities_image_url}
                alt={activity.activities_title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Title & Date */}
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-full flex-shrink-0">
                <Tag size={14} className="sm:w-4 sm:h-4" />
                <span>กิจกรรม</span>
              </span>
              {dateRange && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600">
                  <Calendar size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{dateRange}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-3 sm:mb-4">
              {activity.activities_title}
            </h1>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 lg:p-10">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <CheckCircle2 size={24} className="text-blue-600 flex-shrink-0 sm:w-7 sm:h-7" />
                <span>รายละเอียดกิจกรรม</span>
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div
                  className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: activity.activities_content }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}