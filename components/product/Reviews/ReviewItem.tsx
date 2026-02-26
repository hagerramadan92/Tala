// components/product/Reviews/ReviewItem.tsx
import React from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { StarsRow } from "@/components/shared/UI/StarsRow";

interface ReviewItemProps {
  review: any;
  canDelete: boolean;
  onDelete: (id: number) => void;
}

export function ReviewItem({ review, canDelete, onDelete }: ReviewItemProps) {
  return (
    <div className="md:rounded-2xl rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
            {review.user?.avatar ? (
              <Image src={review.user.avatar} alt={review.user.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-black">
                {review.user?.name?.[0] ?? "U"}
              </div>
            )}
          </div>
          <div>
            <p className="font-extrabold text-slate-900">{review.user?.name ?? "مستخدم"}</p>
            <p className="text-xs text-slate-500 font-bold">{review.human_created_at || review.created_at}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StarsRow value={review.rating} />
          {canDelete && (
            <button
              onClick={() => onDelete(review.id)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 hover:bg-rose-50 transition"
              aria-label="حذف التقييم"
              title="حذف التقييم"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
            </button>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="mt-3 text-slate-700 font-semibold leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}