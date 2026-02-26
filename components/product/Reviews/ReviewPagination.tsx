// components/product/Reviews/ReviewPagination.tsx
import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPages } from "@/utils/productHelpers";

interface ReviewPaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export function ReviewPagination({ currentPage, lastPage, onPageChange }: ReviewPaginationProps) {
  if (lastPage <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center">
      <div className="flex items-center gap-2 md:rounded-2xl rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
          aria-label="السابق"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-1">
          {getPages(currentPage, lastPage).map((p, idx) =>
            p === "…" ? (
              <span key={`dots-${idx}`} className="px-2 text-slate-400 font-extrabold">
                …
              </span>
            ) : (
              <motion.button
                key={p}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPageChange(p)}
                className={[
                  "min-w-[38px] h-[38px] rounded-xl px-2 text-sm font-black transition",
                  p === currentPage ? "bg-[#14213d] text-white shadow" : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                aria-current={p === currentPage ? "page" : undefined}
                aria-label={`الصفحة ${p}`}
              >
                {p}
              </motion.button>
            )
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <button
          onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
          disabled={currentPage >= lastPage}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
          aria-label="التالي"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}