import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ดึงข้อมูลการชำระเงินตาม booking_id
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const params = await context.params;
    const bookingId = Number(params.id);

    if (isNaN(bookingId)) {
        return Response.json({ error: "รหัสการจองไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        const result = await db
            .select()
            .from(payments)
            .where(eq(payments.booking_id, bookingId));

        return Response.json(result);
    } catch (error) {
        console.error("Get payments by booking error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลการชำระเงินได้", { status: 500 });
    }
}
