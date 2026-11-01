// components/product/StickerForm/DesignServiceBox.tsx
import React, { useEffect } from "react";
import Swal from "sweetalert2";
import { DesignSendMethod } from "@/Types/product.types";

/** الحد الأقصى لحجم ملف التصميم: 5 ميجا */
export const MAX_DESIGN_FILE_BYTES = 5 * 1024 * 1024;

/** صور بأي صيغة + PDF + ملفات التصميم الشائعة */
export const DESIGN_FILE_ACCEPT =
  "image/*,.pdf,.ai,.psd,.eps,.svg,.heic,.heif,.avif,.tiff,.tif,.bmp";

interface DesignServiceBoxProps {
  productId: number;
  cartItemId?: number;
  designSendMethod: DesignSendMethod;
  setDesignSendMethod: (method: DesignSendMethod) => void;
  designFile: File | null;
  setDesignFile: (file: File | null) => void;
  onDesignFileChange?: (file: File | null) => void;
}

export function DesignServiceBox({
  productId,
  cartItemId,
  designSendMethod,
  setDesignSendMethod,
  designFile,
  setDesignFile,
  onDesignFileChange,
}: DesignServiceBoxProps) {
  // الرفع المباشر عبر الموقع هو الطريقة الوحيدة.
  useEffect(() => {
    if (designSendMethod !== "upload") {
      setDesignSendMethod("upload");
    }
  }, [designSendMethod, setDesignSendMethod]);

  const handleFile = (file: File | null) => {
    if (!file) {
      setDesignFile(null);
      onDesignFileChange?.(null);
      return;
    }

    if (file.size > MAX_DESIGN_FILE_BYTES) {
      Swal.fire({
        icon: "error",
        title: "الملف كبير",
        text: "حجم ملف التصميم يجب أن يكون 5 ميجا أو أقل.",
        confirmButtonText: "تمام",
        confirmButtonColor: "#14213d",
      });
      return;
    }

    setDesignFile(file);
    onDesignFileChange?.(file);
  };

  return (
    <div className="mt-3 md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-extrabold text-slate-800">ارفع ملف التصميم:</p>
      <p className="text-[11px] text-slate-500 font-bold mt-1">
        صور بأي صيغة أو PDF — بحد أقصى 5 ميجا
      </p>

      <div className="relative mt-3">
        <label
          className={[
            "flex flex-col items-center justify-center gap-2",
            "w-full rounded-lg border-2 border-dashed",
            "px-6 py-5 text-center cursor-pointer transition",
            designFile
              ? "border-emerald-400 bg-emerald-50"
              : "border-amber-300 hover:border-amber-500 bg-white",
          ].join(" ")}
        >
          <input
            type="file"
            accept={DESIGN_FILE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              handleFile(f);
              e.currentTarget.value = "";
            }}
            data-product-id={productId}
            data-cart-item-id={cartItemId}
          />

          {!designFile ? (
            <>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg mb-1">
                ⬆️
              </div>
              <p className="text-xs font-bold text-slate-700">اختر ملف التصميم</p>
              <p className="text-[10px] text-slate-500">PNG, JPG, PDF, AI, PSD, SVG — حتى 5 ميجا</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg mb-1">
                ✅
              </div>
              <p className="text-xs font-bold text-emerald-700 break-all px-2">{designFile.name}</p>
              <p className="text-[10px] text-slate-500">
                {(designFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          )}
        </label>

        {designFile && (
          <button
            type="button"
            onClick={() => handleFile(null)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold hover:bg-red-600 transition shadow-sm"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
