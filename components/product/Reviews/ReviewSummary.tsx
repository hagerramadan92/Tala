// components/product/Reviews/ReviewSummary.tsx
import React from "react";
import { StarsRow } from "@/components/shared/UI/StarsRow";

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
}

export function ReviewSummary({ averageRating, totalReviews }: ReviewSummaryProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">متوسط التقييم</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-3xl font-black text-slate-900">
              {averageRating.toFixed(1)}
            </p>
            <StarsRow value={Math.round(averageRating)} />
          </div>
          <p className="text-sm text-slate-500 mt-1">{totalReviews} تقييم</p>
        </div>
      </div>
    </div>
  );
}