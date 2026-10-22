"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiOutlineGift, HiOutlineArrowLeft } from "react-icons/hi2";

type LoyaltySummary = {
  balance: number;
  value: number;
  settings: {
    is_active: boolean;
    earn_rate: number;
    redeem_rate: number;
    min_redeem_points: number;
    max_redeem_percent: number;
    terms?: string | null;
  };
};

export default function PointsCard() {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.status !== false) setSummary(json.data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary?.settings?.is_active) return null;

  return (
    <section className="md:rounded-2xl rounded-lg border border-amber-200 bg-gradient-to-l from-amber-50 to-white shadow-sm overflow-hidden">
      <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
            <HiOutlineGift size={22} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900">نقاطك</h2>
            <p className="mt-1 text-sm text-slate-600">
              رصيدك الحالي <strong className="text-amber-700">{summary.balance}</strong> نقطة
              ≈ <strong className="text-amber-700">{Number(summary.value || 0).toFixed(2)}</strong> ر.س
            </p>
            <p className="mt-1 text-xs text-slate-500 font-semibold">
              كل {summary.settings.redeem_rate} نقطة = 1 ر.س — الحد الأدنى للاستخدام {summary.settings.min_redeem_points} نقطة.
            </p>
          </div>
        </div>

        <Link
          href="/myAccount/points"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-amber-600 transition"
        >
          سجل النقاط
          <HiOutlineArrowLeft size={16} />
        </Link>
      </div>
    </section>
  );
}
