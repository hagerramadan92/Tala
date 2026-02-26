// components/cart/EmptyCart.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[60vh] flex items-center justify-center px-4"
      dir="rtl"
    >
      <div className="text-center">
        <Image
          src="/images/cart2.webp"
          alt="عربة فارغة"
          width={300}
          height={250}
          className="mx-auto mb-6"
        />
        <h2 className="text-2xl font-bold mb-4 text-slate-700">
          عربة التسوق فارغة
        </h2>
        <p className="text-slate-500 mb-8">
          لم تقم بإضافة أي منتجات إلى العربة بعد
        </p>
        <Link
          href="/"
          className="inline-block bg-[#14213d] text-white py-3 px-8 md:rounded-2xl rounded-lg hover:bg-[#0f1a31] transition text-lg font-bold"
        >
          تصفح المنتجات
        </Link>
      </div>
    </motion.div>
  );
}