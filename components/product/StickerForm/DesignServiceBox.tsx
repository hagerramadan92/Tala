// components/product/StickerForm/DesignServiceBox.tsx
import React, { useMemo } from "react";
import Link from "next/link";
import { Divider } from "@mui/material";
import { useAuth } from "@/src/context/AuthContext";
import { useAppContext } from "@/src/context/AppContext";
import { getSocialValue } from "@/utils/productHelpers";
import { DesignSendMethod } from "@/Types/product.types";

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
  const { socialMedia } = useAppContext() as any;

  const whatsappFromSocial = getSocialValue(socialMedia, "whatsapp");
  const emailFromSocial = getSocialValue(socialMedia, "email");

  const waText = encodeURIComponent(
    `مرحباً، لدي تصميم للمنتج رقم ${productId}${cartItemId ? ` - عنصر سلة: ${cartItemId}` : ""}`
  );

  const whatsappHref = useMemo(() => {
    if (!whatsappFromSocial) return null;

    if (/^https?:\/\//i.test(whatsappFromSocial)) {
      if (/wa\.me\//i.test(whatsappFromSocial) && !/text=/i.test(whatsappFromSocial)) {
        const join = whatsappFromSocial.includes("?") ? "&" : "?";
        return `${whatsappFromSocial}${join}text=${waText}`;
      }
      return whatsappFromSocial;
    }

    const phone = whatsappFromSocial.replace(/[^\d]/g, "");
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${waText}`;
  }, [whatsappFromSocial, waText]);

  if (!whatsappHref && !emailFromSocial && !cartItemId) return null;

  return (
    <div className="mt-3 md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-extrabold text-slate-800">أرسل ملف التصميم عبر:</p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {whatsappHref && (
          <button
            type="button"
            onClick={() => setDesignSendMethod("whatsapp")}
            className={[
              "md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition text-right",
              designSendMethod === "whatsapp" ? "ring-2 ring-green-500" : "",
            ].join(" ")}
          >
            <p className="font-black text-slate-900">WhatsApp</p>
            <p className="text-xs text-slate-500 font-bold mt-1">إرسال عبر واتساب</p>
          </button>
        )}

        {emailFromSocial && (
          <button
            type="button"
            onClick={() => setDesignSendMethod("email")}
            className={[
              "md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition text-right",
              designSendMethod === "email" ? "ring-2 ring-blue-500" : "",
            ].join(" ")}
          >
            <p className="font-black text-slate-900">📧 البريد الإلكتروني</p>
            <p className="text-xs text-blue-600 font-bold mt-1 font-mono">{emailFromSocial}</p>
          </button>
        )}

        <button
          type="button"
          onClick={() => setDesignSendMethod("upload")}
          className={[
            "md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition text-right",
            designSendMethod === "upload" ? "ring-2 ring-amber-300" : "",
          ].join(" ")}
        >
          <p className="font-black text-slate-900">رفع الملف</p>
          <p className="text-xs text-slate-500 font-bold mt-1">رفع مباشر عبر الموقع</p>
        </button>
      </div>

      {designSendMethod === "whatsapp" && whatsappHref && (
        <div className="mt-4">
          <Divider className="!my-3" />
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">📱</div>
              <div>
                <p className="text-sm font-bold text-green-800">تم اختيار الإرسال عبر واتساب</p>
                <p className="text-xs text-green-600">انقر على الزر أدناه لفتح المحادثة</p>
              </div>
            </div>
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-green-700 transition"
            >
              <span>فتح واتساب</span>
              <span>📤</span>
            </Link>
          </div>
        </div>
      )}

      {designSendMethod === "email" && emailFromSocial && (
        <div className="mt-4">
          <Divider className="!my-3" />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">📧</div>
              <div>
                <p className="text-sm font-bold text-blue-800">تم اختيار الإرسال عبر البريد الإلكتروني</p>
                <p className="text-xs text-blue-600 font-mono">{emailFromSocial}</p>
              </div>
            </div>
            <Link
              href={`mailto:${emailFromSocial}?subject=${encodeURIComponent("طلب تصميم")}&body=${encodeURIComponent(
                `السلام عليكم،\n\nلدي طلب تصميم للمنتج`
              )}`}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
            >
              <span>إرسال بريد إلكتروني</span>
              <span>📤</span>
            </Link>
          </div>
        </div>
      )}

      {designSendMethod === "upload" && (
        <div className="mt-4">
          <Divider className="!my-3" />
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">📎</div>
              <div>
                <p className="text-sm font-bold text-amber-800">تم اختيار الرفع المباشر</p>
                <p className="text-xs text-amber-600">قم برفع ملف التصميم مباشرة</p>
              </div>
            </div>

            <div className="relative">
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
                  accept="image/*,.pdf,.ai,.psd,.eps,.svg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setDesignFile(f);
                    onDesignFileChange?.(f);
                  }}
                />

                {!designFile ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg mb-1">⬆️</div>
                    <p className="text-xs font-bold text-slate-700">اختر ملف التصميم</p>
                    <p className="text-[10px] text-slate-500">PNG, JPG, PDF, AI, PSD, SVG</p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg mb-1">✅</div>
                    <p className="text-xs font-bold text-emerald-700">{designFile.name}</p>
                    <p className="text-[10px] text-slate-500">{(designFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                )}
              </label>

              {designFile && (
                <button
                  type="button"
                  onClick={() => {
                    setDesignFile(null);
                    onDesignFileChange?.(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold hover:bg-red-600 transition shadow-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}