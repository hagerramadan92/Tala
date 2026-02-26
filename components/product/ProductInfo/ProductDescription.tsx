// components/product/ProductInfo/ProductDescription.tsx
import React from "react";
import { SectionCard } from "@/components/shared/UI/SectionCard";
import { Package } from "lucide-react";

interface ProductDescriptionProps {
  description: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  return (
    <SectionCard title="وصف المنتج" icon={<Package className="w-5 h-5 text-slate-700" />}>
      <div 
        className="prose prose-sm max-w-none text-slate-700" 
        dangerouslySetInnerHTML={{ __html: description || "" }} 
      />
    </SectionCard>
  );
}