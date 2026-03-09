import React from 'react'
import Link from 'next/link'
import Image from 'next/image'


import Header from '@/components/Header'

function MessagePage() {

  const idcar = [
    {
      id: 1, thumbnail: "https://cdn.carsome.co.th/news/82.2-HONDA-CIVIC_11zon.jpg", name: 'honda 2 2017'
    },
    {
      id: 2, thumbnail: "https://cdn.carsome.co.th/news/82.2-HONDA-CIVIC_11zon.jpg", name: 'honda 2 2017'
    },
    {
      id: 3, thumbnail: "https://cdn.carsome.co.th/news/82.2-HONDA-CIVIC_11zon.jpg", name: 'honda 2 2017'
    },
  ]

  return (
    <div className="pb-30 sm:pb-0 sm:mt-15">
      <div className="sm:hidden">
        <Header />
      </div>
      <div className="pt-4 sm:pt-6 space-y-3 px-3 md:px-4">
        {idcar.map((item) => (
          <div key={item.id}>
            <Link href="/message/id">
              <div className="w-full bg-white rounded-2xl border border-gray-200/80 overflow-hidden p-4 md:p-5
                shadow-md hover:shadow-xl hover:-translate-y-0.5
                transition-all duration-300 ease-out">
                <div className="flex gap-4 lg:gap-6">
                  {/* รูปรถ */}
                  <div className="relative w-28 h-20 lg:w-56 lg:h-34 shrink-0 rounded-xl bg-gray-50 overflow-hidden">
                    <Image
                      src={item.thumbnail}
                      alt={item.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* รายละเอียดรถ */}
                  <div className="flex flex-col justify-center">
                    <div>
                      <h2 className="text-lg lg:text-2xl font-bold text-gray-800">{item.name}</h2>
                      <p className="text-gray-500 text-sm mt-1">
                        หมายเลขการจอง : <span className="text-sm lg:text-base font-semibold text-blue-500">{item.id}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}


      </div>
    </div>
  )
}

export default MessagePage
