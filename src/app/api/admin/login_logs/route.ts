// app/api/login_logs/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { loginLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET() {
    try {
        await requireAdmin();
        const allLoginLogs = await db.select().from(loginLogs).orderBy(desc(loginLogs.log_id));

        return Response.json(allLoginLogs);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get login logs error:", error);
        return new Response("ไม่สามารถโหลดข้อมูล login logs ได้", { status: 500 });
    }
}
