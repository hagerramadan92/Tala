"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import { BadgeCheck, Box, Layers3, Minus, Plus, ShoppingCart } from "lucide-react";
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

    // طلب الباقة مستقل تمامًا عن السلة
    try {
      sessionStorage.setItem(
        "package_checkout_v1",
        JSON.stringify({
          package_id: pkg?.id,
          package_name: pkg?.name,
          selections,
          items_total: total,
          created_at: new Date().toISOString(),
        })
      );
    } catch {}

    router.push(`/packages/${pkg?.id}/checkout`);
  };

  if (loading) return <div className={styles.state}>جاري تحميل الباقة...</div>;
  if (!pkg) return <div className={styles.state}>الباقة غير متاحة.</div>;

  return (
    <main dir="rtl" className={styles.page}>
      <section className={styles.detailsContainer}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
            <h1>{pkg.name}</h1>
            <span className={styles.heroLine}/>
            <p>{pkg.description || "باقة متكاملة ومختارة بعناية لتلبية احتياجاتك الأساسية، بجودة عالية وتصميم احترافي."}</p>
            <div className={styles.features}><span><BadgeCheck/> منتجات مختارة</span><span><Box/> جودة عالية</span><span><ShoppingCart/> مناسبة للاستخدام</span></div>
        </div>
          <div className={styles.heroImage}>
            {pkg.image ? (
              <Image src={pkg.image} alt={pkg.name} fill sizes="280px" className={styles.containImage} />
            ) : (
              <div className={styles.giftBox}><span className={styles.bow}>🎀</span><span>🎁</span></div>
            )}
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
