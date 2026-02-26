// components/shared/Skeletons/StickerFormSkeleton.tsx
import React from "react";

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

export function StickerFormSkeleton() {
  return (
    <div className="pt-4 mt-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Sk key={i} className="h-14 w-full" />
      ))}
      <Sk className="h-24 w-full mt-4" />
    </div>
  );
}