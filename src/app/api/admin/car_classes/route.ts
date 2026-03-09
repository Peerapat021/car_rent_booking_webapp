// app/api/users/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { car_classes } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET() {

  try {
    await requireAdmin();
    const classes = await db
      .select()
      .from(car_classes)
      .orderBy(car_classes.sort_order, car_classes.class_id);

    return NextResponse.json(classes);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      notFound();
    }
    console.error("Error fetching car classes:", error);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลประเภทรถได้" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.user?.role !== "admin") return new Response("Forbidden", { status: 403 });

  try {
    await requireAdmin();
    const { class_code, class_name, class_description, sort_order, is_active } = await request.json();

    if (!class_code || !class_name || !class_description || !sort_order || !is_active) {
      return new Response("กรุณากรอกข้อมูลให้ครบถ้วน", { status: 400 });
    }

    // Insert ข้อมูล
    const result = await db.insert(car_classes).values({
      class_code,
      class_name,
      class_description,
      sort_order,
      is_active,
    }).$returningId();

    // Query ข้อมูลที่เพิ่งสร้างกลับมา
    const [newCarClass] = await db
      .select()
      .from(car_classes)
      .where(eq(car_classes.class_id, result[0].class_id));

    return Response.json(newCarClass, { status: 201 });

  } catch (error: any) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      notFound();
    }
    console.error("Post car_classes error:", error);
    return new Response("ไม่สามารถเพิ่มผู้ใช้ได้", { status: 500 });
  }
}