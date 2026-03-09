// src/lib/services/maintenance/put.ts

interface MaintenanceRecord {
    maintenance_id: number;
    car_id: number;
    maintenance_detail: string;
    maintenance_cost: string;
    maintenance_date: string;
    recorded_by?: number;
}

interface PutMaintenanceResponse {
    record: MaintenanceRecord;
}

export async function putMaintenance(formData: FormData): Promise<PutMaintenanceResponse> {
    const maintenanceId = formData.get('maintenance_id');
    if (!maintenanceId) {
        throw new Error("maintenance_id ห้ามว่างสำหรับการอัปเดต");
    }

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/maintenance/${maintenanceId}`,
        {
            method: "PUT",
            body: formData,
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "ไม่สามารถอัปเดตการบำรุงรักษาได้");
    }

    return res.json();
}