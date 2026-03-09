"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Goback from "@/components/goback";
import { getUserById } from "@/lib/services/client/users/get";
import { putUserProfile } from "@/lib/services/client/users/put";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 1. Initial State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 2. Fetch User Data Function
  const fetchUserData = useCallback(async () => {
    // ต้องมี session ID ถึงจะโหลด
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const user = await getUserById(session.user.id);

      // แยกชื่อ-นามสกุลจาก name (เอาคำแรกเป็นชื่อ ที่เหลือเป็นนามสกุล)
      const nameParts = (user.name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData({
        firstName,
        lastName,
        email: user.email || "",
        phone: user.user_phone || "",
      });
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // 3. Effect for Authorization & Data Fetching
  useEffect(() => {
    // รอจนกว่า session จะโหลดเสร็จ (loading -> authenticated/unauthenticated)
    if (status === "loading") return;

    // ลบการเช็ค unauthenticated ออกตามคำขอ
    // if (status === "unauthenticated") {
    //   router.replace("/login");
    //   return;
    // }

    if (session?.user?.id) {
      fetchUserData();
    }
  }, [status, session?.user?.id, fetchUserData]);

  // 4. Input Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 5. Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Validation เบื้องต้น
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();

      if (!firstName) {
        throw new Error("กรุณากรอกชื่อ");
      }
      if (!lastName) {
        throw new Error("กรุณากรอกนามสกุล");
      }

      // รวมชื่อ + นามสกุล เป็น name เดียวส่ง API (DB เก็บ field เดียว)
      const fullName = `${firstName} ${lastName}`;

      // เรียก service function สำหรับ update
      await putUserProfile({
        id: session?.user?.id as string | number,
        name: fullName,
        email: formData.email.trim(),
        user_phone: formData.phone.trim() || null,
        user_role: session?.user?.role || "customer",
      });

      // Success
      setSuccess("บันทึกข้อมูลสำเร็จ!");

      // อัพเดท session (ถ้าใช้ update ของ next-auth) หรือ refresh หน้า
      router.refresh(); // หรือ router.back() ตาม flow ที่ต้องการ

      // Delay เล็กน้อยก่อนกลับ (ถ้าต้องการ)
      setTimeout(() => {
        // router.back(); 
        setSuccess(null); // เคลียร์ข้อความ
      }, 2000);

    } catch (err: any) {
      console.error("Update Error:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header via Goback component */}
      <div className="md:hidden">
        <Goback title="แก้ไขข้อมูลส่วนตัว" />
      </div>

      <div className="flex flex-col items-center justify-center md:p-8">
        <div className="w-full md:max-w-lg bg-white md:rounded-2xl md:shadow-xl p-6 md:p-10 min-h-screen md:min-h-0">

          {/* Desktop Header */}
          <h1 className="hidden md:block text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            แก้ไขข้อมูลส่วนตัว
          </h1>

          {/* Mobile Header (In-content) */}
          <h3 className="md:hidden text-xl font-bold text-gray-800 mb-6">
            ข้อมูลส่วนตัว
          </h3>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
              <p className="font-bold">เกิดข้อผิดพลาด</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg text-sm">
              <p className="font-bold">สำเร็จ</p>
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="ชื่อ"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="นามสกุล"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล <span className="text-xs text-gray-400 font-normal">(แก้ไขไม่ได้)</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0xxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className={`w-full py-3 px-6 rounded-xl text-white font-medium shadow-md transition-all transform active:scale-95
                  ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"}`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  </span>
                ) : (
                  "บันทึกข้อมูล"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}