// app/register/page.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  // ถ้าล็อกอินอยู่แล้ว → ห้ามเข้า register
  if (session) {
    redirect("/");
  }

  return <RegisterForm />;
}