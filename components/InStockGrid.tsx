"use client";

import React from "react";
import { ProductI } from "@/Types/ProductsI";
import { ProductCardSkeleton } from "@/components/skeletons/HomeSkeletons";

interface InStockGridProps {
  inStock: ProductI[];
  CardComponent: any;
  title?: string;
  isLoading?: boolean;
  skeletonCount?: number;
}

export default function InStockGrid({
  inStock,
  CardComponent,
  title = "",
  isLoading = false,
  skeletonCount = 6,
}: InStockGridProps) {
  const list = Array.isArray(inStock) ? inStock : [];

  return (
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-extrabold text-gray-900">
            {title}
          </h2>
        </div>
      )}

      {/* ✅ MOBILE: horizontal swipe | DESKTOP: grid */}
      <div
        className="
          flex gap-4 overflow-x-auto snap-x snap-mandatory
          md:grid md:overflow-visible md:snap-none
          md:grid-cols-2 lg:grid-cols-4
          scrollbar-hide
        "
      >
        {isLoading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="min-w-[48%] snap-start md:min-w-0"
              >
                <ProductCardSkeleton />
              </div>
            ))
          : list.map((product) => (
              <div
                key={product.id}
                className="
                  min-w-[48%] snap-start
                  md:min-w-0
                "
              >
                {typeof CardComponent === "function" ? (
                  <CardComponent {...product} />
                ) : (
                  <CardComponent {...product} />
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
