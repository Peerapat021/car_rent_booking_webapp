'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { FaHeart } from "react-icons/fa";
import Link from 'next/link';
import { getCompany } from '@/lib/services/client/company/get';

function Header() {
  const [companyName, setCompanyName] = useState('รถเช่า');
  const [companyLogo, setCompanyLogo] = useState('/logocar.png');

  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await getCompany();
        const info = Array.isArray(data) ? data[0] : data;
        if (info?.company_name) setCompanyName(info.company_name);
        if (info?.company_logo) setCompanyLogo(info.company_logo);
      } catch (err) {
        console.error('Load company failed', err);
      }
    }
    loadCompany();
  }, []);

  return (
    <div className='w-full h-16 bg-linear-to-r from-[#0068F9] to-[#00347D] sticky top-0 sm:top-[60px] z-50'>
      <div className='flex justify-between items-center h-full px-4 lg:px-8 shadow-lg'>
        <div className='flex items-center gap-3'>
          <div className='relative w-12 h-12 rounded-lg overflow-hidden'>
            <Image src={companyLogo} alt="โลโก้" fill className='object-contain' />
          </div>
          <h2 className='text-white'>{companyName}</h2>
        </div>
        <Link href="/favorites">
          <FaHeart className="text-gray-200 text-lg" />
        </Link>
      </div>
    </div>
  )
}

export default Header