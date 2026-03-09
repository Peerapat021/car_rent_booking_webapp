import { getCurrentUser } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import "../globals.css";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Sidebar from "./sidebar";

export const metadata = {
  title: "แอดมิน - ระบบจองห้อง",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  // const user = await getCurrentUser(); // ถ้าไม่จำเป็นจริง ๆ ลบออกเลยก็ได้

  const role = session?.user?.role

  // อนุญาตเฉพาะ admin และ staff เท่านั้น
  if (!session || !role || !["admin", "staff"].includes(role)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 sm:ml-64 p-5 bg-gray-50 pt-[4rem] md:p-8 dark:bg-gray-950">
        <div className="">{children}</div>
      </main>
    </div>
  );
}
