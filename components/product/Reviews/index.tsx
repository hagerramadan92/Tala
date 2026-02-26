// components/product/Reviews/index.tsx
import React from "react";
import { ReviewSummary } from "./ReviewSummary";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";
import { ReviewPagination } from "./ReviewPagination";

interface ReviewsProps {
  reviewsData: any;
  loading: boolean;
  error: string | null;
  token: string | null;
  currentUserId: number | null;
  myRating: number;
  setMyRating: (rating: number) => void;
  myComment: string;
  setMyComment: (comment: string) => void;
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  onSubmitReview: () => void;
  onDeleteReview: (id: number) => void;
  onRetry: () => void;
}

export function Reviews({
  reviewsData,
  loading,
  error,
  token,
  currentUserId,
  myRating,
  setMyRating,
  myComment,
  setMyComment,
  currentPage,
  lastPage,
  onPageChange,
  onSubmitReview,
  onDeleteReview,
  onRetry,
}: ReviewsProps) {
  if (loading) {
    return <div className="space-y-4">{/* We'll import ReviewsSkeleton here */}</div>;
  }

  if (error) {
    return (
      <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-white p-5">
        <p className="font-extrabold text-slate-900">تعذر تحميل التقييمات</p>
        <p className="text-sm text-slate-600 mt-1">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl border border-slate-200 px-4 py-2 font-extrabold hover:bg-slate-50 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const canDeleteReview = (review: any) => {
    if (reviewsData?.user_review && review.id === reviewsData.user_review.id) return true;
    if (currentUserId && review.user_id === currentUserId) return true;
    return false;
  };

  return (
    <div className="space-y-5">
      <ReviewSummary
        averageRating={reviewsData?.stats?.average_rating ?? 0}
        totalReviews={reviewsData?.stats?.total_reviews ?? 0}
      />

      <ReviewForm
        token={token}
        myRating={myRating}
        setMyRating={setMyRating}
        myComment={myComment}
        setMyComment={setMyComment}
        onSubmit={onSubmitReview}
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="font-extrabold text-slate-900 mb-4">آراء العملاء</p>
        
        <ReviewList
          reviews={reviewsData?.reviews || []}
          canDeleteReview={canDeleteReview}
          onDeleteReview={onDeleteReview}
        />

        <ReviewPagination
          currentPage={currentPage}
          lastPage={lastPage}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}