// components/shared/Skeletons/ProductPageSkeleton.tsx
import React from "react";

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

export function ProductPageSkeleton() {
  return (
    <div className="container pt-8 pb-24" dir="rtl">
      <Sk className="h-6 w-64 mb-4" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="space-y-5 lg:col-span-5">
          <Sk className="h-10 w-3/4" />
          <div className="flex items-center gap-4">
            <Sk className="h-10 w-20" />
            <Sk className="h-10 w-20" />
          </div>
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-5">
              <Sk className="h-6 w-40 mb-4" />
              <Sk className="h-20 w-full" />
            </div>
          ))}
        </div>
        
        <div className="lg:col-span-7">
          <Sk className="h-[400px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}