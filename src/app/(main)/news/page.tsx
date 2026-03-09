import { Suspense } from "react";
import NewsDetailClient from "./NewsDetailClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">กำลังโหลด...</div>}>
      <NewsDetailClient />
    </Suspense>
  );
}