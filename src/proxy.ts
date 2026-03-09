// src/proxy.ts  ← ใช้ไฟล์ชื่อนี้ได้ใน Next.js 16+
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const role = (token?.role as string) ?? null
  const isLoggedIn = !!token

  // Admin Area
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn || role !== 'admin') {
      const url = new URL('/login', req.url)
      url.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Staff Area
  if (pathname.startsWith('/staff') || pathname.startsWith('/(staff)')) {
    if (!isLoggedIn || !['staff', 'admin'].includes(role)) {
      const url = new URL('/login', req.url)
      url.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // หน้าที่ลูกค้าต้อง login
  const protectedPaths = [
    '/booking', '/checkout', '/payment', '/my-bookings',
    '/profile', '/reservation', '/orders'
  ]

  if (protectedPaths.some(p => pathname.startsWith(p)) && !isLoggedIn) {
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', req.url)
    url.searchParams.set('message', 'กรุณาเข้าสู่ระบบเพื่อดำเนินการจองรถ')
    return NextResponse.redirect(url)
  }

  // ถ้า login แล้วเข้า /login
  if (pathname === '/login' && isLoggedIn) {
    const home = role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/'
    return NextResponse.redirect(new URL(home, req.url))
  }

  return NextResponse.next()
}

// สำคัญ: ถ้าใช้ proxy.ts ต้องมี config แบบนี้
export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/staff/:path*',
    '/(staff)/:path*',
    '/booking/:path*',
    '/checkout/:path*',
    '/payment/:path*',
    '/my-bookings/:path*',
    '/profile/:path*',
    '/reservation/:path*',
  ],
}