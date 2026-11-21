// components/product/BottomBar/index.tsx
import React, { useEffect } from "react";
import Image from "next/image";
import ButtonComponent from "@/components/ButtonComponent";
import { LuCreditCard } from "react-icons/lu";
import { BsCart3 } from "react-icons/bs";

interface BottomBarProps {
  product: any;
  displayTotal: number;
  showMissingBadge: boolean;
  uploadingDesign: boolean;
  onAddToCart: () => void;
  onBuyNow?: () => void;
}

export function BottomBar({ 
  product, 
  displayTotal, 
  showMissingBadge, 
  uploadingDesign, 
  onAddToCart,
  onBuyNow,
}: BottomBarProps) {
  
  // ✅ إضافة useEffect لتتبع التغييرات
  useEffect(() => {
    console.log("BottomBar received new displayTotal:", displayTotal);
  }, [displayTotal]);

  useEffect(() => {
    console.log("BottomBar received new product:", product?.name);
  }, [product]);

  // تحديد عنوان الزر بناءً على الحالة
  const getButtonTitle = () => {
    if (showMissingBadge) return "اختر الخيارات أولاً";
    if (uploadingDesign) return "جاري الاضافة...";
    return "أضف إلى السلة";
  };

  return (
    <div className="fixed bottom-0 start-0 end-0 z-50">
      <div className="border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="container py-3">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-3 py-3 md:px-4 md:py-4">
            <div className="flex max-md:flex-col items-center justify-between gap-3">
              {/* Left */}
              <div className="max-md:w-full flex items-center gap-3 min-w-0">
                <div className="relative w-14 h-14 md:w-16 md:h-16 md:rounded-2xl rounded-lg overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
                  <Image 
                    src={product.image || "/images/not.jpg"} 
                    alt={product.name} 
                    fill 
                    className="object-cover" 
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm md:text-base font-black text-slate-900 line-clamp-2">
                    {product.name}
                  </p>

                  <p className="text-[12px] text-slate-500 font-bold mt-0.5 line-clamp-1">
                    {product?.delivery_time?.estimated ? `التوصيل المتوقع: ${product.delivery_time.estimated}` : ""}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex max-md:w-full max-md:justify-between items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-[12px] text-slate-500 font-extrabold">السعر شامل الضريبة</p>
                  </div>

                  <div className="mt-0.5 flex items-end gap-2 justify-end">
                    <p className="text-xl md:text-2xl font-black text-slate-900 leading-none">
                      {displayTotal.toFixed(2)}
                    </p>
                    <span className="text-sm font-extrabold text-slate-700">ر.س</span>
                  </div>
                </div>

                <div className="sm:hidden flex flex-col items-end">
                  <p className="text-[10px] text-slate-500 font-extrabold">السعر شامل الضريبة</p>
                  <div className="flex items-end gap-1">
                    <p className="text-lg font-black text-slate-900 leading-none">
                      {displayTotal.toFixed(2)}
                    </p>
                    <span className="text-[12px] font-extrabold text-slate-700">ر.س</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="min-w-[150px] md:min-w-[170px]">
                    <ButtonComponent
                      className="scale-[.8]"
                      title={getButtonTitle()}
                      onClick={onAddToCart}
                    />
                  </div>
                  {onBuyNow && (
                    <button
                      type="button"
                      onClick={onBuyNow}
                      disabled={showMissingBadge || uploadingDesign}
                      className={`h-11 md:h-12 px-4 md:px-5 rounded-xl text-[13px] md:text-sm font-extrabold inline-flex items-center justify-center gap-2 transition ${
                        showMissingBadge || uploadingDesign
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : "bg-white text-pro border-2 border-pro hover:bg-pro hover:text-white active:scale-[0.98]"
                      }`}
                    >
                      <LuCreditCard className="w-4 h-4 md:w-5 md:h-5" />
                      اشترِ الآن
                    </button>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}