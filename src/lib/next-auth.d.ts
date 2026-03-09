// src/types/next-auth.d.ts   ← แก้แค่ไฟล์นี้ไฟล์เดียว!

import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

type UserRole = "customer" | "staff" | "admin"

/** ขยาย User จาก NextAuth */
declare module "next-auth" {
  interface User extends DefaultUser {
    id: string
    role: UserRole
    user_phone?: string | null
    user_driver_license?: string | null
    user_driver_license_expiry?: string | null
    user_address?: string | null
    user_blacklist?: boolean
  }

  interface Session {
    user: {
      id: string
      name: string | null
      email: string | null
      image?: string | null
      role: UserRole
      user_phone?: string | null
      user_driver_license?: string | null
      user_driver_license_expiry?: string | null
      user_address?: string | null
      user_blacklist?: boolean
    } & DefaultSession["user"]
  }
}

/** ขยาย JWT */
declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: UserRole
    user_phone?: string | null
    user_driver_license?: string | null
    user_address?: string | null
    user_blacklist?: boolean
  }
}