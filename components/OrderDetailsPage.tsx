"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Loading from "@/app/loading";
import OrderProgress from "./OrderProgress";

import { GoChecklist } from "react-icons/go";
import { IoWalletOutline } from "react-icons/io5";
import { SlLocationPin } from "react-icons/sl";

import { FiAlertTriangle } from "react-icons/fi";
import { CheckCircle2, Clock3, Truck, Ban, User2, Mail } from "lucide-react";

import { ProductI } from "@/Types/ProductsI";

interface Props {
  orderId: string;
}

/** API TYPES (based on your response) */
type OrderStatus = "pending" | "processing" | "delivering" | "completed" | "cancelled" | string;
type PaymentStatus = "pending" | "paid" | "failed" | string;

type ApiUser = {
  id: number;
  name: string;
  email: string;
  image: string | null;
  created_at: string;
};

type ApiFullAddress = {
  id: number;
  full_name: string | null;
  phone: string | null;
  label: string | null;
  building: string | null;
  floor: string | null;
  apartment_number: string | null;
  details: string | null;
  city: string | null;
  area: string | null;
  type: "home" | "work" | string;
};

type ParsedOption =
  | { option_name?: string; option_value?: string }
  | { name?: string; value?: string }
  | string;

interface OrderItem {
  product_name: string;
  quantity: number;
  price: string; // "0.0000"
  options: string | ParsedOption[]; // API returns string JSON like "[]"
  product: ProductI;
}

interface OrderData {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_label: string; // e.g. "order.status.pending"
  total_amount: string; // "0.00"
  formatted_total: string; // "0.00 ر.س"
  customer_name: string;
  customer_phone: string | null;
  shipping_address: string | null;
  notes: string | null;

  status_payment: PaymentStatus;
  user: ApiUser | null;

  created_at: string;
  payment_method_label: string;

  full_address: ApiFullAddress | null;

  items: OrderItem[];
}

function safeJsonParseOptions(raw: any): ParsedOption[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw.trim() ? [raw.trim()] : [];
    }
  }

  return [];
}

function toNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function calcItemSubtotal(price: any, qty: any) {
  const p = toNumber(price);
  const q = toNumber(qty);
  if (p === null || q === null) return null;
  return p * q;
}

function statusUi(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "تم استلام الطلب",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
        icon: <Clock3 className="w-4 h-4" />,
      };
    case "processing":
      return {
        label: "جاري التنفيذ",
        badge: "bg-blue-50 text-blue-800 border-blue-200",
        icon: <Clock3 className="w-4 h-4" />,
      };
    case "delivering":
      return {
        label: "جاري التوصيل",
        badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
        icon: <Truck className="w-4 h-4" />,
      };
    case "completed":
      return {
        label: "تم التوصيل",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: <CheckCircle2 className="w-4 h-4" />,
      };
    case "cancelled":
      return {
        label: "ملغي",
        badge: "bg-rose-50 text-rose-800 border-rose-200",
        icon: <Ban className="w-4 h-4" />,
      };
    default:
      return {
        label: status,
        badge: "bg-slate-50 text-slate-800 border-slate-200",
        icon: <Clock3 className="w-4 h-4" />,
      };
  }
}

function paymentUi(status_payment: string) {
  switch (status_payment) {
    case "paid":
      return { label: "تم الدفع", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    case "pending":
      return { label: "في انتظار الدفع", cls: "bg-amber-50 text-amber-800 border-amber-200" };
    case "failed":
      return { label: "فشل الدفع", cls: "bg-rose-50 text-rose-800 border-rose-200" };
    default:
      return { label: status_payment, cls: "bg-slate-50 text-slate-800 border-slate-200" };
  }
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-extrabold text-slate-700">
      {children}
    </span>
  );
}

function buildFullAddress(a: ApiFullAddress | null, fallback: string | null) {
  if (!a) return fallback;

  const parts = [
    a.city && `المدينة: ${a.city}`,
    a.area && `المنطقة: ${a.area}`,
    a.label && `الوصف: ${a.label}`,
    a.building && `المبنى: ${a.building}`,
    a.floor && `الدور: ${a.floor}`,
    a.apartment_number && `شقة: ${a.apartment_number}`,
    a.details && `تفاصيل: ${a.details}`,
  ].filter(Boolean);

  return parts.length ? parts.join(" • ") : fallback;
}

export default function OrderDetailsPage({ orderId }: Props) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiToken, setApiToken] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(0);

  const steps = ["تم الطلب", "جاري التنفيذ", "جاري التوصيل", "تم التوصيل"];
  const statusSteps: Record<string, number> = {
    pending: 0,
    processing: 1,
    delivering: 2,
    completed: 3,
    cancelled: 0,
  };

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiToken(localStorage.getItem("auth_token"));
    }
  }, []);

  useEffect(() => {
    if (!apiToken || !baseUrl) return;

    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${baseUrl}/order/${orderId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          cache: "no-store",
        });

        const json = await res.json();

        if (json?.status && json?.data) {
          const orderData: OrderData = json.data;

          // progress step
          setCurrentStep(statusSteps[orderData.status] ?? 0);

          // parse options (string -> array)
          orderData.items = (orderData.items || []).map((item: any) => ({
            ...item,
            options: safeJsonParseOptions(item.options),
          }));

          setOrder(orderData);
        } else {
          setOrder(null);
        }
      } catch (e) {
        console.error("Error fetching order details:", e);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [apiToken, orderId, baseUrl]);

  const status = useMemo(() => statusUi(order?.status || ""), [order?.status]);
  const pay = useMemo(() => paymentUi(order?.status_payment || ""), [order?.status_payment]);

  if (loading) return <Loading />;

  if (!order) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
              <FiAlertTriangle className="text-rose-600" size={22} />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">لم يتم العثور على الطلب</p>
              <p className="text-sm text-slate-600 mt-1">تأكد من رقم الطلب أو حاول مرة أخرى.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addressText = buildFullAddress(order.full_address, order.shipping_address);

  return (
    <div className="mb-16 w-full" dir="rtl">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-slate-900 text-2xl font-extrabold">تفاصيل الطلب</h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip>
                رقم الطلب: <span className="ms-1 text-slate-900">{order.order_number}</span>
              </Chip>

              <Chip>
                تاريخ الطلب: <span className="ms-1 text-slate-900">{order.created_at}</span>
              </Chip>

              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-extrabold ${status.badge}`}>
                {status.icon}
                {order.status_label && order.status_label !== "order.status.pending"
                  ? order.status_label
                  : status.label}
              </span>

              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-extrabold ${pay.cls}`}>
                {pay.label}
              </span>
            </div>
          </div>
 
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-slate-700 font-extrabold text-sm">ملاحظة:</p>
            <p className="text-slate-700 font-bold mt-1">{order.notes}</p>
          </div>
        )}

        {/* Cancel banner */}
        {order.status === "cancelled" && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="font-extrabold text-rose-800">تم إلغاء هذا الطلب</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items + progress */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-900 font-extrabold text-lg">محتويات الطلب</p>
              <Chip>{order.items?.length ?? 0} منتج</Chip>
            </div>

            <div className="mt-4 space-y-3">
              {order.items.map((item, index) => {
                const subtotal = calcItemSubtotal(item.price, item.quantity);
                const opts: ParsedOption[] = Array.isArray(item.options) ? item.options : [];

                // best image
                const img =
                  item?.product?.image ||
                  (item?.product as any)?.images?.find?.((x: any) => x?.path)?.path ||
                  "/images/not.jpg";

                return (
                  <div key={index} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex gap-4">
                      <div className="relative w-[92px] h-[92px] rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
                        <Image src={img} alt={item.product_name} fill className="object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-extrabold line-clamp-2">{item.product_name}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          <Chip>
                            الكمية: <span className="ms-1 text-slate-900">{item.quantity}</span>
                          </Chip>
                          <Chip>
                            سعر الوحدة: <span className="ms-1 text-slate-900">{item.price}</span>
                          </Chip>
                          {subtotal !== null && (
                            <Chip>
                              الإجمالي: <span className="ms-1 text-slate-900">{subtotal.toFixed(2)}</span>
                            </Chip>
                          )}
                        </div>

                        {/* Options */}
                        {opts.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-extrabold text-slate-500 mb-2">الخيارات:</p>
                            <div className="flex flex-wrap gap-2">
                              {opts.map((o, i) => {
                                if (typeof o === "string") return <Chip key={i}>{o}</Chip>;

                                const name = (o as any).option_name ?? (o as any).name ?? "";
                                const value = (o as any).option_value ?? (o as any).value ?? "";
                                const label = [name, value].filter(Boolean).join(": ");
                                return <Chip key={i}>{label || "—"}</Chip>;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Address line */}
            {addressText && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-2">
                <SlLocationPin className="text-slate-700" />
                <p className="text-slate-700 font-extrabold text-sm">
                  عنوان التوصيل: <span className="mx-1 text-slate-900">{addressText}</span>
                </p>
              </div>
            )}
          </div>

          {/* Progress Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-slate-900 font-extrabold text-lg mb-4">تتبع الطلب</p>

            {order.status === "cancelled" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="font-extrabold text-rose-800">لا يمكن متابعة التقدم لأن الطلب ملغي.</p>
              </div>
            ) : (
              <OrderProgress steps={steps} currentStep={currentStep} />
            )}
          </div>
        </div>

        {/* Summary column */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center">
                <GoChecklist className="w-6 h-6" />
              </div>
              <p className="text-slate-900 font-extrabold text-lg">ملخص الطلب</p>
            </div>

            <div className="mt-4 space-y-3 text-slate-700 font-extrabold">
              <div className="flex items-center justify-between">
                <p className="text-slate-500">المجموع</p>
                <p className="text-slate-900">{order.total_amount}</p>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="flex items-center justify-between">
                <p className="text-slate-500">الإجمالي النهائي</p>
                {/* formatted_total already has currency */}
                <p className="text-slate-900 text-lg">{order.formatted_total}</p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center">
                <IoWalletOutline className="w-6 h-6" />
              </div>

              <div className="min-w-0">
                <p className="text-slate-900 font-extrabold">طريقة الدفع</p>
                <p className="text-slate-600 font-bold mt-1">{order.payment_method_label}</p>

                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-extrabold ${pay.cls}`}>
                    {pay.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full address card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center">
                <SlLocationPin className="w-6 h-6" />
              </div>

              <div className="min-w-0">
                <p className="text-slate-900 font-extrabold">عنوان الشحن</p>

                {order.full_address ? (
                  <div className="mt-2 space-y-1 text-sm font-bold text-slate-700">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">الاسم</span>
                      <span className="text-slate-900">{order.full_address.full_name || "—"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">الهاتف</span>
                      <span className="text-slate-900">{order.full_address.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">النوع</span>
                      <span className="text-slate-900">{order.full_address.type || "—"}</span>
                    </div>

                    <div className="h-px bg-slate-200 my-2" />

                    <p className="text-slate-600 font-bold leading-relaxed">
                      {buildFullAddress(order.full_address, order.shipping_address) || "لا يوجد عنوان"}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-600 font-bold mt-2">
                    {order.shipping_address || "لا يوجد عنوان"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User (mobile) */}
          {order.user && (
            <div className="sm:hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-slate-900 font-extrabold mb-3">بيانات المستخدم</p>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <Image src={order.user.image || "/images/not.jpg"} alt={order.user.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900">{order.user.name}</p>
                  <p className="text-sm font-bold text-slate-600">{order.user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
