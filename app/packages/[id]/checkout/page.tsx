"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import BankPayment from "@/components/BankPayment";

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
  const [showAddress, setShowAddress] = useState(true);
  // طريقة الاستلام: توصيل لشركة شحن أو استلام من الفرع (بدون شحن)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  // المطلبات: تصميم
  const [designType, setDesignType] = useState<"needs_design" | "has_design" | null>(null);
  const [designPrice, setDesignPrice] = useState(0);
  const [designFile, setDesignFile] = useState<string | null>(null);
  const [designFileName, setDesignFileName] = useState<string>("");
  const [uploadingDesign, setUploadingDesign] = useState(false);
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
      if (raw) {
        const parsed = JSON.parse(raw);
        setPayload(parsed);
        if (parsed?.design_type) setDesignType(parsed.design_type);
        if (parsed?.design_file) {
          setDesignFile(parsed.design_file);
          setDesignFileName("ملف التصميم المرفوع");
        }
      }
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

  // سعر خدمة التصميم من إعدادات الباقة في الداشبورد
  useEffect(() => {
    if (!params?.id) return;
    fetch(`${API_URL}/packages/${params.id}`, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setDesignPrice(Number(d?.data?.design_price || 0)))
      .catch(() => {});
  }, [params?.id]);

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
        // البكجات: كاش + بطاقات/Apple Pay (بوابات تابي/تمارا تحتاج طلب منتجات)
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

  const uploadDesignFile = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
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

  const itemsTotal = Number(payload?.items_total || 0);
  const isPickup = deliveryType === "pickup";
  const shippingPrice = isPickup
    ? 0
    : Number(shippingSel?.price ?? shippingSel?.deliveryFee ?? shippingSel?.total ?? 0);
  const designFee = designType === "needs_design" ? designPrice : 0;
  const total = itemsTotal + designFee + shippingPrice;

  const submit = async () => {
    if (!token || !payload) return;
    if (!designType) {
      Swal.fire({ icon: "warning", title: "اختر المطلبات: لدي تصميم أو أحتاج تصميمات" });
      return;
    }
    if (designType === "has_design" && !designFile) {
      Swal.fire({ icon: "warning", title: "ارفع ملف التصميم (PDF) أولاً" });
      return;
    }
    if (!isPickup && !shippingSel) {
      Swal.fire({ icon: "warning", title: "اختر شركة الشحن أو استلام من الفرع" });
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
          delivery_option_name: isPickup
            ? "استلام من الفرع"
            : shippingSel?.deliveryOptionName || shippingSel?.companyName || "",
          delivery_option_id: isPickup ? "" : String(shippingSel?.deliveryOptionId || ""),
          oto_order_id: isPickup ? "" : otoOrderId,
          design_type: designType,
          design_file: designType === "has_design" ? designFile : null,
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
              <>
                {/* ملخص العنوان المحدد */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-slate-700 font-extrabold">
                    التوصيل إلى:{" "}
                    <span className="text-slate-900">
                      {selectedAddress ? `${selectedAddress.city || ""} - ${selectedAddress.area || ""}` : "لم يتم اختيار عنوان"}
                    </span>
                  </p>

                  {selectedAddress && (
                    <div className="mt-2 text-sm text-slate-600 space-y-1">
                      <p>{selectedAddress.details || selectedAddress.address || selectedAddress.street}</p>
                      <p className="font-semibold">
                        {selectedAddress.full_name}
                        {selectedAddress.phone ? ` - ${selectedAddress.phone}` : ""}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAddress((v) => !v)}
                      className="text-pro font-extrabold underline underline-offset-4"
                    >
                      {showAddress ? "إخفاء العناوين" : "تغيير العنوان"}
                    </button>

                    {selectedAddress && (
                      <span className="text-xs font-extrabold rounded-full bg-white border border-slate-200 px-3 py-1 text-slate-600">
                        عنوان محدد
                      </span>
                    )}
                  </div>
                </div>

                {/* قائمة العناوين */}
                {showAddress && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {addresses.map((address) => {
                      const active = String(selectedAddress?.id) === String(address.id);
                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => setAddressId(String(address.id))}
                          className={`text-right rounded-3xl border p-4 transition ${
                            active ? "border-pro bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-extrabold text-slate-900">{address.full_name}</p>
                              <p className="text-sm text-slate-600 mt-1">
                                {address.city} - {address.area}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-extrabold rounded-full px-3 py-1 border ${
                                active ? "bg-white border-pro text-pro" : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              {active ? "محدد" : "اختر"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-2">{address.details || address.address || address.street}</p>
                          <div className="flex items-center justify-between">
                            {address.phone && <p className="text-xs text-slate-500 mt-2">{address.phone}</p>}
                            <p className="text-xs text-pro font-bold mt-2">حساب الشحن حسب المدينة</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {payload?.design_type && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
              المطلبات: {payload.design_type === "needs_design" ? "أحتاج تصميمات" : "لدي تصميم مرفوع"} ✅
            </div>
          )}

          {!payload?.design_type && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold mb-1">المطلبات</h2>
            <p className="text-xs text-slate-500 mb-3">اختر: عندك تصميم جاهز ولا محتاج تصميمات؟</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                {designFile && (
                  <p className="mt-2 text-xs font-bold text-emerald-600">✅ تم رفع الملف</p>
                )}

                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800">
                  يرجى التأكد من وجود كافة التصاميم في الملف المرفق
                </div>
              </div>
            )}
          </div>

          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold mb-3">طريقة الاستلام</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setDeliveryType("delivery")}
                className={`p-4 rounded-3xl border text-right transition ${deliveryType === "delivery" ? "border-pro bg-blue-50" : "border-slate-200 bg-white"}`}
              >
                <p className="font-extrabold text-slate-900">توصيل لشركة شحن</p>
                <p className="text-xs text-slate-500 mt-1">يُحسب الشحن حسب المدينة والكمية</p>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("pickup")}
                className={`p-4 rounded-3xl border text-right transition ${isPickup ? "border-pro bg-blue-50" : "border-slate-200 bg-white"}`}
              >
                <p className="font-extrabold text-slate-900">استلام من الفرع</p>
                <p className="text-xs text-emerald-600 font-bold mt-1">بدون رسوم شحن</p>
              </button>
            </div>

            {isPickup ? (
              <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100 text-sm text-emerald-800 font-bold">
                هتستلم الطلب من فرع تالا الجزيرة — بدون رسوم شحن، وإجمالي الطلب = قيمة المنتجات فقط.
              </div>
            ) : shipping.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد خيارات شحن متاحة لهذا العنوان حاليًا.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shipping.map((s, i) => {
                  const active = shippingSel === s;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setShippingSel(s)}
                      className={`flex items-center justify-between p-4 rounded-3xl border transition-all text-right ${
                        active ? "border-pro bg-blue-50 shadow-sm" : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-1 overflow-hidden">
                          {s.logo ? (
                            <img src={s.logo} alt={s.deliveryOptionName || "شركة شحن"} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">OTO</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-slate-900">{s.deliveryOptionName || s.companyName || `شركة ${i + 1}`}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{s.avgDeliveryTime || "توصيل سريع"}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-pro">
                        {Number(s.price ?? s.deliveryFee ?? s.total ?? 0).toFixed(2)} <span className="text-[10px]">ريال</span>
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold mb-3">طريقة الدفع</h2>
            <BankPayment paymentMethods={methods} onPaymentMethodChange={(id: any) => setMethod(String(id))} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 h-fit sticky top-3">
          <h2 className="font-extrabold mb-3">ملخص الطلب</h2>
          <div className="flex justify-between text-sm py-1"><span>المنتجات</span><span>{itemsTotal.toFixed(2)}</span></div>
          {designFee > 0 && (
            <div className="flex justify-between text-sm py-1"><span>خدمة التصميم</span><span>{designFee.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between text-sm py-1"><span>الشحن</span><span>{shippingPrice.toFixed(2)}</span></div>
          <div className="mt-2 border-t pt-2 flex justify-between font-black"><span>الإجمالي</span><span>{total.toFixed(2)} ريال</span></div>
          <button onClick={submit} disabled={loading || (!isPickup && !shippingSel)} className="mt-4 w-full py-3 rounded-xl bg-pro text-white font-extrabold disabled:opacity-60">
            {loading ? "جارٍ إنشاء الطلب..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </section>
  );
}
