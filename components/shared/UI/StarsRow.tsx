// components/shared/UI/StarsRow.tsx
import React from "react";
import { Star } from "lucide-react";

interface StarsRowProps {
  value: number;
}

export function StarsRow({ value }: StarsRowProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <Star
            key={i}
            className={`w-4 h-4 ${filled ? "text-amber-500" : "text-slate-300"}`}
            fill={filled ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}