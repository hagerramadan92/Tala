// components/product/StickerForm/index.tsx
"use client";

import React, { useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import InfoIcon from "@mui/icons-material/Info";
import toast from "react-hot-toast";

import { StickerFormProvider, useStickerForm } from "./StickerFormContext";
import { SizeSelector } from "./SizeSelector";
import { SizeTierSelector } from "./SizeTierSelector";
import { ColorSelector } from "./ColorSelector";
import { MaterialSelector } from "./MaterialSelector";
import { OptionGroupSelector } from "./OptionGroupSelector";
import { PrintingSelector } from "./PrintingSelector";
import { SaveBar } from "./SaveBar";

import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";

import { StickerFormHandle, SelectedOptions } from "@/Types/product.types";
import { buildIdsPayload, buildSelectedOptionsWithPrice } from "@/utils/productHelpers";
import { StickerFormSkeleton } from "@/components/shared/Skeletons/StickerFormSkeleton";

interface StickerFormProps {
  cartItemId?: number;
  productId: number;
  productData?: any;
  onOptionsChange?: (options: SelectedOptions) => void;
  showValidation?: boolean;
  onDesignFileChange?: (file: File | null) => void;
}

// المكون الداخلي الذي يستخدم Context
const StickerFormContent = forwardRef<StickerFormHandle, StickerFormProps>(function StickerFormContent(
  { cartItemId, productId, showValidation = false, onDesignFileChange },
  ref
) {
  const { updateCartItem } = useCart();
  const { authToken: token } = useAuth() as any;

  const { 
    getOptionsObj, 
    validateCurrentOptions,
    designFile,
    setDesignFile,
    showSaveButton,
    savedSuccessfully,
    saving,
    setSaving,
    setShowSaveButton,
    setSavedSuccessfully,
    resetAllOptions,
    apiData
  } = useStickerForm();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ✅ تعريف الدوال التي ستكون متاحة عبر ref
  useImperativeHandle(ref, () => ({
    getOptions: getOptionsObj,
    validate: validateCurrentOptions,
  }), [getOptionsObj, validateCurrentOptions]);

  const saveAllOptions = async () => {
    if (!cartItemId || !apiData) return;

    const opts = getOptionsObj();
    const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
    const idsPayload = buildIdsPayload(apiData, opts);

    const qty = Math.max(1, Number(opts?.size_quantity || 1));

    const payload: any = {
      ...idsPayload,
      selected_options,
      quantity: qty,
    };

    try {
      setSaving(true);
      const success = await updateCartItem(cartItemId, payload);
      if (success) {
        setSavedSuccessfully(true);
        setShowSaveButton(false);
        setTimeout(() => setSavedSuccessfully(false), 2500);
        // toast.success("تم حفظ التغييرات ✅");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 14 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }} 
      className="pt-4 mt-4"
    >
      {/* Save bar for cart mode */}
      {cartItemId && (
        <SaveBar 
          onSave={saveAllOptions} 
          onReset={resetAllOptions} 
          saving={saving} 
        />
      )}

      <div className="space-y-4">
        <SizeSelector apiData={apiData} showValidation={showValidation} />
        <SizeTierSelector apiData={apiData} showValidation={showValidation} />
        <ColorSelector apiData={apiData} showValidation={showValidation} />
        <MaterialSelector apiData={apiData} showValidation={showValidation} />
        
        <OptionGroupSelector 
          apiData={apiData} 
          showValidation={showValidation} 
          productId={productId}
          cartItemId={cartItemId}
          onDesignFileChange={onDesignFileChange}
        />
        
        <PrintingSelector apiData={apiData} showValidation={showValidation} />
      </div>

      {apiData?.options_note && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 md:rounded-2xl rounded-lg">
          <div className="flex items-start gap-2">
            <InfoIcon className="text-blue-500 text-sm mt-0.5" />
            <p className="text-sm text-blue-700 font-semibold">{apiData.options_note}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// المكون الرئيسي
export const StickerForm = forwardRef<StickerFormHandle, StickerFormProps>(function StickerForm(
  { cartItemId, productId, productData, onOptionsChange, showValidation = false, onDesignFileChange },
  ref
) {
  const [formLoading, setFormLoading] = React.useState(true);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [apiData, setApiData] = React.useState<any>(null);

  React.useEffect(() => {
    setApiError(null);
    setFormLoading(true);

    try {
      if (!productData) throw new Error("لا توجد بيانات للمنتج");
      console.log("📦 StickerForm received productData:", productData);
      setApiData(productData);
    } catch (err: any) {
      setApiError(err?.message || "حدث خطأ أثناء تحميل الخيارات");
      setApiData(null);
    } finally {
      setFormLoading(false);
    }
  }, [productData]);

  if (formLoading) return <StickerFormSkeleton />;
  if (apiError || !apiData) {
    return (
      <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 text-center">
        <p className="text-slate-700 font-extrabold">{apiError || "لا توجد بيانات للمنتج"}</p>
      </div>
    );
  }

  console.log("🎯 Rendering StickerForm with Provider, onOptionsChange exists:", !!onOptionsChange);

  return (
    <StickerFormProvider 
      apiData={apiData}
      cartItemId={cartItemId}
      onOptionsChange={onOptionsChange}
      onDesignFileChange={onDesignFileChange}
    >
      <StickerFormContent 
        ref={ref}
        cartItemId={cartItemId}
        productId={productId}
        showValidation={showValidation}
        onDesignFileChange={onDesignFileChange}
      />
    </StickerFormProvider>
  );
});