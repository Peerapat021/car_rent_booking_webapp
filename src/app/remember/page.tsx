"use client";

import React, { useState } from "react";

function RememberPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Phone:", phone);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>

      {/* ====================  MOBILE VERSION  ==================== */}
      <div className="md:hidden min-h-screen bg-gray-200 flex flex-col">

        {/* Top Header (Mobile) */}
        <div className="bg-white shadow-sm py-4 text-center font-semibold text-gray-900 text-base">
          ลืมรหัสผ่าน
        </div>

        {/* Form container */}
        <form onSubmit={handleSubmit} className="px-4 pt-6 pb-10 bg-white mt-2">

          <h2 className="text-base font-semibold text-gray-900 mb-4">ลืมรหัสผ่าน</h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              หมายเลขโทรศัพท์
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 0912345678"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl 
                         bg-white text-sm focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </form>

        {/* Bottom Fixed Button */}
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-3px_10px_rgba(0,0,0,0.1)] p-4">
          <button
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                       text-white font-semibold py-3 rounded-xl text-sm 
                       flex items-center justify-center gap-2 shadow-sm"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                กำลังส่ง...
              </>
            ) : (
              "ขอรหัสผ่าน"
            )}
          </button>
        </div>
      </div>

      {/* ====================  DESKTOP VERSION (ของเดิม)  ==================== */}
      <div className="hidden md:flex min-h-screen bg-gray-100 items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">ลืมรหัสผ่าน</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                หมายเลขโทรศัพท์
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 0912345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none 
                       focus:ring-2 focus:ring-blue-500 text-sm bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                       transition-all text-white font-semibold py-3 rounded-xl text-sm 
                       flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  กำลังส่ง...
                </>
              ) : (
                "ขอรหัสผ่าน"
              )}
            </button>
          </form>
        </div>
      </div>

    </>
  );
}

export default RememberPage;
