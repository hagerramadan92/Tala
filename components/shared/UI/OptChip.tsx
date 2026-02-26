// components/shared/UI/OptChip.tsx
import React from "react";

interface OptChipProps {
  label: string;
  value: string;
}

export function OptChip({ label, value }: OptChipProps) {
  return (
    <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500 font-bold">{label}</p>
      <p className="text-sm font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}