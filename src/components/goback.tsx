import React from 'react'
import { useRouter } from 'next/navigation'
import { FaChevronLeft, FaHeart } from 'react-icons/fa'

export default function goback({ title }: { title: string }) {
    const router = useRouter();
  return (
    <div className="sm:hidden sticky top-0 z-50 bg-(--white) shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] p-4 h-16 flex justify-between items-center gap-3">
        <button onClick={() => router.back()} className='cursor-pointer'>
            <FaChevronLeft />
        </button>
        <h1 className="text-base">{title}</h1>
        <button className='text-2xl cursor-pointer'>
            <FaHeart className='text-(--gray-light) hover:text-gray-400' />
        </button>
    </div>
  )
}