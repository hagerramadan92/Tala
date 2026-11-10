"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1";

type Row = { package_product_id: number; quantity: number };

export default function PackageCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [shipping, setShipping] = useState<any[]>([]);
  const [shippingSel, setShippingSel] = useState<any>(null);
  const [otoOrderId, setOtoOrderId] = useState<string>("");
  const [methods, setMethods] = useState<any[]>([]);
  const [method, setMethod] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<any>(null);

  useEffect(() => {
    setToken(localStorage.getItem("auth_token"));
    try {
      const raw = sessionStorage.getItem("package_checkout_v1");
      if (raw) setPayload(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  // ما نعيدش التوجيه قبل قراءة بيانات الطلب من sessionStorage
  useEffect(() => {
    if (!hydrated) return;
    if (!payload || String(payload.package_id) !== String(params?.id)) {
      router.replace(`/packages/${params?.id}`);
    }
  }, [hydrated, payload, params?.id, router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/addresses`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.data) ? d.data : [];
        setAddresses(list);
        if (list[0]?.id) setAddressId(String(list[0].id));
      })
      .catch(() => {});
    fetch(`${API_URL}/payment-methods?is_payment=true`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.data) ? d.data : [];
        // الباكدجات: كاش + بطاقات/Apple Pay (بوابات تابي/تمارا تحتاج طلب منتجات)
        setMethods(list.filter((m: any) => ["cash", "paymob", "applepay"].includes(String(m?.key || "").toLowerCase())));
      })
      .catch(() => {});
  }, [token]);

  const selectedAddress = useMemo(() => addresses.find((a) => String(a.id) === addressId) || null, [addresses, addressId]);

  useEffect(() => {
    if (!token || !selectedAddress) return;
    setShipping([]);
    setShippingSel(null);
    const qs = new URLSearchParams();
    if (selectedAddress.id) qs.set("address_id", String(selectedAddress.id));
    if (selectedAddress.city) qs.set("city", String(selectedAddress.city));

    fetch(`${API_URL}/shippings-options?${qs.toString()}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        const fees = d?.data?.deliveryFees?.deliveryCompany || [];
        setShipping(fees);
        setOtoOrderId(String(d?.data?.orderId || ""));
        if (fees[0]) setShippingSel(fees[0]);
      })
      .catch(() => {});
  }, [token, selectedAddress]);

  const itemsTotal = Number(payload?.items_total || 0);
  const shippingPrice = Number(shippingSel?.price ?? shippingSel?.deliveryFee ?? shippingSel?.total ?? 0);
  const total = itemsTotal + shippingPrice;

  const submit = async () => {
    if (!token || !payload) return;
    if (!shippingSel) {
      Swal.fire({ icon: "warning", title: "اختر شركة الشحن" });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/package-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          package_id: payload.package_id,
          selections: payload.selections as Row[],
          address_id: selectedAddress?.id || null,
          shipping_address: selectedAddress
            ? `${selectedAddress.city || ""} - ${selectedAddress.address || selectedAddress.street || ""}`.trim()
            : "",
          customer_name: (selectedAddress?.full_name as string) || "",
          customer_phone: (selectedAddress?.phone as string) || "",
          customer_email: (selectedAddress?.email as string) || "",
          shipping_price: shippingPrice,
          delivery_option_name: shippingSel?.deliveryOptionName || shippingSel?.companyName || "",
          delivery_option_id: String(shippingSel?.deliveryOptionId || ""),
          oto_order_id: otoOrderId,
          payment_method: method,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status === false) throw new Error(data?.message || "تعذر إنشاء طلب الباقة");

      sessionStorage.removeItem("package_checkout_v1");

      // الدفع الإلكتروني (Paymob / Apple Pay) → توجيه لبوابة الدفع
      const paymentUrl = data?.payment_url || data?.shorten_url;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      setDone(data.data);
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "خطأ", text: e?.message || "حدث خطأ" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <section dir="rtl" className="container py-14 text-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">تم إنشاء طلب الباقة</h1>
          <p className="mt-2 text-slate-600">رقم الطلب: <b>{done.order_number}</b></p>
          <p className="mt-1 text-slate-600">الإجمالي: <b>{Number(done.total_amount).toFixed(2)}</b> ريال</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => router.push("/packages")} className="px-5 py-3 rounded-xl bg-pro text-white font-extrabold">الباقات</button>
            <button onClick={() => router.push("/orders")} className="px-5 py-3 rounded-xl border font-extrabold">طلباتي</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section dir="rtl" className="container py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900">إتمام طلب الباقة</h1>
      <p className="mt-2 text-slate-600 text-sm">{payload?.package_name || "الباقة"}</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold mb-3">عنوان الشحن</h2>
            {addresses.length === 0 ? (
              <p className="text-sm text-slate-600">أضف عنوانًا في حسابك لإتمام الطلب.</p>
            ) : (
              <select value={addressId} onChange={(e) => setAddressId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name} — {a.city} — {a.address || a.street}</option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold mb-3">شركة الشحن</h2>
            {shipping.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد خيارات شحن متاحة لهذا العنوان حاليًا.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shipping.map((s, i) => (
                  <label key={i} className={`cursor-pointer rounded-xl border p-3 text-sm flex items-center justify-between ${shippingSel === s ? "border-pro ring-2 ring-pro/20" : "border-slate-200"}`}>
                    <span className="font-bold">{s.deliveryOptionName || s.companyName || `شركة ${i + 1}`}</span>
                    <span className="font-extrabold text-pro">{Number(s.price ?? s.deliveryFee ?? s.total ?? 0).toFixed(2)} ريال</span>
                    <input type="radio" name="ship" className="hidden" checked={shippingSel === s} onChange={() => setShippingSel(s)} />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold mb-3">طريقة الدفع</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {methods.map((m) => (
                <label key={m.id} className={`cursor-pointer rounded-xl border p-3 text-sm ${String(method) === String(m.id) ? "border-pro ring-2 ring-pro/20" : "border-slate-200"}`}>
                  <input type="radio" name="pay" className="hidden" checked={String(method) === String(m.id)} onChange={() => setMethod(String(m.id))} />
                  <span className="font-bold">{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 h-fit sticky top-3">
          <h2 className="font-extrabold mb-3">ملخص الطلب</h2>
          <div className="flex justify-between text-sm py-1"><span>المنتجات</span><span>{itemsTotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm py-1"><span>الشحن</span><span>{shippingPrice.toFixed(2)}</span></div>
          <div className="mt-2 border-t pt-2 flex justify-between font-black"><span>الإجمالي</span><span>{total.toFixed(2)} ريال</span></div>
          <button onClick={submit} disabled={loading || !shippingSel} className="mt-4 w-full py-3 rounded-xl bg-pro text-white font-extrabold disabled:opacity-60">
            {loading ? "جارٍ إنشاء الطلب..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </section>
  );
}
