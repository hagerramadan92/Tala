// components/cart/TotalOrder.tsx
"use client";

import React from "react";
import { n, money } from "@/utils/cartHelpers";

interface TotalOrderProps {
  itemsCount: number;
  subtotal: number;
  total: number;
  couponDiscount?: number;
  couponNewTotal?: number | null;
}

export function TotalOrder({
  itemsCount,
  subtotal,
  total,
  couponDiscount = 0,
  couponNewTotal = null,
}: TotalOrderProps) {
  const shippingFree = true;
  const shippingFee = shippingFree ? 0 : 48;
  const TAX_RATE = 0.15;

  const totalAfterCoupon = couponNewTotal ?? Math.max(0, total - couponDiscount);
  const totalWithShipping = totalAfterCoupon + shippingFee;
  const taxAmount = totalWithShipping * (TAX_RATE / (1 + TAX_RATE));
  const totalWithoutTax = totalWithShipping - taxAmount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-slate-700">المجموع ({itemsCount} عناصر)</p>
        <p className="font-bold text-slate-900">
          {money(subtotal)} <span className="text-xs">ريال</span>
        </p>
      </div>

      {couponDiscount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-emerald-700 font-semibold">خصم الكوبون</p>
          <p className="font-extrabold text-emerald-600">
            - {money(couponDiscount)} <span className="text-xs">ريال</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-600">الإجمالي بعد الخصم</p>
        <p className="font-semibold text-slate-900">
          {money(totalAfterCoupon)} <span className="text-xs">ريال</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-600">الإجمالي بدون ضريبة</p>
        <p className="font-semibold text-slate-900">
          {money(totalWithoutTax)} <span className="text-xs">ريال</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-600">ضريبة القيمة المضافة (15%)</p>
        <p className="font-semibold text-slate-900">
          {money(taxAmount)} <span className="text-xs">ريال</span>
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200">
        <p className="font-bold text-[#14213d]">الإجمالي الكلي</p>
        <p className="text-lg font-extrabold text-[#14213d]">
          {money(totalWithShipping)} <span className="text-sm">ريال</span>
        </p>
      </div>
    </div>
  );
}