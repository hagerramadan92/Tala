// components/product/ProductInfo/ProductHeader.tsx
import React from "react";
import HearComponent from "@/components/HearComponent";
import ShareButton from "@/components/ShareButton";
import RatingStars from "@/components/RatingStars";
import { motion } from "framer-motion";

interface ProductHeaderProps {
  name: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  averageRating: number;
  reviews: any[];
}

export function ProductHeader({ 
  name, 
  isFavorite, 
  onToggleFavorite, 
  averageRating, 
  reviews 
}: ProductHeaderProps) {
  return (
    <>
      <h1 className="text-slate-900 text-2xl md:text-3xl font-extrabold leading-snug">
        {name}
      </h1>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HearComponent
            liked={isFavorite}
            onToggleLike={onToggleFavorite}
            ClassName="text-slate-500"
            ClassNameP="border border-slate-200 hover:border-slate-300"
          />
          <ShareButton />
        </div>

        <div className="flex items-center gap-2">
          <RatingStars average_ratingc={averageRating} reviewsc={reviews} />
        </div>
      </div>
    </>
  );
}