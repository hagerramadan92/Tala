// components/product/ProductInfo/ProductSpecs.tsx
import React from "react";
import { SectionCard } from "@/components/shared/UI/SectionCard";
import { InfoRow } from "@/components/shared/UI/InfoRow";
import { Star } from "lucide-react";

interface ProductSpecsProps {
  features?: any[];
}

export function ProductSpecs({ features }: ProductSpecsProps) {
  if (!features?.length) return null;

  return (
    <SectionCard title="المواصفات" icon={<Star className="w-5 h-5 text-slate-700" />}>
      <div className="space-y-2">
        {features.map((f: any, idx: number) => (
          <InfoRow
            key={`${f?.name}-${idx}`}
            label={String(f?.name || "—")}
            value={<span className="font-black">{String(f?.value || "—")}</span>}
          />
        ))}
      </div>
    </SectionCard>
  );
}