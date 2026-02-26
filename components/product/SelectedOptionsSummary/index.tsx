// components/product/SelectedOptionsSummary/index.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OptChip } from "@/components/shared/UI/OptChip";
import { SelectedOptions } from "@/Types/product.types";

interface SelectedOptionsSummaryProps {
  selectedOptions: SelectedOptions;
  basePrice: number;
  extrasTotal: number;
  displayTotal: number;
  showMissingBadge: boolean;
}

export function SelectedOptionsSummary({
  selectedOptions,
  basePrice,
  extrasTotal,
  displayTotal,
  showMissingBadge,
}: SelectedOptionsSummaryProps) {
  const anySelected =
    selectedOptions.size !== "اختر" ||
    selectedOptions.color !== "اختر" ||
    selectedOptions.material !== "اختر" ||
    selectedOptions.printing_method !== "اختر" ||
    (selectedOptions.print_locations?.length ?? 0) > 0 ||
    Object.values(selectedOptions.optionGroups || {}).some((v) => v !== "اختر") ||
    Object.values(selectedOptions.optionChildren || {}).some((v) => v !== "اختر");

  if (!anySelected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900">الخيارات المختارة</h3>

          {showMissingBadge && (
            <span className="text-xs font-extrabold rounded-full bg-amber-50 text-amber-700 px-3 py-1 border border-amber-200">
              خيارات ناقصة
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectedOptions.size !== "اختر" && (
            <OptChip label="المقاس" value={selectedOptions.size} />
          )}
          
          {!!selectedOptions.size_quantity && (
            <OptChip label="كمية المقاس" value={`${selectedOptions.size_quantity}`} />
          )}
          
          {selectedOptions.color !== "اختر" && (
            <OptChip label="اللون" value={selectedOptions.color} />
          )}
          
          {selectedOptions.material !== "اختر" && (
            <OptChip label="الخامة" value={selectedOptions.material} />
          )}
          
          {selectedOptions.printing_method !== "اختر" && (
            <OptChip label="طريقة الطباعة" value={selectedOptions.printing_method} />
          )}
          
          {(selectedOptions.print_locations?.length ?? 0) > 0 && (
            <OptChip label="مكان الطباعة" value={selectedOptions.print_locations.join("، ")} />
          )}
          
          {Object.entries(selectedOptions.optionGroups || {}).map(
            ([k, v]) => v !== "اختر" && <OptChip key={k} label={k} value={v} />
          )}
          
          {Object.entries(selectedOptions.optionChildren || {}).map(([k, v]) => {
            if (v !== "اختر") {
              const [parentGroup] = k.split("::");
              return <OptChip key={k} label={`تفاصيل ${parentGroup}`} value={v} />;
            }
            return null;
          })}
        </div>

        {/* price breakdown */}
        <div className="mt-4 md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm font-extrabold text-slate-700">
            <span>السعر الأساسي (المقاس × الكمية)</span>
            <span>{basePrice.toFixed(2)} ر.س</span>
          </div>

          <div className="h-px bg-slate-200 my-3" />
          
          <div className="flex items-center justify-between text-base font-black text-slate-900">
            <span>الإجمالي</span>
            <span>{displayTotal.toFixed(2)} ر.س</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}