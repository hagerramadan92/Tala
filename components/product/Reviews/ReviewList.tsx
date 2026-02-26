// components/product/Reviews/ReviewList.tsx
import React from "react";
import { ReviewItem } from "./ReviewItem";

interface ReviewListProps {
  reviews: any[];
  canDeleteReview: (review: any) => boolean;
  onDeleteReview: (id: number) => void;
}

export function ReviewList({ reviews, canDeleteReview, onDeleteReview }: ReviewListProps) {
  if (!reviews?.length) {
    return (
      <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-5 text-center text-slate-600 font-bold">
        لا توجد تقييمات حتى الآن.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          canDelete={canDeleteReview(review)}
          onDelete={onDeleteReview}
        />
      ))}
    </div>
  );
}