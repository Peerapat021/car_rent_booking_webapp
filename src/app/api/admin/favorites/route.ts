// app/api/admin/favorites/route.ts
import { db } from "@/lib/db";
import { favorites, cars, users } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { eq, desc } from "drizzle-orm";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    // เช็ค role (สมมติว่าคุณมี field role ใน session)
    if (session.user.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
    }

    try {
        const allFavorites = await db
            .select({
                favorite_id: favorites.favorite_id,
                created_at: favorites.created_at,
                user_id: users.id,
                user_name: users.name,
                car_id: cars.car_id,
                car_brand: cars.car_brand,
                car_model: cars.car_model,
            })
            .from(favorites)
            .innerJoin(users, eq(favorites.user_id, users.id))
            .innerJoin(cars, eq(favorites.car_id, cars.car_id))
            .orderBy(desc(favorites.created_at));

        return Response.json(allFavorites);
    } catch (error) {
        console.error("ADMIN GET favorites error:", error);
        return new Response("โหลดข้อมูลไม่สำเร็จ", { status: 500 });
    }
}