import { db } from "@/lib/db";
import { company } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {

    try {
        const com = await db
            .select()
            .from(company);

        return NextResponse.json(com);
    } catch (error) {

        console.error("Error fetching company:", error);
        return NextResponse.json(
            { error: "ไม่สามารถโหลดข้อมูลบริษัทได้" },
            { status: 500 }
        );
    }
}