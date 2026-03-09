// app/api/[id]/promotionCars/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { promotionCars } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if (session.user?.role !== "admin") return new Response("Forbidden", { status: 403 });

        if ((session.user?.role === "admin" || session.user?.role === "staff") && !session.user?.branch_id) {
            return new Response("พนักงานต้องมีสาขา", { status: 400 });
        }

        const { id } = await params;
        const idNum = Number(id);

        if (!idNum || isNaN(idNum)) {
            return new NextResponse("Invalid ID", { status: 400 });
        }

        const [existing] = await db
            .select()
            .from(promotionCars)
            .where(eq(promotionCars.id, idNum))
            .limit(1);

        if (!existing) {
            return new NextResponse("Data not found", { status: 404 });
        }

        await db.delete(promotionCars).where(eq(promotionCars.id, idNum));

        return NextResponse.json({ message: "ลบสำเร็จ" });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Delete promotion car error:", error);
        return new NextResponse("ไม่สามารถลบข้อมูลได้", { status: 500 });
    }
}