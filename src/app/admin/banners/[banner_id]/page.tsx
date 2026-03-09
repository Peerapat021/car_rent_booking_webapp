// src/app/admin/banners/[banner_id]/page.tsx
'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FaArrowLeft, FaSave, FaTrash, FaImage, FaPlus, FaTimes,
  FaEdit, FaCalendarAlt, FaInfoCircle, FaLink, FaSortNumericDown,
} from 'react-icons/fa';

import { getBannerById } from '@/lib/services/client/admin/banners/get';
import { postBanner } from '@/lib/services/client/admin/banners/post'; // สำหรับสร้างใหม่

type Tab = 'general' | 'images';

export default function BannerDetailPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? Number(session.user.id) : 1;

  const params = useParams<{ banner_id: string }>();
  const router = useRouter();
  const isNew = params.banner_id === 'new';
  const bannerIdFromUrl = isNew ? null : Number(params.banner_id);

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [currentBannerId, setCurrentBannerId] = useState<number | null>(bannerIdFromUrl);
  const [bannerCreated, setBannerCreated] = useState(!isNew);

  // Form Data หลัก (ตรงกับ schema banners)
  const [formData, setFormData] = useState({
    banner_title: '',
    banner_content: '',
    banner_link_url: '',
    banner_link_target: '_self' as '_self' | '_blank',
    banner_button_text: '',
    banner_order: '0',
    banner_start_date: '',
    banner_end_date: '',
    banner_status: 'draft' as 'draft' | 'published' | 'inactive',
  });

  // รูปภาพ
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        if (!isNew && currentBannerId) {
          const bannerRes = await getBannerById(currentBannerId);
          const banner = bannerRes.banner || bannerRes;

          setFormData({
            banner_title: banner.banner_title || '',
            banner_content: banner.banner_content || '',
            banner_link_url: banner.banner_link_url || '',
            banner_link_target: banner.banner_link_target || '_self',
            banner_button_text: banner.banner_button_text || '',
            banner_order: banner.banner_order?.toString() ?? '0',
            banner_start_date: banner.banner_start_date
              ? new Date(banner.banner_start_date).toISOString().slice(0, 16)
              : '',
            banner_end_date: banner.banner_end_date
              ? new Date(banner.banner_end_date).toISOString().slice(0, 16)
              : '',
            banner_status: banner.banner_status || 'draft',
          });

          if (banner.banner_image_url) {
            setImagePreview(banner.banner_image_url);
            setExistingImageUrl(banner.banner_image_url);
          }

          setBannerCreated(true);
          setCurrentBannerId(banner.banner_id);
        }
      } catch (err: any) {
        setError(err.message || 'โหลดข้อมูลแบนเนอร์ล้มเหลว');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [currentBannerId, isNew]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์ใหญ่เกิน 5MB');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!formData.banner_title.trim() || !formData.banner_content.trim()) {
      return alert('กรุณากรอกชื่อและเนื้อหาแบนเนอร์');
    }

    if (!confirm(isNew ? 'ยืนยันการสร้างแบนเนอร์ใหม่?' : 'ยืนยันการบันทึกการแก้ไข?')) return;

    setSaving(true);
    setError(null);

    const form = new FormData();
    form.append('banner_title', formData.banner_title.trim());
    form.append('banner_content', formData.banner_content.trim());
    form.append('banner_link_url', formData.banner_link_url.trim() || '');
    form.append('banner_link_target', formData.banner_link_target);
    form.append('banner_button_text', formData.banner_button_text.trim() || '');
    form.append('banner_order', formData.banner_order);
    form.append('banner_start_date', formData.banner_start_date || '');
    form.append('banner_end_date', formData.banner_end_date || '');
    form.append('banner_status', formData.banner_status);
    form.append('banner_created_by', String(currentUserId));

    if (imageFile) {
      form.append('banner_image', imageFile);
    } else if (existingImageUrl) {
      form.append('banner_image_url', existingImageUrl);
    }

    try {
      let res: any;

      if (isNew) {
        res = await postBanner(form);
        const newId = res.banner?.banner_id || res.banner_id;
        if (newId) {
          setCurrentBannerId(newId);
          setBannerCreated(true);
          router.replace(`/admin/banners/${newId}`, { scroll: false });
        }
      } else if (currentBannerId) {
        // ถ้ามี putBanner ให้ใช้ putBanner(currentBannerId, form)
        // ถ้ายังไม่มี ให้ใช้ fetch PUT ตรง ๆ หรือเพิ่มฟังก์ชัน putBanner
        const putRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/banners/${currentBannerId}`, {
          method: 'PUT',
          body: form,
        });

        if (!putRes.ok) {
          const errText = await putRes.text();
          throw new Error(errText || 'อัปเดตไม่สำเร็จ');
        }
        res = await putRes.json();
      }

      if (imageFile && res.banner?.banner_image_url) {
        setExistingImageUrl(res.banner.banner_image_url);
        setImagePreview(res.banner.banner_image_url);
        setImageFile(null);
      }

      alert(isNew ? 'สร้างแบนเนอร์สำเร็จ' : 'บันทึกสำเร็จ');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="px-6 py-5 border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                  <FaImage size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isNew && !bannerCreated ? 'เพิ่มแบนเนอร์ใหม่' : `แบนเนอร์: ${formData.banner_title || '—'}`}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    สถานะ: {formData.banner_status === 'published' ? 'เผยแพร่แล้ว' : formData.banner_status === 'draft' ? 'แบบร่าง' : 'ปิดใช้งาน'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <FaArrowLeft className="inline mr-2" /> กลับ
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition ${saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  <FaSave />
                  {saving ? 'กำลังบันทึก...' : (isNew && !bannerCreated ? 'สร้างแบนเนอร์' : 'บันทึก')}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b overflow-x-auto bg-gray-50">
            {[
              { id: 'general', label: 'ข้อมูลหลัก', icon: FaInfoCircle },
              { id: 'images', label: 'รูปภาพ', icon: FaImage },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-purple-600 text-purple-700 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow border p-6 lg:p-8 space-y-10">
          {activeTab === 'general' && (
            <section className="space-y-8">
              <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
                <FaInfoCircle className="text-purple-600" /> ข้อมูลแบนเนอร์หลัก
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ชื่อแบนเนอร์ */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อแบนเนอร์ <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="banner_title"
                    value={formData.banner_title}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                    placeholder="เช่น โปรโมชั่นเช่ารถราคาพิเศษ"
                  />
                </div>

                {/* เนื้อหา */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เนื้อหาแบนเนอร์ <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    name="banner_content"
                    value={formData.banner_content}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                    placeholder="ข้อความหลักที่แสดงบนแบนเนอร์ (รองรับ HTML ได้ถ้า backend อนุญาต)"
                  />
                </div>

                {/* ลิงก์ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์เมื่อคลิก</label>
                  <input
                    name="banner_link_url"
                    value={formData.banner_link_url}
                    onChange={handleChange}
                    type="url"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                    placeholder="https://..."
                  />
                </div>

                {/* วิธีเปิดลิงก์ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เปิดลิงก์ใน</label>
                  <select
                    name="banner_link_target"
                    value={formData.banner_link_target}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                  >
                    <option value="_self">ในแท็บเดียวกัน</option>
                    <option value="_blank">แท็บใหม่</option>
                  </select>
                </div>

                {/* ข้อความปุ่ม */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความปุ่ม (ถ้ามี)</label>
                  <input
                    name="banner_button_text"
                    value={formData.banner_button_text}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                    placeholder="เช่น ดูรายละเอียด, ลงทะเบียนเลย"
                  />
                </div>

                {/* ลำดับ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ลำดับการแสดง <FaSortNumericDown className="inline text-purple-600" />
                  </label>
                  <input
                    name="banner_order"
                    value={formData.banner_order}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                    placeholder="0 = แสดงก่อน"
                  />
                </div>

                {/* วันที่เริ่ม */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่เริ่มแสดง <FaCalendarAlt className="inline text-purple-600" />
                  </label>
                  <input
                    name="banner_start_date"
                    value={formData.banner_start_date}
                    onChange={handleChange}
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                  />
                </div>

                {/* วันที่สิ้นสุด */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่สิ้นสุดแสดง <FaCalendarAlt className="inline text-purple-600" />
                  </label>
                  <input
                    name="banner_end_date"
                    value={formData.banner_end_date}
                    onChange={handleChange}
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                  />
                </div>

                {/* สถานะ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                  <select
                    name="banner_status"
                    value={formData.banner_status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-purple-500 focus:ring-purple-500 outline-none transition"
                  >
                    <option value="draft">แบบร่าง (ยังไม่เผยแพร่)</option>
                    <option value="published">เผยแพร่แล้ว</option>
                    <option value="inactive">ปิดใช้งาน</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'images' && bannerCreated && (
            <section className="space-y-8">
              <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
                <FaImage className="text-indigo-600" /> รูปภาพแบนเนอร์
              </h2>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-indigo-400 transition">
                <label className="cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <FaPlus className="mx-auto text-5xl text-indigo-400" />
                    <p className="text-lg font-medium text-gray-700">
                      คลิกเพื่อเลือกหรือลากวางรูปภาพ
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF — สูงสุด 5MB</p>
                  </div>
                </label>
              </div>

              {(imagePreview || existingImageUrl) && (
                <div className="relative max-w-md mx-auto">
                  <img
                    src={imagePreview || existingImageUrl!}
                    alt="Banner preview"
                    className="w-full h-64 object-cover rounded-lg border shadow-md"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-700 transition"
                    title="ลบรูปภาพ"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              )}

              {!imagePreview && !existingImageUrl && (
                <div className="text-center py-12 text-gray-500">
                  ยังไม่มีรูปภาพแบนเนอร์
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}