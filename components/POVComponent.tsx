"use client";

import { ProductI } from "@/Types/ProductsI";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { useState } from "react";

export default function POVComponent({ product }: { product: ProductI }) {
  const reviews = product?.reviews || [];
  const [visibleCount, setVisibleCount] = useState(3);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-slate-900">تقييمات المنتج</h3>
        <span className="text-xs font-extrabold text-slate-600">{reviews.length} تقييم</span>
      </div>

      {reviews.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-600 font-bold">
          لا توجد تقييمات بعد
        </div>
      )}

      {reviews.slice(0, visibleCount).map((review: any) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200">
              <Image src={review.user?.image || "/user.png"} alt={review.user?.name || "user"} fill className="object-cover" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-extrabold text-slate-900">{review.user?.name || "مستخدم"}</p>
                <p className="text-xs text-slate-400 font-bold">{review.created_at}</p>
              </div>

              <div className="flex items-center gap-1 text-amber-400 mt-1">
                {Array(Math.max(0, Number(review.rating || 0))).fill(0).map((_, i) => (
                  <FaStar key={i} />
                ))}
              </div>

              <p className="text-slate-700 mt-2 leading-relaxed">{review.comment}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  قام بالشراء
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                  تم التقييم
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {visibleCount < reviews.length && (
        <div className="pt-2 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setVisibleCount((p) => p + 3)}
            className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-extrabold shadow-sm hover:opacity-95 transition"
          >
            عرض المزيد
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
