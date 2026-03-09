'use client'

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getUsers } from "@/lib/services/client/admin/users/get";
import { getBranches } from "@/lib/services/client/admin/branches/get";
import { postUser } from "@/lib/services/client/admin/users/post";
import { putUser } from "@/lib/services/client/admin/users/put";

export default function UserFormPage() {
    const params = useParams();
    const userIdParam = params.user_id as string;
    const isNew = userIdParam === "new";
    const userId = isNew ? null : Number(userIdParam);

    const [branches, setBranches] = useState<any[]>([]);

    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        birth_date: "",
        email: "",
        password: "",
        user_phone: "",
        user_role: "",
        user_id_card: "",
        user_driver_license: "",
        user_driver_license_expiry: "",
        user_address: "",
        user_blacklist: false,
        branch_id: "",
    });

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // โหลดข้อมูลเมื่อเป็นโหมดแก้ไข
    useEffect(() => {

        const loadBranches = async () => {
            try {
                const data = await getBranches();
                setBranches(data);
            } catch (err) {
                console.error(err);
            }
        };

        const loadUser = async () => {
            if (isNew || !userId) return;

            try {
                setLoading(true);
                const allUsers = await getUsers();
                const found = allUsers.find((u: any) => u.id === userId);

                if (!found) {
                    setError("ไม่พบข้อมูลผู้ใช้");
                    return;
                }

                setFormData({
                    name: found.name || "",
                    birth_date: found.birth_date
                        ? new Date(found.birth_date).toISOString().split("T")[0]
                        : "",
                    email: found.email || "",
                    password: "",
                    user_phone: found.user_phone || "",
                    user_role: found.user_role || "",
                    user_id_card: found.user_id_card || "",
                    user_driver_license: found.user_driver_license || "",
                    user_driver_license_expiry: found.user_driver_license_expiry
                        ? new Date(found.user_driver_license_expiry).toISOString().split("T")[0]
                        : "",
                    user_address: found.user_address || "",
                    user_blacklist: found.user_blacklist || false,
                    branch_id: found.branch_id?.toString() || "",
                });

            } catch (err) {
                console.error(err);
                setError("โหลดข้อมูลไม่สำเร็จ");
            } finally {
                setLoading(false);
            }
        };

        loadBranches(); // 👈 โหลดเสมอ
        loadUser();     // 👈 โหลดเฉพาะ edit

    }, [userId, isNew]);


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, user_blacklist: e.target.checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (isNew) {
                await postUser({
                    ...formData,
                    user_role: formData.user_role as "staff" | "admin",
                    branch_id: formData.branch_id
                        ? Number(formData.branch_id)
                        : undefined,
                });
                alert("สร้างผู้ใช้สำเร็จ");
            } else {
                // แก้ไข
                const confirmed = confirm("ยืนยันการอัปเดตข้อมูลผู้ใช้นี้?");
                if (!confirmed) {
                    setSaving(false);
                    return;
                }

                await putUser({
                    id: userId!,
                    ...formData,
                    user_role: formData.user_role as "staff" | "admin",
                    password: formData.password || undefined,
                    branch_id: formData.branch_id
                        ? Number(formData.branch_id)
                        : undefined,
                });
                alert("อัปเดตข้อมูลสำเร็จ");
            }

            router.push("/admin/team_members");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่");
        } finally {
            setSaving(false);
        }
    };

    const pageTitle = isNew ? "สร้างผู้ใช้ใหม่" : "แก้ไขข้อมูลผู้ใช้";

    if (loading) {
        return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-white dark:bg-gray-900 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push("/admin/team_members")}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                    >
                        <FaArrowLeft /> กลับไปหน้ารายการ
                    </button>
                    <h1 className="text-2xl font-bold">{pageTitle}</h1>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">ชื่อผู้ใช้ *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">อีเมล *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                {isNew ? "รหัสผ่าน *" : "รหัสผ่าน (เว้นว่าง = ไม่เปลี่ยน)"}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                {...(isNew ? { required: true } : {})}
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">เบอร์โทรศัพท์ *</label>
                            <input
                                type="tel"
                                name="user_phone"
                                value={formData.user_phone}
                                onChange={handleChange}
                                required
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">วันเกิด</label>
                            <input
                                type="date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">เลขใบขับขี่</label>
                            <input
                                type="text"
                                name="user_driver_license"
                                value={formData.user_driver_license}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">เลขประจำตัวประชาชน</label>
                            <input
                                type="text"
                                name="user_id_card"
                                value={formData.user_id_card}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">บทบาท</label>

                            <select
                                name="user_role"
                                value={formData.user_role}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            >
                                <option value="">เลือกบทบาท</option>
                                <option value="staff">staff</option>
                                <option value="admin">admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">วันหมดอายุใบขับขี่</label>
                            <input
                                type="date"
                                name="user_driver_license_expiry"
                                value={formData.user_driver_license_expiry}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">สาขา</label>
                            <select
                                name="branch_id"
                                value={formData.branch_id}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                            >
                                <option value="">-- เลือกสาขา --</option>
                                {branches.map((b: any) => (
                                    <option key={b.branch_id} value={b.branch_id}>
                                        {b.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">ที่อยู่</label>
                        <textarea
                            name="user_address"
                            value={formData.user_address}
                            onChange={handleChange}
                            rows={4}
                            className="w-full border rounded-lg px-4 py-2.5 dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="blacklist"
                            checked={formData.user_blacklist}
                            onChange={handleCheckbox}
                            className="w-5 h-5 accent-red-600"
                        />
                        <label htmlFor="blacklist" className="text-sm font-medium cursor-pointer">
                            Blacklist (ห้ามใช้งาน / ห้ามจอง)
                        </label>
                    </div>

                    <div className="pt-6 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.push("/admin/team_members")}
                            className="px-6 py-2.5 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg transition flex items-center gap-2 ${saving ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
                                }`}
                        >
                            <FaSave /> {saving ? "กำลังบันทึก..." : isNew ? "สร้างผู้ใช้" : "บันทึกการแก้ไข"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}