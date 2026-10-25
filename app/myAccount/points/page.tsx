"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiOutlineArrowRight, HiOutlineGift } from "react-icons/hi2";

type Transaction = {
  id: number;
  type: string;
  points: number;
  balance_after: number;
  description?: string;
  created_at?: string;
};

type LoyaltySummary = {
  balance: number;
  value: number;
  settings: {
    is_active: boolean;
    earn_mode?: "amount" | "per_order" | "both";
    earn_rate: number;
    points_per_order?: number;
    redeem_rate: number;
    min_redeem_points: number;
    max_redeem_percent: number;
    terms?: string | null;
  };
  transactions: Transaction[];
};

const typeLabels: Record<string, string> = {
  earn: "نقاط مكتسبة",
  redeem: "استخدام نقاط",
  adjust: "تعديل إداري",
  refund: "استرجاع نقاط",
  reversal: "خصم نقاط",
};

export default function PointsPage() {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("يرجى تسجيل الدخول أولاً.");
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json?.status === false) throw new Error(json?.message || "تعذر تحميل النقاط");
        setSummary(json.data);
      })
      .catch((err) => setError(err?.message || "تعذر تحميل النقاط"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HiOutlineGift className="text-amber-500" size={24} />
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">سجل النقاط</h1>
        </div>
        <Link href="/myAccount" className="inline-flex items-center gap-1 text-sm font-extrabold text-pro">
          <HiOutlineArrowRight size={16} />
          رجوع لحسابي
        </Link>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 font-bold">
          جارٍ تحميل النقاط...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 font-bold text-sm">
          {error}
        </div>
      )}

      {summary && (
        <>
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-l from-amber-50 to-white p-5 md:p-6">
            <p className="text-sm font-bold text-slate-600">رصيدك الحالي</p>
            <p className="text-3xl font-black text-amber-700 mt-1">
              {summary.balance} <span className="text-base font-extrabold">نقطة</span>
            </p>
            <p className="text-sm font-bold text-slate-600 mt-1">
              تعادل {Number(summary.value || 0).toFixed(2)} ر.س
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-3 leading-relaxed">
              {summary.settings.earn_mode === "per_order"
                ? `تحصل على ${summary.settings.points_per_order ?? 0} نقطة لكل طلب مكتمل.`
                : summary.settings.earn_mode === "both"
                  ? `تحصل على ${summary.settings.earn_rate} نقطة لكل 1 ر.س + ${summary.settings.points_per_order ?? 0} نقطة لكل طلب مكتمل.`
                  : `تحصل على ${summary.settings.earn_rate} نقطة لكل 1 ر.س.`}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-2 leading-relaxed">
              كل {summary.settings.redeem_rate} نقطة = 1 ر.س. الحد الأدنى للاستخدام {summary.settings.min_redeem_points} نقطة،
              وبحد أقصى {summary.settings.max_redeem_percent}% من قيمة الطلب.
            </p>
            {summary.settings.terms && (
              <p className="text-xs text-amber-800 bg-amber-100/60 border border-amber-200 rounded-xl p-3 mt-3">
                {summary.settings.terms}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-extrabold text-slate-900">آخر الحركات</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {summary.transactions.length === 0 && (
                <p className="p-6 text-center text-sm text-slate-500 font-semibold">
                  لا توجد حركات نقاط حتى الآن. اطلب واستلم طلبك لتكتسب نقاطك الأولى.
                </p>
              )}
              {summary.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900">
                      {typeLabels[transaction.type] || transaction.type}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
                      {transaction.description || "—"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{transaction.created_at}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className={`text-sm font-black ${transaction.points >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {transaction.points > 0 ? "+" : ""}
                      {transaction.points}
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      الرصيد: {transaction.balance_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
