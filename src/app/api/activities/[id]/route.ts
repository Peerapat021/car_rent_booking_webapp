// app/api/activities/[id]/route.ts
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const activityId = Number(id);

    if (isNaN(activityId)) {
        return new NextResponse("ID ไม่ถูกต้อง", { status: 400 });
    }

    try {
        const [activity] = await db
            .select({
                activities_id: activities.activities_id,
                activities_title: activities.activities_title,
                activities_content: activities.activities_content,
                activities_image_url: activities.activities_image_url,
                activities_start_date: activities.activities_start_date,
                activities_end_date: activities.activities_end_date,
                activities_status: activities.activities_status,
                activities_created_by: activities.activities_created_by,
                activities_created_at: activities.activities_created_at,
                activities_updated_at: activities.activities_updated_at,
            })
            .from(activities)
            .where(eq(activities.activities_id, activityId))
            .limit(1);

        if (!activity) {
            return new NextResponse("ไม่พบกิจกรรม", { status: 404 });
        }

        return NextResponse.json(activity);
    } catch (error) {
        console.error("GET activity error:", error);
        return new NextResponse("ดึงข้อมูลกิจกรรมไม่สำเร็จ", { status: 500 });
    }
}
