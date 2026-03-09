"use client";

import Link from "next/link";

type CartTabsProps = {
    activeTab: "upcoming" | "history";
};

export default function CartTabs({ activeTab }: CartTabsProps) {
    return (
        <div className="flex bg-white shadow-md overflow-hidden sticky top-0 sm:top-[60px] z-50">
            <div className="flex-1">
                {activeTab === "upcoming" ? (
                    <div className="flex items-center justify-center py-3 font-semibold bg-blue-600 text-white cursor-default">
                        กำลังจะมาถึง
                    </div>
                ) : (
                    <Link
                        href="/cart"
                        className="flex items-center justify-center py-3 font-medium"
                    >
                        กำลังจะมาถึง
                    </Link>
                )}
            </div>
            <div className="flex-1">
                {activeTab === "history" ? (
                    <div className="flex items-center justify-center py-3 font-semibold text-white bg-blue-600 cursor-default">
                        คืนรถแล้ว / ยกเลิกการจอง
                    </div>
                ) : (
                    <Link
                        href="/cart/history"
                        className="flex items-center justify-center py-3 font-medium"
                    >
                        คืนรถแล้ว / ยกเลิกการจอง
                    </Link>
                )}
            </div>
        </div>
    );
}
