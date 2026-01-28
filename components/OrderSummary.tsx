"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/src/context/CartContext";
import TotalOrder from "@/components/TotalOrder";

type AnyObj = Record<string, any>;
type SelectedOpt = { option_name: string; option_value: string };

const n = (v: any) => {
  const x =
    typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};

const money = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseSelectedOptions = (raw: any): SelectedOpt[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as SelectedOpt[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SelectedOpt[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

function computePricing(item: AnyObj) {
  const p = item?.product || {};
  const qty = Math.max(1, n(item?.quantity || 1));

  const apiUnit = n(item?.price_per_unit);
  const apiLine = n(item?.line_total);

  const base = p?.has_discount ? n(p?.final_price) : n(p?.price);

  // size tiers
  let sizeTierUnit: number | null = null;
  const sizes = Array.isArray(p?.sizes) ? p.sizes : [];
  const selected = parseSelectedOptions(item?.selected_options).find((o) =>
    String(o.option_name || "").includes("المقاس")
  )?.option_value;

  if (sizes.length && selected) {
    const sizeObj = sizes.find((s: any) => String(s.name).trim() === String(selected).trim());
    if (sizeObj?.tiers?.length) {
      const tiers = [...sizeObj.tiers]
        .map((t: any) => ({ q: n(t.quantity), unit: n(t.price_per_unit) }))
        .filter((t: any) => t.q > 0 && t.unit > 0)
        .sort((a: any, b: any) => a.q - b.q);

      const best = tiers.filter((t: any) => t.q <= qty).at(-1);
      if (best?.unit) sizeTierUnit = best.unit;
    }
  }

  const selectedOptions = parseSelectedOptions(item?.selected_options);

  // product.options additional_price
  const productOptions = Array.isArray(p?.options) ? p.options : [];
  let extra = 0;

  for (const sel of selectedOptions) {
    const name = String(sel.option_name || "").trim();
    const value = String(sel.option_value || "").trim();

    const match = productOptions.find(
      (x: any) =>
        String(x.option_name).trim() === name &&
        String(x.option_value).trim() === value
    );
    if (match) extra += n(match.additional_price);

    if (name === "اللون") {
      const colors = Array.isArray(p?.colors) ? p.colors : [];
      const c = colors.find((x: any) => String(x.name).trim() === value);
      if (c) extra += n(c.additional_price);
    }

    if (name === "الخامة") {
      const mats = Array.isArray(p?.materials) ? p.materials : [];
      const m = mats.find((x: any) => String(x.name).trim() === value);
      if (m) extra += n(m.additional_price);
    }

    if (name === "طريقة الطباعة") {
      const pms = Array.isArray(p?.printing_methods) ? p.printing_methods : [];
      const pm = pms.find((x: any) => String(x.name).trim() === value);
      if (pm) extra += n(pm.pivot_price ?? pm.base_price);
    }

    if (name === "مكان الطباعة") {
      const locs = Array.isArray(p?.print_locations) ? p.print_locations : [];
      const loc = locs.find((x: any) => String(x.name).trim() === value);
      if (loc) extra += n(loc.pivot_price ?? loc.additional_price);
    }
  }

  const computedUnit = (sizeTierUnit ?? base) + extra;
  const computedLine = computedUnit * qty;

  const unit = apiUnit > 0 ? apiUnit : computedUnit;
  const line = apiLine > 0 ? apiLine : computedLine;

  return { unit, line, computedUnit, qty, selectedOptions };
}

export default function CheckoutSummary() {
  const [open, setOpen] = useState(false);
  const { cart, cartCount } = useCart();

  const computed = useMemo(() => {
    const items = (Array.isArray(cart) ? cart : []).map((it: AnyObj) => {
      const pr = computePricing(it);
      return { ...it, _unit: pr.unit, _line: pr.line, _qty: pr.qty, _opts: pr.selectedOptions };
    });

    const subtotal = items.reduce((acc: number, it: any) => acc + n(it._line), 0);
    const total = subtotal; // لو عندك رسوم/خصم هنا ضيفها

    return { items, subtotal, total };
  }, [cart]);

  return (
    <div className="w-full">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-3"
      >
        <h4 className="text-pro font-extrabold text-xl">ملخص الطلب</h4>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">
            {open ? "إخفاء التفاصيل" : "إظهار التفاصيل"}
          </span>
          <MdOutlineKeyboardArrowDown
            size={22}
            className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Details */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden space-y-3"
          >
            {computed.items.map((item: AnyObj) => {
              const product = item?.product || {};
              const imageSrc = product?.image || "/images/not.jpg";
              const name = product?.name || "منتج";

              return (
                <div
                  key={item.cart_item_id}
                  className="flex gap-3 p-4 rounded-3xl border border-slate-200 bg-white"
                >
                  <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <Image src={imageSrc} alt={name} fill sizes="64px" className="object-cover" />
                  </div>

                  <div className="flex-1 text-sm">
                    <p className="font-extrabold text-slate-900">{name}</p>
                    <p className="text-slate-500 font-semibold">الكمية: {item._qty}</p>

                    <p className="font-extrabold text-slate-900 mt-1">
                      {money(n(item._line))} <span className="text-xs text-slate-600">ر.س</span>
                    </p>

                    {Array.isArray(item._opts) && item._opts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item._opts.slice(0, 6).map((o: AnyObj, i: number) => (
                          <span
                            key={`${o.option_name}-${o.option_value}-${i}`}
                            className="text-xs font-bold px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700"
                          >
                            {o.option_name}: {o.option_value}
                          </span>
                        ))}
                        {item._opts.length > 6 && (
                          <span className="text-xs font-extrabold text-slate-500">
                            +{item._opts.length - 6} المزيد
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 font-semibold mt-2">
                      سعر القطعة: {money(n(item._unit))} ر.س
                    </p>
                  </div>
                </div>
              );
            })}

            {computed.items.length === 0 && (
              <div className="p-4 rounded-3xl border border-slate-200 bg-white text-center">
                <p className="text-slate-600 font-extrabold">لا توجد عناصر في السلة</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Totals always visible under summary */}
      <div className="mt-4">
        <TotalOrder
          response={{
            status: true,
            data: {
              items_count: cartCount,
              subtotal: String(computed.subtotal),
              total: String(computed.total),
              items: computed.items,
            },
          }}
        />
      </div>
    </div>
  );
}
