// app/api/users/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { company } from "@/lib/db/schema";
import { notFound } from "next/navigation";

export async function GET() {
    try {
        await requireAdmin();
        const [firstCompany] = await db.select().from(company).limit(1);
        return Response.json(firstCompany);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get company error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลได้", { status: 500 });
    }
}
