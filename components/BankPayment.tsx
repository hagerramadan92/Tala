"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCcVisa, 
  FaCcMastercard, 
  FaMobileAlt, 
  FaWallet, 
  FaCreditCard,
  FaQuestionCircle
} from "react-icons/fa";

type PaymentMethod = {
  id: number;
  name: string;
  icon?: string;       // e.g. "fab fa-cc-visa" or "FaCcVisa"
  is_active?: boolean;
};

// Mapping from FontAwesome class names to React Icons components
const iconMap: Record<string, React.ComponentType<any>> = {
  // Brand icons
  "fab fa-cc-visa": FaCcVisa,
  "fab fa-cc-mastercard": FaCcMastercard,
  "fab fa-cc-amex": FaCcVisa, // Example fallback
  "fab fa-cc-discover": FaCcMastercard, // Example fallback
  
  // Solid icons
  "fas fa-mobile-alt": FaMobileAlt,
  "fas fa-wallet": FaWallet,
  "fas fa-credit-card": FaCreditCard,
  "fas fa-university": FaWallet, // Example for bank
  "fas fa-money-bill-wave": FaWallet, // Example
};

// Helper function to get icon component
const getIconComponent = (iconName: string): React.ComponentType<any> => {
  // Direct mapping
  if (iconMap[iconName]) {
    return iconMap[iconName];
  }
  
  // Try to extract icon name from class pattern
  const iconKey = Object.keys(iconMap).find(key => 
    key.includes(iconName.toLowerCase().replace(/\s+/g, '-'))
  );
  
  return iconKey ? iconMap[iconKey] : FaQuestionCircle;
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

  const methods = useMemo(() => {
    return (paymentMethods || [])
      .filter((m: PaymentMethod) => m?.is_active !== false)
      .map((m: PaymentMethod) => ({
        ...m,
        // fallback icon if missing
        icon: m.icon || "fas fa-credit-card",
      }));
  }, [paymentMethods]);

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
                const IconComponent = getIconComponent(m.icon || "fas fa-credit-card");

                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-4 rounded-3xl border cursor-pointer transition ${
                      active
                        ? "border-pro-max bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={active}
                      onChange={() => setSelectedId(m.id)}
                      className="w-5 h-5 accent-[#14213d] cursor-pointer"
                    />

                    {/* icon box */}
                    <div className="w-12 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                      <IconComponent className="text-xl text-slate-800" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <p className="font-extrabold text-slate-900">{m.name}</p>
                      <p className="text-sm text-slate-600 font-semibold">
                        اختر طريقة الدفع المناسبة
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