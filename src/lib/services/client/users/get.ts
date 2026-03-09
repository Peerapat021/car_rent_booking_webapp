
export async function getUserById(id: string | number) {
    const res = await fetch(`/api/users/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            throw new Error("หมดเวลาการเชื่อมต่อ กรุณาเข้าสู่ระบบใหม่");
        }
        if (res.status === 404) {
            throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
        }
        throw new Error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }

    return res.json();
}
