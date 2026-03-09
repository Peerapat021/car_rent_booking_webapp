// src/app/admin/systemSettings/page.tsx
import SettingComponent from "./SettingComponent";
import { getSystemSettings } from "@/lib/services/server/system_settings/get";

export default async function SystemSettingsPage() {
  const initialSettings = await getSystemSettings(1); 

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingComponent initialSettings={initialSettings} />
    </div>
  );
}