// app/api/users/route.ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
export async function GET() {
    try {
        const allUsers = await db.select().from(users);

        return Response.json(allUsers);
    } catch (error) {
        console.error("Get users error:", error);
        return Response.json({ error: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้" }, { status: 500 });
    }
}