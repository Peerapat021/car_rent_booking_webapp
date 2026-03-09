import { db } from "@/lib/db";
import {
    bookings
} from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        let result;

        // ทุก role เห็นเฉพาะ booking ของตัวเอง
        if (session?.user?.id) {
            result = await db
                .select()
                .from(bookings)
                .where(eq(bookings.user_id, Number(session.user.id)));
        } else {
            result = await db
                .select()
                .from(bookings);
        }

        return Response.json(result);

    } catch (error) {
        console.error("Get bookings error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลการจองได้", { status: 500 });
    }
}