import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireAdmin() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        throw new Error("FORBIDDEN");
    }

    return session;
}