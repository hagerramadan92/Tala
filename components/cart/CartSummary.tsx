// components/cart/CartSummary.tsx
"use client";

import React from "react";

interface CartSummaryProps {
  children: React.ReactNode;
}

export function CartSummary({ children }: CartSummaryProps) {
  return (
    <div className="border border-slate-200 md:rounded-2xl rounded-lg p-6 bg-white shadow-sm">
      <h4 className="text-md font-extrabold text-[#14213d] mb-5">
        ملخص الطلب
      </h4>
      {children}
    </div>
  );
}