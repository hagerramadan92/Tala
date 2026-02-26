// components/cart/CartItemCard.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { BsTrash3 } from "react-icons/bs";
import { IoIosCloseCircle } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { n, money, parseSelectedOptions } from "@/utils/cartHelpers";
import DesignUploader from "@/components/cart/DesignUploader";

interface CartItemCardProps {
  item: any;
  designPreview?: string;
  onQuantityChange: (cartItemId: number, newQty: number) => Promise<void>;
  onRemove: (cartItemId: number) => Promise<void>;
  onDesignUpload: (cartItemId: number, file: File) => Promise<boolean>;
  onRemoveDesign: (cartItemId: number) => Promise<void>;
}

export default function CartItemCard({
  item,
  designPreview,
  onQuantityChange,
  onRemove,
  onDesignUpload,
  onRemoveDesign,
}: CartItemCardProps) {
  const [uploading, setUploading] = useState(false);
  const cartItemId = item.cart_item_id || item.id;
  const product = item.product || {};
  
  // Parse selected options safely
  const selectedOptions = useMemo(() => {
    return parseSelectedOptions(item.selected_options);
  }, [item.selected_options]);

  // Check if item has size tiers
  const hasTierQty = useMemo(() => {
    const sizeName = String(item?.size || "").trim();
    const sizeObj = product?.sizes?.find((s: any) => String(s.name).trim() === sizeName);
    return sizeObj?.tiers?.length > 0 && n(item?.quantity) > 0;
  }, [product?.sizes, item?.size, item?.quantity]);

  // Check if has design
  const hasDesign = useMemo(() => {
    return !!(item.image_design || designPreview);
  }, [item.image_design, designPreview]);

  // Check if design service is selected
  const hasDesignService = useMemo(() => {
    return selectedOptions.some((opt: any) => 
      opt.option_name?.includes("خدمة تصميم") && 
      opt.option_value?.includes("لدى تصميم")
    );
  }, [selectedOptions]);

  // Handle quantity change
  const handleQuantityChange = (newQty: number) => {
    onQuantityChange(cartItemId, newQty);
  };

  // Handle remove
  const handleRemove = async () => {
    await onRemove(cartItemId);
  };

  // Handle design upload
  const handleDesignUploadWrapper = async (file: File) => {
    setUploading(true);
    try {
      await onDesignUpload(cartItemId, file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative border md:rounded-2xl rounded-lg border-slate-200 bg-white shadow-sm p-5">
      {/* Main Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Product Image */}
        <Link href={`/product/${product.slug || product.id}`} className="shrink-0">
          <div className="w-24 h-20 bg-slate-100 md:rounded-2xl rounded-lg overflow-hidden border border-slate-200">
            <Image
              src={product.image || "/images/not.jpg"}
              alt={product.name}
              width={96}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-[15px] text-slate-900">
                {product.name}
              </h3>

              {hasTierQty && (
                <p className="text-xs font-extrabold text-slate-600 mt-1">
                  كمية المقاس: {n(item?.quantity)} قطعة
                </p>
              )}

              {/* Price */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900">
                  {money(n(item.price_per_unit || item._unit || 0))} <span className="text-xs">ريال</span>
                </span>

                {product.has_discount && n(product.price) > n(product.final_price) && (
                  <>
                    <span className="text-xs font-extrabold text-slate-500 line-through">
                      {money(n(product.price))} ريال
                    </span>
                    <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      خصم
                    </span>
                  </>
                )}
              </div>

              {/* Selected Options Summary */}
              {selectedOptions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedOptions.map((opt: any, idx: number) => {
                    // Handle both string and object formats
                    const optionName = opt.option_name || opt.name || '';
                    const optionValue = opt.option_value || opt.value || opt;
                    const additionalPrice = opt.additional_price || opt.price || 0;
                    
                    // Skip if it's just a string without proper structure
                    if (typeof opt === 'string') {
                      return (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-700"
                        >
                          {opt}
                        </span>
                      );
                    }
                    
                    return (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-700"
                      >
                        {optionName}: {optionValue}
                        {additionalPrice > 0 && ` (+${money(additionalPrice)})`}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Design Badge */}
              {hasDesign && (
                <div className="mt-2">
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                    ✓ {designPreview ? "معاينة التصميم" : "تم رفع التصميم"}
                  </span>
                </div>
              )}
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-3 border border-slate-200 md:rounded-2xl rounded-lg overflow-hidden ${hasTierQty ? "opacity-50 pointer-events-none" : ""}`}>
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={hasTierQty}
                  className="w-10 h-9 text-slate-600 border-l border-slate-200 flex items-center justify-center hover:bg-slate-50 transition disabled:hover:bg-transparent"
                >
                  <FaPlus size={16} />
                </button>

                <span className="font-extrabold w-6 text-lg text-center bg-white text-slate-900">
                  {item._effectiveQty || item.quantity}
                </span>

                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={hasTierQty}
                  className="w-10 h-9 border-r border-slate-200 flex items-center justify-center hover:bg-slate-50 transition disabled:hover:bg-transparent"
                >
                  {item.quantity <= 1 ? (
                    <BsTrash3 className="text-rose-600" size={16} />
                  ) : (
                    <FaMinus className="text-slate-600" size={14} />
                  )}
                </button>
              </div>

              <button
                onClick={handleRemove}
                className="hover:opacity-80 transition"
                aria-label="حذف"
              >
                <IoIosCloseCircle className="text-rose-500" size={40} />
              </button>
            </div>
          </div>

          {/* Design Uploader */}
          <AnimatePresence>
            {(hasDesign || hasDesignService) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 overflow-hidden"
              >
                <DesignUploader
                  cartItemId={cartItemId}
                  existingDesign={item.image_design || designPreview}
                  onUpload={handleDesignUploadWrapper}
                  onRemove={() => onRemoveDesign(cartItemId)}
                  uploading={uploading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}