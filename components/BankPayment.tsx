"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Swal from "sweetalert2";

type PaymentMethod = {
  id: number;
  key?: string;
  name: string;
  icon?: string;
  image?: string;      // This contains the actual image URL
  is_active?: boolean;
};

export default function BankPayment({
  paymentMethods = [],
  onPaymentMethodChange,
}: {
  paymentMethods: any;
  onPaymentMethodChange?: any;
}) {
  const [open] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [applePaySupported, setApplePaySupported] = useState(false);

  // Apple Pay بيشتغل بس على Safari في أجهزة Apple اللي فيها كارت بالمحفظة.
  useEffect(() => {
    // وجود ApplePaySession معناه إن المتصفح Safari على جهاز Apple.
    // مش بنشترط canMakePayments() لأنها بترجع false لو مفيش كارت
    // متسجّل في المحفظة، مع إن العميل ممكن يضيف كارت وقت الدفع.
    const supported = typeof (window as any).ApplePaySession !== "undefined";
    setApplePaySupported(Boolean(supported));
  }, []);

  // بنعرض Apple Pay دايمًا، لكن بنعطّله لو الجهاز/المتصفح مش بيدعمه.
  const methods = useMemo(() => {
    return (paymentMethods || [])
      .filter((m: PaymentMethod) => m?.is_active !== false)
      .map((m: PaymentMethod) => ({
        ...m,
      }));
  }, [paymentMethods]);

  const isApplePayBlocked = (key?: string) =>
    key === "applepay" && !applePaySupported;

  const selected = methods.find((m: PaymentMethod) => m.id === selectedId) || null;

  useEffect(() => {
    if (selected?.id && onPaymentMethodChange) onPaymentMethodChange(selected.id);
  }, [selected?.id, onPaymentMethodChange]);

  return (
    <div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 pt-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {methods.map((m: PaymentMethod) => {
                const active = selectedId === m.id;
                const blocked = isApplePayBlocked(m.key);

                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-4 rounded-3xl border transition ${
                      active
                        ? "border-pro-max bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    } ${blocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={active}
                      onChange={() => {
                        if (blocked) {
                          Swal.fire({
                            icon: "info",
                            title: "Apple Pay",
                            text: "Apple Pay متاح على أجهزة Apple فقط (iPhone / iPad / Mac) من متصفح Safari مع وجود كارت في المحفظة.",
                            confirmButtonText: "تمام",
                            confirmButtonColor: "#14213d",
                          });
                          return;
                        }
                        setSelectedId(m.id);
                      }}
                      className={`w-5 h-5 accent-[#14213d] ${blocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                    />

                    {/* Image container - using img tag for simplicity */}
                    <div className="w-12 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src={m.image} 
                        alt={m.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                          // You could add a fallback icon here if needed
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <p className="font-extrabold text-slate-900">{m.name}</p>
                      <p className="text-sm text-slate-600 font-semibold">
                        {m.key === "applepay"
                          ? blocked
                            ? "متاح على Safari في أجهزة Apple"
                            : "ادفع بلمسة واحدة من محفظة Apple"
                          : "اختر طريقة الدفع المناسبة"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}