// components/shared/Skeletons/ReviewsSkeleton.tsx
import React from "react";

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

export function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4">
        <Sk className="h-5 w-40" />
        <Sk className="h-3 w-72 mt-3" />
        <Sk className="h-3 w-56 mt-2" />
      </div>

      <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="md:rounded-2xl rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <Sk className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Sk className="h-4 w-40" />
                <Sk className="h-3 w-24 mt-2" />
              </div>
              <Sk className="h-6 w-14" />
            </div>
            <Sk className="h-3 w-full mt-4" />
            <Sk className="h-3 w-10/12 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}