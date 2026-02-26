// components/cart/DesignUploader.tsx
"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FiUpload } from "react-icons/fi";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";

interface DesignUploaderProps {
  cartItemId: number;
  existingDesign?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  uploading?: boolean;
}

export default function DesignUploader({
  cartItemId,
  existingDesign,
  onUpload,
  onRemove,
  uploading = false,
}: DesignUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingDesign || null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم. يرجى رفع صورة أو PDF");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الملف كبير جداً. الحد الأقصى 5 ميجابايت");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleRemove = async () => {
    setPreview(null);
    await onRemove();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="border-t border-slate-200 pt-4 mt-2">
      <p className="text-sm font-extrabold text-slate-800 mb-3">
        أضف تصميمك الخاص
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* WhatsApp Option */}
        <Link
          href={`https://wa.me/?text=${encodeURIComponent(
            `مرحباً، لدي تصميم للمنتج رقم ${cartItemId}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition group"
        >
          <FaWhatsapp className="text-green-600 text-2xl mb-2" />
          <span className="text-xs font-bold text-green-700">واتساب</span>
        </Link>

        {/* Email Option */}
        <Link
          href={`mailto:?subject=تصميم المنتج&body=مرحباً، لدي تصميم للمنتج رقم ${cartItemId}`}
          className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition group"
        >
          <FaEnvelope className="text-blue-600 text-2xl mb-2" />
          <span className="text-xs font-bold text-blue-700">بريد إلكتروني</span>
        </Link>

        {/* Upload Option */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition group disabled:opacity-50"
        >
          <FiUpload className="text-amber-600 text-2xl mb-2" />
          <span className="text-xs font-bold text-amber-700">
            {uploading ? "جاري الرفع..." : "رفع ملف"}
          </span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      {/* Drop zone */}
      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mt-3 border-2 border-dashed rounded-xl p-6 text-center transition ${
            dragActive
              ? "border-amber-500 bg-amber-50"
              : "border-slate-200 hover:border-amber-300"
          }`}
        >
          <p className="text-sm text-slate-600">
            اسحب وأفلت الملف هنا أو اضغط للاختيار
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PNG, JPG, PDF (حد أقصى 5 ميجابايت)
          </p>
        </div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={preview}
                  alt="تصميم"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">
                  {uploading ? "جاري رفع التصميم..." : "تم اختيار التصميم"}
                </p>
                <p className="text-xs text-slate-500">
                  {uploading ? "يرجى الانتظار" : "سيتم الحفظ تلقائياً"}
                </p>
              </div>
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="p-1 hover:bg-slate-200 rounded-full transition disabled:opacity-50"
              >
                <IoClose size={20} className="text-slate-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}