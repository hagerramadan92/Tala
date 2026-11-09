"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1";

type Tier = { id: number; min_quantity: number; max_quantity: number | null; price: number };
type PkgProduct = {
  id: number;
  type: "main" | "optional";
  base_quantity: number;
  base_price: number;
  product: { id: number; name: string; image?: string | null; price: number };
  tiers: Tier[];
};
type Pkg = { id: number; name: string; description?: string; image?: string; products: PkgProduct[] };

function rangePrice(p: PkgProduct, qty: number): number {
  const tiers = p.tiers || [];
  const match =
    tiers.find((t) => qty >= t.min_quantity && (t.max_quantity === null || qty <= t.max_quantity)) ||
    [...tiers].filter((t) => qty >= t.min_quantity).sort((a, b) => b.min_quantity - a.min_quantity)[0];

  // سعر الشريحة = سعر القطعة الواحدة، والإجمالي = الكمية × سعر القطعة.
  if (p.type === "main") {
    if (match) return qty * Number(match.price || 0);
    return Number(p.base_price || 0);
  }

  if (qty <= 0) return 0;
  return match ? qty * Number(match.price || 0) : 0;
}

export default function PackageDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!params?.id) return;
    fetch(`${API_URL}/packages/${params.id}`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const data: Pkg | null = d?.data || null;
        setPkg(data);
        if (data) {
          const initial: Record<number, number> = {};
          (data.products || []).forEach((p) => {
            initial[p.id] = p.type === "main" ? Math.max(1, Number(p.base_quantity || 1)) : 0;
          });
          setQuantities(initial);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  const total = useMemo(() => {
    if (!pkg) return 0;
    return (pkg.products || []).reduce((sum, p) => {
      const qty = Number(quantities[p.id] || 0);
      if (p.type === "optional" && qty <= 0) return sum;
      return sum + rangePrice(p, qty);
    }, 0);
  }, [pkg, quantities]);

  const submit = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      Swal.fire({ icon: "warning", title: "يجب تسجيل الدخول", text: "سجّل الدخول لإتمام طلب الباقة" }).then(() =>
        router.push("/login")
      );
      return;
    }

    const invalidProducts = (pkg?.products || []).filter((p) => {
      const qty = Number(quantities[p.id] || 0);
      return p.type === "main" && qty < Math.max(1, Number(p.base_quantity || 1));
    });

    if (invalidProducts.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "كمية غير صحيحة",
        text: "الكمية لازم تكون أكبر من أو تساوي الحد الأدنى للمنتجات الأساسية.",
        confirmButtonText: "تمام",
      });
      return;
    }

    const selections = (pkg?.products || [])
      .map((p) => ({ package_product_id: p.id, quantity: Number(quantities[p.id] || 0) }))
      .filter((s) => s.quantity > 0);

    if (selections.length === 0) {
      Swal.fire({ icon: "warning", title: "أدخل الكمية المطلوبة" });
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
            {pkg.image ? (
              <Image src={pkg.image} alt={pkg.name} fill sizes="256px" className="object-contain p-3" />
            ) : (
              <div className="w-full h-full grid place-items-center text-5xl">🎁</div>
            )}
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
          const min = isMain ? Math.max(1, Number(p.base_quantity || 1)) : 0;
          const qty = Number(quantities[p.id] || 0);

          return (
            <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 rounded-xl bg-slate-50 overflow-hidden shrink-0">
                  {p.product?.image ? (
                    <Image src={p.product.image} alt={p.product.name} fill sizes="80px" className="object-contain p-1" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900">{p.product?.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isMain ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isMain ? "منتج أساسي" : "منتج مرشح"}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-slate-700 font-bold">
                    {isMain ? (
                      <>
                        الحد الأدنى: {min} قطعة — والسعر بيتحسب بسعر القطعة حسب الرينج
                      </>
                    ) : (
                      <>اختياري — لو هتضيفه اكتب الكمية (بدون حد أدنى)</>
                    )}
                  </div>

                  {p.tiers?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.tiers.map((t) => (
                        <span key={t.id} className="text-[10px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-bold">
                          {t.min_quantity}
                          {t.max_quantity ? `-${t.max_quantity}` : "+"} قطعة
                          {" → "}{Number(t.price).toFixed(2)} ريال/قطعة
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 max-w-xs">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {isMain ? `الكمية (لازم ${min} أو أكثر)` : "الكمية (اختياري)"}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={isMain ? min : 0}
                      value={qty || ""}
                      placeholder={isMain ? String(min) : "0"}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setQuantities((s) => ({ ...s, [p.id]: 0 }));
                          return;
                        }
                        let v = parseInt(raw, 10);
                        if (isNaN(v) || v < 0) v = 0;
                        setQuantities((s) => ({ ...s, [p.id]: v }));
                      }}
                      aria-invalid={isMain && qty < min}
                      className={[
                        "w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
                        isMain && qty < min
                          ? "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                          : "border-slate-200 focus:border-pro",
                      ].join(" ")}
                    />
                    {isMain && qty < min && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600">
                        <span>⚠️</span>
                        <span>الكمية لازم تكون أكبر من أو تساوي الحد الأدنى ({min}).</span>
                      </p>
                    )}
                  </div>

                  {qty > 0 && (
                    <p className="mt-2 text-sm font-extrabold text-pro">
                      سعر هذا المنتج: {rangePrice(p, qty).toFixed(2)} ريال ({qty} × سعر القطعة)
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-3 mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-bold">الإجمالي</p>
          <p className="text-xl font-black text-slate-900">
            {total.toFixed(2)} <span className="text-sm">ريال</span>
          </p>
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
