"use client";

import { useEffect, useState } from "react";
import { Phone, Mail } from "lucide-react";
import Goback from "@/components/goback";
import { getCompany } from "@/lib/services/client/company/get";

export default function HelpCenterPage() {
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const data = await getCompany();
        // API returns array, take first item
        if (Array.isArray(data) && data.length > 0) {
          setCompanyData(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch company:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, []);

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl bg-white md:p-8 overflow-y-auto">

        {/* Mobile Header */}
        <Goback title="ศูนย์ช่วยเหลือ" />
        <div className="mx-5">

          {/* Desktop Header */}
          <h1 className="hidden md:block text-3xl font-bold text-gray-900 mb-6">
            ศูนย์ช่วยเหลือ
          </h1>

          {/* Section Title */}
          <h2 className="text-lg font-bold text-gray-800 mb-3">ติดต่อเรา</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">

              {/* Phone */}
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow transition cursor-pointer">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">
                    {companyData?.company_phone || "ไม่พบเบอร์โทรศัพท์"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow transition cursor-pointer">
                <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg">
                  <Mail className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">
                    {companyData?.company_email || "ไม่พบอีเมล"}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Service time */}
          <p className="mt-5 text-xs text-gray-400">
            {companyData?.business_hours
              ? `เวลาให้บริการ: ${companyData.business_hours}`
              : "เวลาให้บริการตั้งแต่ 9.00 น. - 21.00 น."}
          </p>

        </div>
      </div>
    </div>
  );
}
