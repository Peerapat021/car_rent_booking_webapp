// src/app/admin/systemSettings/SettingComponent.tsx
"use client";

import { useState, useEffect, JSX } from "react";
import { toast } from "react-hot-toast";
import {
  FaCheckCircle,
  FaSpinner,
  FaBuilding,
  FaFileContract,
  FaCar,
  FaCreditCard,
  FaLock,
  FaCog,
} from "react-icons/fa";
import { updateSystemSettings } from "@/lib/services/client/admin/system_settings/patch";
import { putCompany } from "@/lib/services/client/admin/company/put";

const TABS = [
  { id: "company", label: "ข้อมูลบริษัท", icon: <FaBuilding size={13} /> },
  { id: "booking", label: "เงื่อนไขการจอง", icon: <FaFileContract size={13} /> },
  { id: "vehicles", label: "ยานพาหนะ", icon: <FaCar size={13} /> },
  { id: "payments", label: "ชำระเงิน", icon: <FaCreditCard size={13} /> },
  { id: "security", label: "ความปลอดภัย", icon: <FaLock size={13} /> },
  { id: "system", label: "ระบบ", icon: <FaCog size={13} /> },
];

// ── UI Primitives ─────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900/20
        ${value ? "bg-gray-900" : "bg-gray-200"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow 
          ring-0 transition duration-200 ease-in-out
          ${value ? "translate-x-5" : "translate-x-0.5"}
        `}
      />
    </button>
  );
}

function NumInput({
  value,
  onChange,
  min = 0,
  max,
  unit,
  step = 1,
}: {
  value: number | string;
  onChange: (v: number | string) => void;
  min?: number;
  max?: number;
  unit?: string;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-32 md:w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-sm font-medium text-gray-700 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
      />
      {unit && <span className="text-sm text-gray-500 font-medium">{unit}</span>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full max-w-lg rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 outline-none transition ${className}`}
    />
  );
}

// ── Row & Section ─────────────────────────────────────────────────────────────

function Row({
  label,
  sub,
  children,
  indent = false,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
  indent?: boolean;
}) {
  return (
    <div
      className={`
        flex flex-col sm:flex-row sm:items-start sm:justify-between 
        border-b border-gray-100 px-5 md:px-6 py-4 
        hover:bg-gray-50/70 transition-colors
        ${indent ? "pl-10 md:pl-14 bg-gray-50/30" : ""}
      `}
    >
      <div className="flex-1 mb-3 sm:mb-0 pr-0 sm:pr-8">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="mt-1 text-xs text-gray-500 leading-relaxed">{sub}</p>}
      </div>
      <div className="flex-shrink-0 text-left sm:text-right">
        {children}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm mb-6">
      <div className="bg-gray-50/80 px-6 py-3.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ── Company Panel ─────────────────────────────────────────────────────────────

function CompanyPanel({ data, setData }: { data: any; setData: (d: any) => void }) {
  const company = data.company || {};
  const updateCompany = (key: string, value: any) =>
    setData((prev: any) => ({
      ...prev,
      company: { ...prev.company, [key]: value },
    }));

  return (
    <>
      <Section title="ข้อมูลพื้นฐาน">
        <Row label="ชื่อบริษัทเต็ม">
          <TextInput
            value={company.company_name || ""}
            onChange={(v) => updateCompany("company_name", v)}
            placeholder="เช่น บริษัท รถเช่า จำกัด"
          />
        </Row>

        <Row label="โลโก้บริษัท">
          <div className="space-y-5">
            {company.company_logo && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">โลโก้ปัจจุบัน</p>
                <img
                  src={company.company_logo}
                  alt="Current Logo"
                  className="max-h-32 object-contain border border-gray-200 rounded-lg bg-white p-4 shadow-sm"
                  onError={(e) => ((e.target as HTMLImageElement).src = "/logo-placeholder.png")}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                อัปโหลดโลโก้ใหม่ (PNG/JPG, สูงสุด 2MB)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("ไฟล์ใหญ่เกิน 2MB");
                    return;
                  }
                  const preview = URL.createObjectURL(file);
                  updateCompany("company_logo_preview", preview);
                  updateCompany("logoFile", file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition file:cursor-pointer cursor-pointer"
              />
            </div>

            {company.company_logo_preview && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">ตัวอย่างโลโก้ใหม่</p>
                <img
                  src={company.company_logo_preview}
                  alt="Preview"
                  className="max-h-32 object-contain border border-gray-200 rounded-lg bg-white p-4 shadow-sm"
                />
              </div>
            )}
          </div>
        </Row>

        <Row label="QR Code PromptPay">
          <div className="space-y-5">
            {company.promptpay_qr && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">QR ปัจจุบัน</p>
                <img
                  src={company.promptpay_qr}
                  alt="Current QR"
                  className="max-h-32 object-contain border border-gray-200 rounded-lg bg-white p-4 shadow-sm"
                  onError={(e) => ((e.target as HTMLImageElement).src = "/qr-placeholder.png")}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                อัปโหลด QR ใหม่ (PNG/JPG, สูงสุด 2MB)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("ไฟล์ใหญ่เกิน 2MB");
                    return;
                  }
                  const preview = URL.createObjectURL(file);
                  updateCompany("promptpay_qr_preview", preview);
                  updateCompany("promptpayQrFile", file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition file:cursor-pointer cursor-pointer"
              />
            </div>

            {company.promptpay_qr_preview && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">ตัวอย่าง QR ใหม่</p>
                <img
                  src={company.promptpay_qr_preview}
                  alt="Preview"
                  className="max-h-32 object-contain border border-gray-200 rounded-lg bg-white p-4 shadow-sm"
                />
              </div>
            )}
          </div>
        </Row>
      </Section>

      <Section title="ข้อมูลติดต่อ">
        <Row label="เบอร์โทรศัพท์หลัก">
          <TextInput value={company.company_phone || ""} onChange={(v) => updateCompany("company_phone", v)} />
        </Row>
        <Row label="อีเมลหลัก">
          <TextInput value={company.company_email || ""} onChange={(v) => updateCompany("company_email", v)} />
        </Row>
        <Row label="ที่อยู่บริษัท">
          <TextInput value={company.company_address || ""} onChange={(v) => updateCompany("company_address", v)} />
        </Row>
        <Row label="รายละเอียดบริษัท">
          <TextInput value={company.company_description || ""} onChange={(v) => updateCompany("company_description", v)} />
        </Row>
      </Section>

      <Section title="ข้อมูลภาษีและบัญชี">
        <Row label="เลขประจำตัวผู้เสียภาษี">
          <TextInput value={company.tax_id || ""} onChange={(v) => updateCompany("tax_id", v)} />
        </Row>
        <Row label="ชื่อธนาคาร">
          <TextInput value={company.bank_name || ""} onChange={(v) => updateCompany("bank_name", v)} />
        </Row>
        <Row label="ชื่อบัญชีธนาคาร">
          <TextInput value={company.bank_account_name || ""} onChange={(v) => updateCompany("bank_account_name", v)} />
        </Row>
        <Row label="เลขบัญชีธนาคาร">
          <TextInput value={company.bank_account_number || ""} onChange={(v) => updateCompany("bank_account_number", v)} />
        </Row>
        <Row label="PromptPay ID (เบอร์มือถือ / บัตรประชาชน)">
          <TextInput value={company.promptpay_id || ""} onChange={(v) => updateCompany("promptpay_id", v)} />
        </Row>
      </Section>
    </>
  );
}

// ── Booking Panel ─────────────────────────────────────────────────────────────

function BookingPanel({ data, setData }: { data: any; setData: (d: any) => void }) {
  const settings = data.settings || {};
  const update = (key: string, value: any) =>
    setData((prev: any) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  return (
    <>
      <Section title="คุณสมบัติผู้เช่า">
        <Row label="อายุขั้นต่ำ">
          <NumInput value={settings.min_renter_age || ""} onChange={(v) => update("min_renter_age", v)} min={16} unit="ปี" />
        </Row>
        <Row label="ต้องการบัตรประชาชน">
          <Toggle value={settings.require_id_card ?? true} onChange={(v) => update("require_id_card", v)} />
        </Row>
        <Row label="ต้องการใบขับขี่">
          <Toggle value={settings.require_driver_license ?? true} onChange={(v) => update("require_driver_license", v)} />
        </Row>
      </Section>

      <Section title="นโยบายการเช่า">
        <Row label="อนุญาตต่อเวลา">
          <Toggle value={settings.allow_extension ?? false} onChange={(v) => update("allow_extension", v)} />
        </Row>
        <Row label="บังคับเก็บมัดจำ">
          <Toggle value={settings.enforce_deposit ?? true} onChange={(v) => update("enforce_deposit", v)} />
        </Row>
        <Row label="นโยบาย Full-to-Full">
          <Toggle value={settings.full_to_full_policy ?? false} onChange={(v) => update("full_to_full_policy", v)} />
        </Row>
      </Section>

      <Section title="มัดจำและค่าปรับ">
        <Row label="เงินมัดจำเริ่มต้น">
          <NumInput value={settings.default_deposit_amount || ""} onChange={(v) => update("default_deposit_amount", v)} unit="บาท" />
        </Row>
        <Row label="ค่าปรับล่าช้า (รายชั่วโมง)">
          <NumInput value={settings.late_fee_per_hour || ""} onChange={(v) => update("late_fee_per_hour", v)} unit="บาท/ชม." />
        </Row>
        <Row label="ค่าปรับยกเลิกการจอง">
          <NumInput value={settings.cancellation_fee || ""} onChange={(v) => update("cancellation_fee", v)} unit="บาท" />
        </Row>
        <Row label="ค่า No-Show">
          <NumInput value={settings.no_show_fee || ""} onChange={(v) => update("no_show_fee", v)} unit="บาท" />
        </Row>
      </Section>
    </>
  );
}

// ── Vehicles Panel ────────────────────────────────────────────────────────────

function VehiclesPanel({ data, setData }: { data: any; setData: (d: any) => void }) {
  const settings = data.settings || {};
  const update = (key: string, value: any) =>
    setData((prev: any) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  return (
    <>
      <Section title="การตรวจสภาพรถ">
        <Row label="ถ่ายรูปก่อนรับรถ">
          <Toggle value={settings.require_pickup_photos ?? true} onChange={(v) => update("require_pickup_photos", v)} />
        </Row>
        <Row label="ถ่ายรูปหลังคืนรถ">
          <Toggle value={settings.require_return_photos ?? true} onChange={(v) => update("require_return_photos", v)} />
        </Row>
        <Row label="จำนวนรูปขั้นต่ำ" indent>
          <NumInput value={settings.min_photo_count ?? 4} onChange={(v) => update("min_photo_count", v)} min={1} unit="รูป" />
        </Row>
        <Row label="อนุมัติคืนรถอัตโนมัติ">
          <Toggle value={settings.auto_approve_return ?? false} onChange={(v) => update("auto_approve_return", v)} />
        </Row>
        <Row label="บังคับให้มีประกันภัย">
          <Toggle value={settings.require_insurance ?? true} onChange={(v) => update("require_insurance", v)} />
        </Row>
      </Section>

      <Section title="แจ้งเตือน">
        <Row label="แจ้งเตือนซ่อมบำรุงทุก">
          <NumInput value={settings.maintenance_alert_km ?? 5000} onChange={(v) => update("maintenance_alert_km", v)} min={1000} unit="กม." />
        </Row>
        <Row label="ประกันใกล้หมดอายุ (แจ้งล่วงหน้า)">
          <NumInput value={settings.insurance_alert_days ?? 30} onChange={(v) => update("insurance_alert_days", v)} min={7} unit="วัน" />
        </Row>
        <Row label="ภาษีใกล้หมดอายุ (แจ้งล่วงหน้า)">
          <NumInput value={settings.tax_alert_days ?? 30} onChange={(v) => update("tax_alert_days", v)} min={7} unit="วัน" />
        </Row>
      </Section>
    </>
  );
}

// ── Payments Panel ────────────────────────────────────────────────────────────

function PaymentsPanel({ data, setData }: { data: any; setData: (d: any) => void }) {
  const settings = data.settings || {};
  const update = (key: string, value: any) =>
    setData((prev: any) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  return (
    <>
      <Section title="ช่องทางการชำระเงิน">
        <Row label="เงินสด">
          <Toggle value={settings.enable_cash ?? true} onChange={(v) => update("enable_cash", v)} />
        </Row>
        <Row label="บัตรเครดิต/เดบิต">
          <Toggle value={settings.enable_credit_card ?? true} onChange={(v) => update("enable_credit_card", v)} />
        </Row>
        <Row label="QR PromptPay">
          <Toggle value={settings.enable_qr_promptpay ?? true} onChange={(v) => update("enable_qr_promptpay", v)} />
        </Row>
        <Row label="โอนเงินผ่านธนาคาร">
          <Toggle value={settings.enable_bank_transfer ?? true} onChange={(v) => update("enable_bank_transfer", v)} />
        </Row>
      </Section>

      <Section title="เอกสารและภาษี">
        <Row label="สร้างใบแจ้งหนี้อัตโนมัติ">
          <Toggle value={settings.auto_generate_invoice ?? true} onChange={(v) => update("auto_generate_invoice", v)} />
        </Row>
        <Row label="อัตราภาษีมูลค่าเพิ่ม (VAT)">
          <NumInput value={settings.vat_percent ?? "7.00"} onChange={(v) => update("vat_percent", v)} min={0} max={20} unit="%" />
        </Row>
      </Section>
    </>
  );
}

// ── Security Panel ────────────────────────────────────────────────────────────

function SecurityPanel({ data, setData }: { data: any; setData: (d: any) => void }) {
  const settings = data.settings || {};
  const update = (key: string, value: any) =>
    setData((prev: any) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  return (
    <Section title="ความปลอดภัยและการล็อกอิน">
      <Row label="ความยาวรหัสผ่านขั้นต่ำ">
        <NumInput value={settings.password_min_length ?? 8} onChange={(v) => update("password_min_length", v)} min={6} unit="ตัวอักษร" />
      </Row>
      <Row label="ล็อกอินผิดได้สูงสุด (ก่อนล็อกบัญชี)">
        <NumInput value={settings.max_login_attempts ?? 5} onChange={(v) => update("max_login_attempts", v)} min={3} unit="ครั้ง" />
      </Row>
      <Row label="ระยะเวลาล็อกบัญชีเมื่อผิดหลายครั้ง">
        <NumInput value={settings.lockout_duration_minutes ?? 30} onChange={(v) => update("lockout_duration_minutes", v)} min={5} unit="นาที" />
      </Row>
      <Row label="เซสชันหมดอายุอัตโนมัติหลัง">
        <NumInput value={settings.session_timeout_minutes ?? 60} onChange={(v) => update("session_timeout_minutes", v)} min={10} unit="นาที" />
      </Row>
    </Section>
  );
}

// ── System Panel ──────────────────────────────────────────────────────────────

function SystemPanel({ data, setData }: { data: any; setData: (d: any) => void }) {
  const settings = data.settings || {};
  const update = (key: string, value: any) =>
    setData((prev: any) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  return (
    <Section title="การควบคุมระบบ">
      <Row label="โหมดบำรุงรักษา (Maintenance Mode)">
        <Toggle value={settings.maintenance_mode ?? false} onChange={(v) => update("maintenance_mode", v)} />
      </Row>
    </Section>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SettingComponent({ initialSettings }: { initialSettings: any }) {
  const [activeTab, setActiveTab] = useState("company");
  const [settings, setSettings] = useState<any>({
    ...initialSettings,
    company: {
      ...initialSettings?.company,
      logoFile: null,
      promptpayQrFile: null,
      company_logo_preview: null,
      promptpay_qr_preview: null,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (settings.company?.company_logo_preview) URL.revokeObjectURL(settings.company.company_logo_preview);
      if (settings.company?.promptpay_qr_preview) URL.revokeObjectURL(settings.company.promptpay_qr_preview);
    };
  }, [settings.company]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { company, settings: nestedSettings, ...rootOverrides } = settings;
      const systemData = { ...nestedSettings, ...rootOverrides };

      await updateSystemSettings(initialSettings?.company?.company_id ?? 1, systemData);

      if (company && (company.logoFile || company.promptpayQrFile || Object.keys(company).length > 4)) {
        await putCompany({
          id: initialSettings?.company?.company_id || "1",
          ...company,
        });
      }

      toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const panels: Record<string, JSX.Element> = {
    company: <CompanyPanel data={settings} setData={setSettings} />,
    booking: <BookingPanel data={settings} setData={setSettings} />,
    vehicles: <VehiclesPanel data={settings} setData={setSettings} />,
    payments: <PaymentsPanel data={settings} setData={setSettings} />,
    security: <SecurityPanel data={settings} setData={setSettings} />,
    system: <SystemPanel data={settings} setData={setSettings} />,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ตั้งค่าระบบ</h1>
            <p className="text-sm text-gray-500 mt-1">จัดการการตั้งค่าทั่วไปของระบบรถเช่า</p>
          </div>

          <div className="flex items-center gap-4">
            {saved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
                <FaCheckCircle size={13} /> บันทึกสำเร็จ
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                inline-flex items-center gap-2 px-6 py-2.5 rounded-lg 
                bg-gray-900 text-white text-sm font-medium 
                hover:bg-gray-800 active:bg-gray-950 transition shadow-sm
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin" size={14} />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกการตั้งค่า"
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 flex overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3.5 text-sm font-medium whitespace-nowrap transition-colors
                  ${isActive
                    ? "text-gray-900 border-b-2 border-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {panels[activeTab]}
        </div>
      </main>
    </div>
  );
}