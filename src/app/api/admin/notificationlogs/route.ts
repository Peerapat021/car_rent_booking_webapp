// src/app/api/admin/notificationlogs/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notificationLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { notFound } from "next/navigation";

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        const logs = await db.select().from(notificationLogs).orderBy(desc(notificationLogs.notif_id));
        
        return NextResponse.json(logs, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error('Error fetching notification logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notification logs' },
            { status: 500 }
        );
    }
}