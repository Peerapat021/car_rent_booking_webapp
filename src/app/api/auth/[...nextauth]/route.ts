// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users, loginLogs } from "@/lib/db/schema";

// ================= Type Declaration =================
declare module "next-auth" {
  interface User {
    id: string;
    role: "customer" | "staff" | "admin";
    branch_id?: number | null;
    name?: string | null;
    email?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "customer" | "staff" | "admin";
      branch_id?: number | null;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "customer" | "staff" | "admin";
    branch_id?: number | null;
  }
}

// ================= Auth Options =================
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const { email, password } = credentials ?? {};
        if (!email || !password) return null;

        // ดึง header (Next.js 15+ ต้อง await)
        const h = await headers();

        const ip =
          h.get("x-forwarded-for") ??
          h.get("x-real-ip") ??
          "unknown";

        const userAgent =
          h.get("user-agent") ?? "unknown";

        try {
          const result = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              user_role: users.user_role,
              branch_id: users.branch_id,
              password: users.password,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          // ไม่เจอ user
          if (!result.length) {
            await db.insert(loginLogs).values({
              user_id: null,
              ip_address: ip,
              user_agent: userAgent,
              login_status: "failed",
            });
            return null;
          }

          const user = result[0];

          // password
          if (!bcrypt.compareSync(password, user.password)) {
            await db.insert(loginLogs).values({
              user_id: user.id,
              ip_address: ip,
              user_agent: userAgent,
              login_status: "failed",
            });
            return null;
          }

          // login success
          await db.insert(loginLogs).values({
            user_id: user.id,
            ip_address: ip,
            user_agent: userAgent,
            login_status: "success",
          });

          return {
            id: String(user.id),
            name: user.name ?? "User",
            email: user.email,
            role: (user.user_role ||
              "customer") as "customer" | "staff" | "admin",
            branch_id: user.branch_id ?? null,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branch_id = user.branch_id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role =
          token.role as
          | "customer"
          | "staff"
          | "admin";
        session.user.branch_id =
          token.branch_id ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
