import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET() {

    try {
        const branch = await db
            .select()
            .from(branches);

        return NextResponse.json(branch);
    } catch (error) {

        console.error("Error fetching branches:", error);
        return NextResponse.json(
            { error: "ไม่สามารถโหลดข้อมูลสาขาได้" },
            { status: 500 }
        );
    }
}