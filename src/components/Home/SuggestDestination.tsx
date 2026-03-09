'use client';
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import DragScroll from "../ui/DragScroll";
import { getCities } from "@/lib/services/client/cities/get";

interface City {
  city_id: number;
  city_name: string;
  city_code: string | null;
  city_postal_code: string | null;
  city_status: 'active' | 'inactive';
  created_at: string;
}

function SuggestDestination() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const data = await getCities();
        // กรองเฉพาะเมืองที่ active
        const activeCities = data.filter((c: City) => c.city_status === 'active');
        setCities(activeCities);
      } catch (err) {
        console.error("Failed to load cities:", err);
        setCities([]);
      } finally {
        setLoading(false);
      }
    };
    loadCities();
  }, []);

  if (loading) {
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-semibold">ปลายทางแนะนำ</h1>
        </div>
        <div className="flex gap-4 pb-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-80 md:w-120 rounded-2xl overflow-hidden bg-gray-200 animate-pulse aspect-4/3 md:aspect-6/3"
            />
          ))}
        </div>
      </>
    );
  }

  if (cities.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold">ปลายทางแนะนำ</h1>
      </div>
      <DragScroll className="flex gap-4 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        {cities.map((city) => (
          <Link
            key={city.city_id}
            href={`/cars?city=${city.city_id}`}
            className="shrink-0 w-80 md:w-120 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]"
          >
            <div className="relative w-full aspect-4/3 md:aspect-6/3">
              <Image
                src="https://img.th.my-best.com/product_images/0fbd685714d7fcd6d95bd0522b6f5ccb.png"
                fill
                alt={city.city_name}
                className="object-cover"
              />
            </div>

            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-xl">{city.city_name}</h3>
                {city.city_code && (
                  <span className="text-sm text-gray-500">{city.city_code}</span>
                )}
              </div>
              <span className="text-blue-500">ดูรถที่พร้อมให้บริการ</span>
            </div>
          </Link>
        ))}
      </DragScroll>
    </>
  );
}

export default SuggestDestination;
