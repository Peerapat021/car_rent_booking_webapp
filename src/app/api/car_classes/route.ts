import { db } from "@/lib/db";
import { car_classes } from "@/lib/db/schema";
import { NextResponse } from "next/server";
export async function GET() {

    try {
        const classes = await db
            .select()
            .from(car_classes);

        return NextResponse.json(classes);
    } catch (error) {

        console.error("Error fetching car classes:", error);
        return NextResponse.json(
            { error: "ไม่สามารถโหลดข้อมูลประเภทรถได้" },
            { status: 500 }
        );
    }
}