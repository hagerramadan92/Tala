"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import { BadgeCheck, Box, Coffee, Layers3, Minus, Package, Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import styles from "./details.module.css";

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
  // المطلبات: تصميم
  const [designType, setDesignType] = useState<"needs_design" | "has_design" | null>(null);
  const [designFile, setDesignFile] = useState<string | null>(null);
  const [designFileName, setDesignFileName] = useState<string>("");
  const [uploadingDesign, setUploadingDesign] = useState(false);

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

  const itemsTotal = useMemo(() => {
    if (!pkg) return 0;
    return (pkg.products || []).reduce((sum, p) => {
      const qty = Number(quantities[p.id] || 0);
      if (p.type === "optional" && qty <= 0) return sum;
      return sum + rangePrice(p, qty);
    }, 0);
  }, [pkg, quantities]);

  const designPrice = Number((pkg as any)?.design_price || 0);
  const designFee = designType === "needs_design" ? designPrice : 0;
  const total = itemsTotal + designFee;

  const uploadDesignFile = async (file: File) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      Swal.fire({ icon: "warning", title: "سجّل الدخول أولاً", text: "لازم تسجل دخول عشان ترفع ملف التصميم" }).then(() => router.push("/login"));
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      Swal.fire({ icon: "warning", title: "الملف لازم يكون PDF" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "حجم الملف أكبر من 5 ميجا" });
      return;
    }
    try {
      setUploadingDesign(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/package-orders/design-upload`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.status === false) throw new Error(data?.message || "تعذر رفع الملف");
      setDesignFile(data.data?.path || null);
      setDesignFileName(file.name);
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "خطأ", text: e?.message || "تعذر رفع الملف" });
    } finally {
      setUploadingDesign(false);
    }
  };

  const submit = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      Swal.fire({ icon: "warning", title: "يجب تسجيل الدخول", text: "سجّل الدخول لإتمام طلب الباقة" }).then(() =>
        router.push("/login")
      );
      return;
    }

    if (!designType) {
      Swal.fire({ icon: "warning", title: "اختر المطلبات: لدي تصميم أو أحتاج تصميمات" });
      return;
    }
    if (designType === "has_design" && !designFile) {
      Swal.fire({ icon: "warning", title: "ارفع ملف التصميم (PDF) أولاً" });
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

    // طلب الباقة مستقل تمامًا عن السلة
    try {
      sessionStorage.setItem(
        "package_checkout_v1",
        JSON.stringify({
          package_id: pkg?.id,
          package_name: pkg?.name,
          selections,
          items_total: itemsTotal,
          design_type: designType,
          design_file: designType === "has_design" ? designFile : null,
          design_fee: designFee,
          created_at: new Date().toISOString(),
        })
      );
    } catch {}

    router.push(`/packages/${pkg?.id}/checkout`);
  };

  const heroFeatures = (() => {
    const names = (pkg?.products || []).map((p) => p.product?.name || "").filter(Boolean);
    const has = (re: RegExp) => names.some((n) => re.test(n));

    const items: { label: string; icon: any }[] = [];
    if (has(/علب|بوكس|box/i)) items.push({ label: "علب طعام", icon: Layers3 });
    if (has(/كوب|cup|أكواب|اكواب/i)) items.push({ label: "أكواب ورقية", icon: Coffee });
    if (has(/كيس|bag|أكياس|اكياس/i)) items.push({ label: "أكياس مطاعم", icon: ShoppingBag });

    // نكمل لـ 3 مميزات دايمًا (منتجات مختارة / جودة عالية / مناسبة للاستخدام)
    const defaults = [
      { label: "منتجات مختارة", icon: BadgeCheck },
      { label: "جودة عالية", icon: Package },
      { label: "مناسبة للاستخدام", icon: ShoppingCart },
    ];
    for (const item of defaults) {
      if (items.length >= 3) break;
      if (!items.some((i) => i.label === item.label)) items.push(item);
    }

    return items.slice(0, 3);
  })();

  if (loading) return <div className={styles.state}>جاري تحميل الباقة...</div>;
  if (!pkg) return <div className={styles.state}>الباقة غير متاحة.</div>;

  return (
    <main dir="rtl" className={styles.page}>
      <section className={styles.detailsContainer}>
      <div className="relative rounded-[28px] bg-[linear-gradient(100deg,#fff5e9_0,#ffffff_31%,#ffffff_70%,#fff0df_100%)] shadow-[0_7px_18px_rgba(20,33,61,.10)] p-4 md:p-7 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* صورة الباقة */}
          <div className="relative w-full md:w-[47%] shrink-0">
            <div className="relative h-[280px] md:h-[380px] w-full rounded-[26px] border-2 border-[#ff8a3d] bg-white overflow-hidden">
              {pkg.image ? (
                <Image src={pkg.image} alt={pkg.name} fill sizes="(max-width:768px) 100vw, 47vw" className="object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-6xl">🎁</div>
              )}
            </div>
          </div>

          {/* النص والمميزات */}
          <div className="flex-1 text-center md:text-right">
            <h1 className="text-4xl md:text-[56px] leading-tight font-black text-[#0b2545]">{pkg.name}</h1>
            <span className="block w-16 md:w-20 h-1.5 rounded-full bg-[#ff7a00] my-4 md:my-5 mx-auto md:mr-0" />
            {pkg.description ? (
              <p className="text-lg md:text-[26px] leading-relaxed font-extrabold text-[#0b2545]">
                {pkg.description}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap md:flex-nowrap justify-center md:justify-start gap-2 md:gap-3">
              {heroFeatures.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fbf3ea] px-3 md:px-4 py-3 md:py-3.5 text-[#0b2545] font-extrabold text-sm md:text-lg whitespace-nowrap"
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#ff7a00]" strokeWidth={2.2} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <header className={styles.contentHeading}><h2>محتويات الباقة</h2><p>تتضمن هذه الباقة المنتجات التالية بالكميات المحددة:</p></header>
      <div className={styles.products}>
        {(pkg.products || []).map((p) => {
          const isMain = p.type === "main";
          const min = isMain ? Math.max(1, Number(p.base_quantity || 1)) : 0;
          const qty = Number(quantities[p.id] || 0);

          return (
            <article key={p.id} className={styles.productCard}>
                <div className={styles.productImage}>
                  {p.product?.image ? (
                    <Image src={p.product.image} alt={p.product.name} fill sizes="110px" className={styles.containImage} />
                  ) : <Box/>}
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.nameRow}><h3>{p.product?.name}</h3><span className={isMain?styles.mainBadge:styles.optionalBadge}>
                      {isMain ? "منتج أساسي" : "منتج مرشح"}
                    </span></div>
                  <p className={styles.productDescription}>{isMain?"منتج أساسي مختار بعناية ضمن محتويات الباقة.":"منتج اختياري يمكنك إضافته بالكمية المناسبة."}</p>
                  <p className={styles.minimum}><Layers3/> الحد الأدنى: {min} قطعة</p>
                </div>
                <div className={styles.quantity}><label>الكمية</label><div><button onClick={()=>setQuantities(s=>({...s,[p.id]:Math.max(min,(s[p.id]||0)-1)}))}><Minus/></button><input type="number" min={min} value={qty} onChange={e=>setQuantities(s=>({...s,[p.id]:Math.max(0,parseInt(e.target.value,10)||0)}))}/><button onClick={()=>setQuantities(s=>({...s,[p.id]:(s[p.id]||0)+1}))}><Plus/></button></div></div>
                <div className={styles.itemTotal}><span>السعر الإجمالي</span><strong>{rangePrice(p,qty).toFixed(2)} ريال</strong></div>
            </article>
          );
        })}
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="text-xl md:text-2xl font-black text-slate-900">المطلبات</h2>
        <p className="mt-1 text-sm text-slate-500">اختر: عندك تصميم جاهز ولا محتاج تصميمات؟</p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDesignType("needs_design")}
            className={`p-4 rounded-2xl border text-right transition ${designType === "needs_design" ? "border-pro bg-blue-50" : "border-slate-200 bg-white"}`}
          >
            <p className="font-extrabold text-slate-900">أحتاج تصميمات</p>
            {designPrice > 0 ? (
              <p className="text-xs font-bold text-amber-700 mt-1">+ {designPrice.toFixed(2)} ريال</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">حسب إعدادات الباقة</p>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDesignType("has_design")}
            className={`p-4 rounded-2xl border text-right transition ${designType === "has_design" ? "border-pro bg-blue-50" : "border-slate-200 bg-white"}`}
          >
            <p className="font-extrabold text-slate-900">لدي تصميم</p>
            <p className="text-xs text-slate-500 mt-1">ارفع ملف PDF</p>
          </button>
        </div>

        {designType === "has_design" && (
          <div className="mt-4">
            <label className="flex flex-col items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center cursor-pointer hover:border-pro transition">
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadDesignFile(f);
                }}
              />
              <span className="text-2xl">📄</span>
              <span className="text-sm font-extrabold text-slate-800">
                {uploadingDesign ? "جارٍ رفع الملف..." : designFileName || "اختر ملف التصميم (PDF)"}
              </span>
              <span className="text-[11px] text-slate-500">PDF فقط — بحد أقصى 5 ميجا</span>
            </label>

            {designFile && <p className="mt-2 text-xs font-bold text-emerald-600">✅ تم رفع الملف</p>}

            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800">
              يرجى التأكد من وجود كافة التصاميم في الملف المرفق
            </div>
          </div>
        )}
      </section>

      <div className={styles.checkout}>
        <div className={styles.grandTotal}><span>الإجمالي</span><strong>{total.toFixed(2)} <small>ريال</small></strong></div>
        <div className={styles.separator}/>
        <button type="button" onClick={submit} disabled={orderLoading}>
          <ShoppingCart/>{orderLoading ? "جارٍ التحويل..." : "اطلب الآن"}
        </button>
      </div>
      </section>
    </main>
  );
}
