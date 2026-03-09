import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";

export async function getBannersServer() {
    await requireAdmin();

    const allBanners = await db.select().from(banners);

    return allBanners;
}