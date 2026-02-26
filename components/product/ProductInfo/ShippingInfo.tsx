// components/product/ProductInfo/ShippingInfo.tsx
import React from "react";
import { SectionCard } from "@/components/shared/UI/SectionCard";
import { InfoRow } from "@/components/shared/UI/InfoRow";
import { Pill } from "@/components/shared/UI/Pill";
import { Truck, ShieldCheck, Tags } from "lucide-react";

interface ShippingInfoProps {
  deliveryTime?: {
    estimated?: string;
  };
  warrantyText?: string | null;
  offers?: any[];
}

export function ShippingInfo({ deliveryTime, warrantyText, offers }: ShippingInfoProps) {
  return (
    <SectionCard title="معلومات الشحن والضمان والعروض" icon={<Truck className="w-5 h-5 text-slate-700" />}>
      <div className="space-y-3">
        {deliveryTime?.estimated && (
          <InfoRow 
            label="التوصيل المتوقع" 
            value={<Pill tone="emerald">{deliveryTime.estimated}</Pill>} 
          />
        )}

        {warrantyText && (
          <InfoRow
            label="الضمان"
            value={
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-black">{warrantyText}</span>
              </span>
            }
          />
        )}

        {Array.isArray(offers) && offers.length > 0 && (
          <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
              <Tags className="w-4 h-4" /> العروض المتاحة
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {offers.map((o: any) => (
                <Pill key={o.id} tone="amber">
                  {o.name}
                </Pill>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}