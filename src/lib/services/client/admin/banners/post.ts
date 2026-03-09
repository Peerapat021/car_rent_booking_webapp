// src/lib/services/client/admin/banners/post.ts
export async function postBanner(formData: FormData) {
  const res = await fetch(`/api/admin/banners`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = "ไม่สามารถเพิ่มแบนเนอร์ได้";
    try {
      const errData = await res.json();
      errorMessage = errData.error || errData.details || errorMessage;
    } catch {
      errorMessage += `: ${await res.text()}`;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}