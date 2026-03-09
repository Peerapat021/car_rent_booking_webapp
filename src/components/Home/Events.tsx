'use client';
import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import DragScroll from "../ui/DragScroll";
import { getActivities } from '@/lib/services/client/activities/get';

interface Activity {
  activities_id: number;
  activities_title: string;
  activities_content: string;
  activities_image_url: string | null;
  activities_start_date: string | null;
  activities_end_date: string | null;
  activities_status: 'draft' | 'published' | 'inactive';
}

function Events() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getActivities();
        const published = data.filter(
          (act: Activity) => act.activities_status === 'published'
        );
        setActivities(published);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      }
    }
    fetchData();
  }, []);

  if (activities.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="lg:text-3xl md:text-2xl text-xl font-semibold">กิจกรรมข่าวสาร</h1>
      </div>

      <DragScroll
        className="flex gap-4 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        {activities.map((act) => (
          <Link
            key={act.activities_id}
            href={`/news?id=${act.activities_id}`}
            className="shrink-0 w-80 md:w-100 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]"
          >
            <div className="relative w-full aspect-6/3 bg-gray-100">
              {act.activities_image_url ? (
                <Image
                  src={act.activities_image_url}
                  fill
                  alt={act.activities_title}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  ไม่มีรูปภาพ
                </div>
              )}
            </div>
            <div className="px-3 py-3 lg:space-y-0">
              <div className="flex justify-between items-center pb-1 md:pb-0">
                <h3 className="text-sm md:text-base lg:text-lg font-medium truncate">
                  {act.activities_title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </DragScroll>
    </div>
  );
}

export default Events;
