// components/product/Reviews/ReviewForm.tsx
import React from "react";
import { StarRatingInput } from "@/components/shared/UI/StarRatingInput";

interface ReviewFormProps {
  token: string | null;
  myRating: number;
  setMyRating: (rating: number) => void;
  myComment: string;
  setMyComment: (comment: string) => void;
  onSubmit: () => void;
}

export function ReviewForm({ 
  token, 
  myRating, 
  setMyRating, 
  myComment, 
  setMyComment, 
  onSubmit 
}: ReviewFormProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-extrabold text-slate-900">اكتب تقييمك</p>
        {!token && (
          <span className="text-xs font-extrabold rounded-full bg-slate-50 text-slate-600 px-3 py-1 border border-slate-200">
            سجّل الدخول لإضافة تقييم
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <StarRatingInput value={myRating} onChange={setMyRating} disabled={!token} />
        </div>

        <div className="flex items-start gap-4">
          <textarea
            disabled={!token}
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            rows={4}
            className="w-full md:rounded-2xl rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
            placeholder="اكتب رأيك في المنتج بكل صراحة..."
          />
        </div>
      </div>

      <button
        disabled={!token}
        onClick={onSubmit}
        className="mt-5 w-full md:w-auto md:rounded-2xl rounded-lg bg-[#14213d] text-white px-8 py-3 font-extrabold hover:opacity-95 transition disabled:opacity-50"
      >
        إرسال التقييم
      </button>
    </div>
  );
}