"use client"

import React from 'react'
import { FaStar } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import Goback from '@/components/goback'

export default function ProductReviewPage() {
  const reviews = [1, 2, 3, 4, 5]

  const router = useRouter();
  const ratinginfo = [
    { name: 'ดีมาก', count: 50, percentage: 80 },
    { name: 'ปานกลาง', count: 30, percentage: 50 },
    { name: 'น้อย', count: 10, percentage: 20 }
  ]

  const StarRating = ({ rating } : { rating : number }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-(--blue-primary) text-(--blue-primary)' : 'fill-(--gray-light) text-(--gray-light)'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto mb-5 sm:px-5 sm:py-15 sm:-mb-25">
      <div className="sm:rounded-lg md:rounded-2xl shadow-lg max-w-6xl mx-auto">
        <Goback title="คะแนนรีวิว"/>
        {/* header Rating*/}
        <div className="p-6 mb-0 sm:mb-6">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-8 lg:gap-12">
            <div className="flex items-center gap-4 pb-4 md:pb-0 md:min-w-50 border-b md:border-b-0 md:border-r">
              <div className='flex flex-col justify-center items-center w-full'>
                <h3 className="text-base sm:text-lg font-semibold mb-1">คะแนน</h3>
                <div className="flex items-center gap-2">
                  <StarRating rating={3} />
                  <span className="text-sm sm:text-base font-semibol">4.8</span>
                </div>
                <div className="text-sm sm:text-base mt-1">รีวิว : 80</div>
              </div>
            </div>

            {/* Rating Bars */}
            <div className="flex-1 space-y-3">
              {ratinginfo.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 min-w-15">
                    <span className="text-xs sm:text-sm">{item.name}</span>
                  </div>
                  <div className="flex-1 bg-(--gray-light) h-3 overflow-hidden">
                    <div
                      className="bg-(--blue-primary) h-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm min-w-7.5 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div>
          <div className="p-4">
            <h2 className="text-lg sm:text-xl font-semibold">คะแนนและรีวิว</h2>
          </div>

          <div className="divide-y">
            {reviews.map((id) => (
              <div key={id} className="p-4 mx-2">
                <div className="flex items-start gap-3">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm sm:text-base font-semibold">วิโรพร ส.</span>
                    </div>
                    
                    <div className="mb-2">
                      <StarRating rating={5} />
                    </div>

                    <div className="text-sm sm:text-base mb-2">
                      <p className='mb-1'>Mazda 2 2017</p>
                      <p>รับรถ : กุมภาพันธ์ 2019</p>
                    </div>

                    <p className="text-sm sm:text-base">
                      รถใหม่สะอาดเจ้าของใจดี สุภาพมากครับ
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}