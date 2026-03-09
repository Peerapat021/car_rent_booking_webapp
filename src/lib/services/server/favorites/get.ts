import { db } from "@/lib/db";
import { favorites, cars, users } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { desc, eq } from "drizzle-orm";

export async function getFavoritesServer() {
    await requireAdmin();

    const allFavorites = await db
        .select({
            favorite_id: favorites.favorite_id,
            created_at: favorites.created_at,

            car_id: cars.car_id,
            car_brand: cars.car_brand,
            car_model: cars.car_model,
            car_color: cars.car_color,
            car_image_cover: cars.car_image_cover,
            car_license_plate: cars.car_license_plate,

            user_id: favorites.user_id,
            user_name: users.name,
            user_email: users.email,
        })
        .from(favorites)
        .innerJoin(cars, eq(favorites.car_id, cars.car_id))
        .innerJoin(users, eq(favorites.user_id, users.id))
        .orderBy(desc(favorites.created_at));

    return allFavorites;
}