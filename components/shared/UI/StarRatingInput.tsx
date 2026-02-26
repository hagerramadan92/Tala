// components/shared/UI/StarRatingInput.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarRatingInputProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

const ratingLabels: Record<number, string> = {
  1: "سيئ جدًا",
  2: "سيئ",
  3: "متوسط",
  4: "جيد جدًا",
  5: "ممتاز",
};

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeValue = hovered ?? value;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeValue;

          return (
            <motion.button
              key={star}
              type="button"
              whileHover={!disabled ? { scale: 1.15 } : undefined}
              whileTap={!disabled ? { scale: 0.95 } : undefined}
              onMouseEnter={() => !disabled && setHovered(star)}
              onMouseLeave={() => !disabled && setHovered(null)}
              onClick={() => !disabled && onChange(star)}
              className="focus:outline-none"
              aria-label={`تقييم ${star} نجوم`}
            >
              <Star 
                className={`w-10 h-10 transition-colors ${filled ? "text-amber-400" : "text-slate-300"}`} 
                fill={filled ? "currentColor" : "none"} 
              />
            </motion.button>
          );
        })}
      </div>

      <motion.div 
        key={activeValue} 
        initial={{ opacity: 0, y: 6 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-sm font-extrabold text-slate-700"
      >
        {ratingLabels[activeValue] ?? ""}
      </motion.div>
    </div>
  );
}