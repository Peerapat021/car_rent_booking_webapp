'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { User, Lock, Eye, EyeOff, Link } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // เพิ่ม loading state

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!email || !password) {
      alert('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }

    setIsLoading(true)

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
      })

      if (!res) {
        alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        setIsLoading(false)
        return
      }

      if (res.error) {
        alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        setIsLoading(false)
        return
      }

      // ถึงตรงนี้ = ล็อกอินสำเร็จแน่นอน
      // ดึง session ใหม่ทันทีจาก server (ไม่รอ useSession)
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()

      if (!sessionData?.user) {
        // กรณีหายากที่ session ยังไม่มา
        router.push('/')
        router.refresh()
        return
      }

      const role = sessionData.user.role

      // Redirect ทันทีตาม role
      if (role === 'admin') {
        router.push('/admin')
      } else if (role === 'staff') {
        router.push('/staff')
      } else {
        router.push('/')
      }

      // บังคับ refresh เพื่อให้ layout/menu แสดงผลถูกต้องทันที
      router.refresh()

    } catch (err) {
      console.error('Login error:', err)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">

        {/* Right side - ฟอร์มล็อกอิน */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              เข้าสู่ระบบ
            </h2>

            <div className="space-y-5">
              {/* Email */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="อีเมล"
                  required
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:bg-gray-50"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                  required
                  disabled={isLoading}
                  className="w-full pl-11 pr-12 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-700 select-none">
                    จดจำฉัน
                  </label>
                </div>
                <a href="/remember" className="text-sm text-purple-600 hover:text-purple-800">
                  ลืมรหัสผ่าน?
                </a>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-3.5 rounded-lg font-medium text-white transition-all transform duration-200 ${isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105 shadow-lg'
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </div>

            {/* Register link */}
            <div className="text-center mt-8 text-sm">
              <span className="text-gray-600">ยังไม่มีบัญชีผู้ใช้? </span>
              <a href="/register" className="text-purple-600 hover:text-purple-800 font-medium">
                สมัครสมาชิก
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}