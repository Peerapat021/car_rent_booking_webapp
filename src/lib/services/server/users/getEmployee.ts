import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { desc, inArray } from "drizzle-orm";
import { format } from 'date-fns';

export async function getEmployeeServer() {
    await requireAdmin();

    const allUsers = await db.select()
        .from(users)
        .where(inArray(users.user_role, ['admin', 'staff']))
        .orderBy(desc(users.id));

    return allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        birth_date: u.birth_date ? format(u.birth_date, 'yyyy-MM-dd') : null,
        user_phone: u.user_phone,
        user_role: u.user_role ?? ('staff' as 'staff' | 'admin'),
        user_blacklist: u.user_blacklist ?? false,
        create_at_user: format(u.create_at_user, 'yyyy-MM-dd'),
        branch_id: u.branch_id,
    }));
}