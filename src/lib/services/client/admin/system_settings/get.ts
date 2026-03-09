// lib/services/client/system-settings.ts


export async function fetchSystemSettings() {
    const res = await fetch("/api/admin/system_settings", {
        cache: "no-store",
        credentials: "include", // สำคัญสำหรับ session cookie
    });

    if (!res.ok) {
        throw new Error("Failed to fetch system settings");
    }

    return res.json();
}
