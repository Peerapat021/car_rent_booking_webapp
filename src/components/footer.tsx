import Link from 'next/link'
import { FaFacebookF, FaEnvelope } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { SiLine } from "react-icons/si";

export default function Footer() {
  return (
       <footer className="bg-gray-900 mt-20 text-white py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between gap-8">
        {/* ช่องทางการติดตาม */}
        <div>
          <h2 className="font-bold text-lg mb-4">ช่องทางการติดตาม</h2>
          <ul className="space-y-2">
            <li>
              <a
                href="mailto:support@example.com"
                className="flex items-center gap-2 underline hover:text-gray-300"
              >
                <FaEnvelope />
                <span>support@example.com</span>
              </a>
            </li>
            <li>
              <a
                href="tel:+6600000000"
                className="flex items-center gap-2 underline hover:text-gray-300"
              >
                <FaPhone />
                <span>+66 0 0000 0000</span>
              </a>
            </li>
            <li>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 underline hover:text-gray-300"
              >
                <FaFacebookF />
                <span>facebook.com/yourpage</span>
              </a>
            </li>
            <li>
              <a
                href="https://line.me/ti/p/yourlineid"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 underline hover:text-gray-300"
              >
                <SiLine />
                <span>yourlineid</span>
              </a>
            </li>
          </ul>
        </div>

        {/* ศูนย์ช่วยเหลือ */}
        <div>
          <h2 className="font-bold text-lg mb-4">ศูนย์ช่วยเหลือ</h2>
          <ul className="space-y-2">
            <li>
              <a
                href="tel:+0987654321"
                className="flex items-center gap-2 underline hover:text-gray-300"
              >
                <FaPhone />
                <span>098-765-4321</span>
              </a>
            </li>
              <li>
              <a
                href="https://line.me/ti/p/yourlineid"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 underline hover:text-gray-300"
              >
                <SiLine />
                <span>yourlineid</span>
              </a>
            </li>
          </ul>
        </div>

        {/* นโยบายความเป็นส่วนตัว */}
        <div>
          <h2 className="font-bold text-lg mb-4">นโยบายความเป็นส่วนตัว</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy-policy" className="underline hover:text-gray-300">
                นโยบายความเป็นส่วนตัว
              </Link>
            </li>
            <li>
              <Link href="/terms" className="underline hover:text-gray-300">
                ข้อกำหนดและเงื่อนไข
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center text-gray-400 mt-8">
        © 2025 YourCompany. สงวนลิขสิทธิ์.
      </div>
    </footer> 
  )
}
