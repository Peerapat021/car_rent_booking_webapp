export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    birth_date: string;
    user_phone?: string;
};

export type RegisterResponse = {
    message: string;
    id: number;
};

export async function postRegister(
    payload: RegisterPayload
): Promise<RegisterResponse> {
    const res = await fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Register failed");
    }

    return res.json();
}