// src/lib/services/calendar/get.ts
import { db } from "@/lib/db";
import { bookings, cars, branches } from "@/lib/db/schema";
import { and, sql, inArray, eq } from "drizzle-orm";

// ===== Booking Status Type (ให้ตรงกับ enum ใน schema) =====
export type BookingStatus =
    | "pending"
    | "pending_balance"
    | "confirmed"
    | "picked_up"
    | "returned"
    | "completed"
    | "cancelled"
    | "no_show";

// ===== Calendar Event =====
export interface CalendarEvent {
    id: string;
    title: string;
    date: string;          // YYYY-MM-DD
    dateEnd?: string;      // YYYY-MM-DD
    time?: string;         // HH:mm
    endTime?: string;      // HH:mm
    allDay?: boolean;
    color: string;
    description?: string;
}

// ===== Params =====
interface GetCalendarEventsParams {
    start: string;           // YYYY-MM-DD
    end: string;             // YYYY-MM-DD (exclusive)
    branchId?: number;
    statuses?: BookingStatus[];
}

// ===== Main Service =====
export async function getCalendarEvents({
    start,
    end,
    branchId,
    statuses = ["pending", "pending_balance", "confirmed", "picked_up"],
}: GetCalendarEventsParams): Promise<CalendarEvent[]> {
    try {
        const startDate = new Date(`${start}T00:00:00+07:00`);
        const endDate = new Date(`${end}T00:00:00+07:00`);

        const queryConditions = [
            // overlapping condition (สำคัญมากสำหรับ multi-day)
            sql`${bookings.booking_end_date} > ${startDate}`,
            sql`${bookings.booking_start_date} < ${endDate}`,
            inArray(bookings.booking_status, statuses),
        ];

        if (branchId) {
            queryConditions.push(eq(cars.branch_id, branchId));
        }

        const results = await db
            .select({
                bookingId: bookings.booking_id,
                carBrand: cars.car_brand,
                carModel: cars.car_model,
                licensePlate: cars.car_license_plate,
                customerName: bookings.contact_name,
                contactPhone: bookings.contact_phone,
                startDatetime: bookings.booking_start_date,
                endDatetime: bookings.booking_end_date,
                status: bookings.booking_status,
                branchName: branches.branch_name,
                specialRequest: bookings.special_request,
            })
            .from(bookings)
            .innerJoin(cars, eq(bookings.car_id, cars.car_id))
            .leftJoin(branches, eq(cars.branch_id, branches.branch_id))
            .where(and(...queryConditions))
            .orderBy(bookings.booking_start_date);

        return results
            .map((row): CalendarEvent | null => {
                if (!row.startDatetime) return null;

                const startD = new Date(row.startDatetime);
                const endD = row.endDatetime ? new Date(row.endDatetime) : null;

                const date = startD.toISOString().split("T")[0];
                const dateEnd =
                    endD && endD > startD
                        ? endD.toISOString().split("T")[0]
                        : undefined;

                const time = startD.toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });

                const endTime = endD
                    ? endD.toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                      })
                    : undefined;

                const allDay =
                    time === "00:00" &&
                    (!endTime || endTime === "23:59" || endTime === "00:00");

                return {
                    id: `BK-${row.bookingId}`,
                    title: `${row.carBrand} ${row.carModel} - ${
                        row.customerName || "ไม่ระบุ"
                    }`,
                    date,
                    dateEnd,
                    time: allDay ? undefined : time,
                    endTime: allDay ? undefined : endTime,
                    allDay,
                    color: getStatusColor(row.status),
                    description: [
                        row.branchName ? `สาขา: ${row.branchName}` : null,
                        `ทะเบียน: ${row.licensePlate}`,
                        row.contactPhone ? `โทร: ${row.contactPhone}` : null,
                        row.specialRequest ? `หมายเหตุ: ${row.specialRequest}` : null,
                    ]
                        .filter(Boolean)
                        .join(" • "),
                };
            })
            .filter(Boolean) as CalendarEvent[];
    } catch (error) {
        console.error("getCalendarEvents error:", error);
        throw error;
    }
}

// ===== Status → Color =====
function getStatusColor(status: BookingStatus | null | undefined): string {
    if (!status) return "bg-gray-500";

    const colors: Record<BookingStatus, string> = {
        pending: "bg-yellow-500",
        pending_balance: "bg-orange-500",
        confirmed: "bg-green-500",
        picked_up: "bg-blue-600",
        returned: "bg-gray-600",
        completed: "bg-teal-600",
        cancelled: "bg-red-600",
        no_show: "bg-red-800",
    };

    return colors[status];
}
