// components/shared/UI/SectionCard.tsx
import React from "react";

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}