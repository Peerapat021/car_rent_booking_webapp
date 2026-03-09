'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { postRegister } from '@/lib/services/client/admin/register/post';

export default function RegisterForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        tel: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthDate: '',
        agree: false,
    });

    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (error) setError(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        if (!formData.agree) {
            setError('กรุณายอมรับเงื่อนไขก่อนสมัครสมาชิก');
            return;
        }

        if (!/^[0-9]{10}$/.test(formData.tel)) {
            setError('กรุณากรอกเบอร์มือถือ 10 หลัก');
            return;
        }

        startTransition(async () => {
            try {
                // 1️⃣ สมัครสมาชิก
                await postRegister({
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    password: formData.password,
                    birth_date: formData.birthDate,
                    user_phone: formData.tel,
                });

                // 2️⃣ Login อัตโนมัติ
                const result = await signIn('credentials', {
                    email: formData.email,
                    password: formData.password,
                    redirect: false,
                });

                if (result?.error) {
                    setError('สมัครสำเร็จ แต่เข้าสู่ระบบอัตโนมัติไม่สำเร็จ');
                    return;
                }

                // 3️⃣ เข้าใช้งานทันที
                router.push('/');
                router.refresh();

            } catch (err: any) {
                setError(err.message || 'เกิดข้อผิดพลาด');
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white rounded-t-2xl">
                    <h1 className="text-2xl font-bold text-center">สมัครสมาชิก</h1>
                    <p className="text-center text-blue-100 mt-1 text-sm">
                        สร้างบัญชีเพื่อเริ่มใช้งาน
                    </p>
                </div>

                <div className="p-8">

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <input
                            type="text"
                            name="firstName"
                            placeholder="ชื่อ"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            className="input"
                        />

                        <input
                            type="text"
                            name="lastName"
                            placeholder="นามสกุล"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            className="input"
                        />

                        <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            className="input"
                        />

                        <input
                            type="tel"
                            name="tel"
                            placeholder="เบอร์มือถือ"
                            value={formData.tel}
                            onChange={(e) => {
                                const onlyNumbers = e.target.value.replace(/\D/g, '');
                                setFormData((prev) => ({
                                    ...prev,
                                    tel: onlyNumbers.slice(0, 10),
                                }));
                            }}
                            inputMode="numeric"
                            maxLength={10}
                            required
                            disabled={isPending}
                            className="input"
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="อีเมล"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isPending}
                            className="input"
                        />

                        {/* Password */}
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="รหัสผ่าน"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={isPending}
                                className="input pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-500"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="ยืนยันรหัสผ่าน"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                disabled={isPending}
                                className="input pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-3 text-gray-500"
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                name="agree"
                                checked={formData.agree}
                                onChange={handleChange}
                            />
                            ยอมรับเงื่อนไขการใช้งาน
                        </label>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                        >
                            {isPending ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
                        </button>

                    </form>

                    <div className="mt-6 text-center text-sm">
                        มีบัญชีแล้ว?{' '}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            เข้าสู่ระบบ
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}