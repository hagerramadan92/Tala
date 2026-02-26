// components/shared/UI/Pill.tsx
import React from "react";

interface PillProps {
  children: React.ReactNode;
  tone?: "slate" | "amber" | "emerald";
}

export function Pill({ children, tone = "slate" }: PillProps) {
  const map = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`text-[11px] font-extrabold px-2 py-1 rounded-full border ${map[tone]}`}>
      {children}
    </span>
  );
}