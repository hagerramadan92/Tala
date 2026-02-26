// components/shared/UI/InfoRow.tsx
import React from "react";

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-extrabold text-slate-700">{label}</p>
      <div className="text-sm font-black text-slate-900 text-left">{value}</div>
    </div>
  );
}