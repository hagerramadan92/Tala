"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1";

type Tier = { id: number; quantity: number; price: number };
type PkgProduct = {
  id: number;
  type: "main" | "optional";
  base_quantity: number;
  base_price: number;
  product: { id: number; name: string; image?: string | null; price: number };
  tiers: Tier[];
};
type Pkg = { id: number; name: string; description?: string; image?: string; background_image?: string; products: PkgProduct[] };

export default function PackageDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [mainTiers, setMainTiers] = useState<Record<number, number | "">>({});
  const [optionalTiers, setOptionalTiers] = useState<Record<number, number | "">>({});

  useEffect(() => {
    if (!params?.id) return;
    fetch(`${API_URL}/packages/${params.id}`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPkg(d?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  const total = useMemo(() => {
    if (!pkg) return 0;
    return (pkg.products || []).reduce((sum, p) => {
      if (p.type === "main") {
        const tierId = mainTiers[p.id];
        const tier = p.tiers.find((t) => t.id === Number(tierId));
        return sum + Number(p.base_price || 0) + Number(tier?.price || 0);
      }
      const tierId = optionalTiers[p.id];
      const tier = p.tiers.find((t) => t.id === Number(tierId));
      return sum + Number(tier?.price || 0);
    }, 0);
  }, [pkg, mainTiers, optionalTiers]);

  const submit = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      Swal.fire({ icon: "warning", title: "يجب تسجيل الدخول", text: "سجّل الدخول لإتمام طلب الباقة" })
        .then(() => router.push("/login"));
      return;
    }

    const selections: any[] = [];
    (pkg?.products || []).forEach((p) => {
      if (p.type === "main") {
        selections.push({ package_product_id: p.id, tier_id: mainTiers[p.id] || null });
      } else if (optionalTiers[p.id]) {
        selections.push({ package_product_id: p.id, tier_id: optionalTiers[p.id] });
      }
    });

    if (selections.length === 0) {
      Swal.fire({ icon: "warning", title: "اختر منتجات الباقة أولاً" });
      return;
    }

    try {
      setOrderLoading(true);
      const res = await fetch(`${API_URL}/packages/${pkg?.id}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ selections }),
      });
      const data = await res.json();
      if (!res.ok || data.status === false) throw new Error(data.message || "تعذر إضافة الباقة");
      router.push("/payment");
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "خطأ", text: e?.message || "حدث خطأ" });
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) return <div className="container py-16 text-center font-bold">جاري تحميل الباقة...</div>;
  if (!pkg) return <div className="container py-16 text-center font-bold">الباقة غير متاحة.</div>;

  return (
    <section dir="rtl" className="container py-8 md:py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative w-full md:w-64 h-56 bg-slate-50 rounded-2xl overflow-hidden shrink-0">
            {pkg.image ? <Image src={pkg.image} alt={pkg.name} fill sizes="256px" className="object-contain p-3" /> : <div className="w-full h-full grid place-items-center text-5xl">🎁</div>}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">{pkg.name}</h1>
            {pkg.description ? <p className="mt-3 text-slate-600 text-sm md:text-base">{pkg.description}</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {(pkg.products || []).map((p) => {
          const isMain = p.type === "main";
          return (
            <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 rounded-xl bg-slate-50 overflow-hidden shrink-0">
                  {p.product?.image ? <Image src={p.product.image} alt={p.product.name} fill sizes="80px" className="object-contain p-1" /> : null}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900">{p.product?.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isMain ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {isMain ? "منتج أساسي" : "منتج مرشح"}
                    </span>
                  </div>

                  {isMain ? (
                    <div className="mt-2 text-sm text-slate-700 font-bold">
                      الحد الأدنى: {p.base_quantity} قطعة — السعر الأساسي: {Number(p.base_price).toFixed(2)} ريال
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-600">اختياري — اختر الكمية إذا رغبت.</div>
                  )}

                  <div className="mt-3 max-w-sm">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {isMain ? "إضافة كمية (تُضاف على الحد الأدنى)" : "الكمية"}
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={isMain ? mainTiers[p.id] ?? "" : optionalTiers[p.id] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : "";
                        if (isMain) setMainTiers((s) => ({ ...s, [p.id]: v }));
                        else setOptionalTiers((s) => ({ ...s, [p.id]: v }));
                      }}
                    >
                      <option value="">{isMain ? "بدون زيادة" : "بدون إضافة"}</option>
                      {p.tiers.map((t) => (
                        <option key={t.id} value={t.id}>
                          +{t.quantity} قطعة — {Number(t.price).toFixed(2)} ريال
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-3 mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-bold">الإجمالي</p>
          <p className="text-xl font-black text-slate-900">{total.toFixed(2)} <span className="text-sm">ريال</span></p>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={orderLoading}
          className="px-6 py-3 rounded-xl bg-pro text-white font-extrabold text-sm md:text-base disabled:opacity-60"
        >
          {orderLoading ? "جارٍ التحويل..." : "اطلب الآن"}
        </button>
      </div>
    </section>
  );
}
