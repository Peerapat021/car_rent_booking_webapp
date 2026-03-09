// app/api/activities/route.ts

import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// ======================== GET ========================
export async function GET() {
    try {
        const allActivities = await db
            .select()
            .from(activities)
            .orderBy(desc(activities.activities_id));

        return NextResponse.json(allActivities);
    } catch (error) {
        console.error("Get activities error:", error);
        return new NextResponse("ไม่สามารถโหลดข้อมูล activities ได้", { status: 500 });
    }
}
