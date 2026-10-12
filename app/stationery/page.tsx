"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPrinter,
  FiUploadCloud,
  FiFileText,
  FiImage,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiChevronRight,
  FiInfo,
  FiShield,
  FiLock,
  FiRefreshCw,
  FiAlertCircle,
  FiX,
  FiArrowRight,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import { useCart } from "@/src/context/CartContext";

// واجهات البيانات
interface PriceItem {
  id: number;
  service_type: "document" | "photo";
  paper_size: string;
  bw_price: string | number;
  color_price: string | number;
  file_bw_price?: string | number;
  file_color_price?: string | number;
  double_sided_price: string | number;
  is_active: boolean;
}

interface UploadedFileItem {
  id: string;
  file_url: string;
  file_path?: string;
  file_name: string;
  extension: string;
  is_image: boolean;
  is_pdf: boolean;
  size_formatted?: string;
  service_type: "document" | "photo";
  paper_size: string;
  color_type: "bw" | "color";
  orientation: "portrait" | "landscape";
  side_type: "single" | "double";
  pages_count: number;
  copies: number;
}

export default function StationeryPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // الحالة العامة
  const [selectedService, setSelectedService] = useState<"document" | "photo">("document");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCurrentFileName, setUploadCurrentFileName] = useState("");
  const [uploadCurrentIndex, setUploadCurrentIndex] = useState(0);
  const [uploadTotalFiles, setUploadTotalFiles] = useState(0);
  const [uploadBytesLoaded, setUploadBytesLoaded] = useState(0);
  const [uploadBytesTotal, setUploadBytesTotal] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalType, setUploadModalType] = useState<"document" | "photo">("document");
  const [generalNote, setGeneralNote] = useState("");

  // مصفوفات الأسعار والأحجام من الـ API
  const [pricesList, setPricesList] = useState<PriceItem[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>(["A4", "A3", "A5", "A2", "A1", "A0"]);
  const [sizeDimensions, setSizeDimensions] = useState<Record<string, string>>({
    A0: "84.1 × 118.9 cm",
    A1: "59.4 × 84.1 cm",
    A2: "42.0 × 59.4 cm",
    A3: "29.7 × 42.0 cm",
    A4: "21.0 × 29.7 cm",
    A5: "14.8 × 21.0 cm",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

  // جلب الأسعار من لوحة التحكم
  useEffect(() => {
    async function fetchStationeryPrices() {
      try {
        setLoadingPrices(true);
        const res = await fetch(`${API_URL}/stationery/prices`);
        if (res.ok) {
          const json = await res.json();
          if (json.status && json.data) {
            if (json.data.prices) setPricesList(json.data.prices);
            if (json.data.sizes) setAvailableSizes(json.data.sizes);
            if (json.data.size_dimensions) setSizeDimensions(json.data.size_dimensions);
          }
        }
      } catch (err) {
        console.error("فشل جلب أسعار القرطاسية:", err);
      } finally {
        setLoadingPrices(false);
      }
    }
    fetchStationeryPrices();
  }, [API_URL]);

  // دالة جلب سعر الصفحة بناء على المقاس واللون ونوع الخدمة (ورقة منفردة أو ورقة في ملف)
  const getPagePrice = (
    serviceType: "document" | "photo",
    paperSize: string,
    colorType: "bw" | "color",
    sideType: "single" | "double" = "single",
    pagesCount: number = 1
  ): number => {
    const item = pricesList.find(
      (p) =>
        p.service_type === serviceType &&
        p.paper_size.toUpperCase() === paperSize.toUpperCase()
    );
    if (!item) {
      return colorType === "color" ? (serviceType === "photo" ? 3.0 : 1.5) : 0.5;
    }

    // إذا كانت صفحة واحدة = سعر الورقة المفردة، وإذا كان ملفاً بأكثر من صفحة = سعر الورقة في الملف
    const isSingleSheet = pagesCount === 1;
    let base = 0;
    if (isSingleSheet) {
      base = colorType === "color" ? Number(item.color_price) : Number(item.bw_price);
    } else {
      const fileBw = item.file_bw_price !== undefined && item.file_bw_price !== null 
        ? Number(item.file_bw_price) 
        : Number(item.bw_price);
      const fileColor = item.file_color_price !== undefined && item.file_color_price !== null 
        ? Number(item.file_color_price) 
        : Number(item.color_price);
      base = colorType === "color" ? fileColor : fileBw;
    }

    if (sideType === "double" && Number(item.double_sided_price) > 0) {
      base += Number(item.double_sided_price);
    }
    return Math.max(0.05, Number(base.toFixed(2)));
  };

  // أقل سعر يبدأ به كل قسم لعرضه في البطاقات الرئيسية
  const startingDocPrice = pricesList
    .filter((p) => p.service_type === "document" && p.is_active)
    .reduce((min, p) => {
      const bestPrice = p.file_bw_price ? Math.min(Number(p.bw_price), Number(p.file_bw_price)) : Number(p.bw_price);
      return Math.min(min, bestPrice);
    }, 0.25);

  const startingPhotoPrice = pricesList
    .filter((p) => p.service_type === "photo" && p.is_active)
    .reduce((min, p) => Math.min(min, Number(p.color_price)), 2.0);

  // حساب تكلفة ملف واحد
  const calculateFileTotal = (file: UploadedFileItem): number => {
    const pricePerPage = getPagePrice(
      file.service_type,
      file.paper_size,
      file.color_type,
      file.side_type,
      file.pages_count
    );
    return Number((file.pages_count * pricePerPage * file.copies).toFixed(2));
  };

  // إجمالي السعر لجميع الملفات
  const grandTotal = uploadedFiles.reduce(
    (sum, file) => sum + calculateFileTotal(file),
    0
  );

  const totalPagesAll = uploadedFiles.reduce(
    (sum, f) => sum + f.pages_count * f.copies,
    0
  );

  // فتح نافذة اختيار الملفات
  const openUploadModal = (type: "document" | "photo") => {
    setUploadModalType(type);
    setSelectedService(type);
    setIsUploadModalOpen(true);
  };

  // دالة مساعدة لتنسيق حجم الملفات (Bytes to KB/MB)
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // دالة رفع ملف واحد مع تتبع نسبة التقدم
  const uploadSingleFileWithProgress = (
    file: File,
    onProgress: (loaded: number, total: number) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/stationery/upload`);
      xhr.setRequestHeader("Accept", "application/json");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve(json);
          } catch (e) {
            reject(new Error("استجابة غير صحيحة من الخادم"));
          }
        } else {
          try {
            const json = JSON.parse(xhr.responseText);
            reject(new Error(json.message || `فشل رفع الملف (${xhr.status})`));
          } catch {
            reject(new Error(`فشل رفع الملف (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("حدث خطأ في الاتصال بالشبكة"));

      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  };

  // معالجة رفع الملفات عبر الـ API مع حساب النسبة المئوية
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    if (uploadedFiles.length + files.length > 15) {
      toast.error("الحد الأقصى للملفات في الطلب الواحد هو 15 ملفاً");
      return;
    }

    const totalBytesAll = files.reduce((sum, f) => sum + f.size, 0);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadBytesLoaded(0);
    setUploadBytesTotal(totalBytesAll);
    setUploadTotalFiles(files.length);

    let cumulativeLoaded = 0;
    const newItems: UploadedFileItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadCurrentIndex(i + 1);
        setUploadCurrentFileName(file.name);

        if (file.size > 30 * 1024 * 1024) {
          toast.error(`الملف ${file.name} حجمه كبير جداً (أقصى حد 30MB)`);
          cumulativeLoaded += file.size;
          continue;
        }

        const json = await uploadSingleFileWithProgress(file, (loaded) => {
          const currentTotalLoaded = cumulativeLoaded + loaded;
          const pct = Math.min(
            99,
            Math.round((currentTotalLoaded / (totalBytesAll || 1)) * 100)
          );
          setUploadProgress(pct);
          setUploadBytesLoaded(currentTotalLoaded);
        });

        cumulativeLoaded += file.size;
        const currentTotalLoaded = cumulativeLoaded;
        const pct = Math.min(
          100,
          Math.round((currentTotalLoaded / (totalBytesAll || 1)) * 100)
        );
        setUploadProgress(pct);
        setUploadBytesLoaded(currentTotalLoaded);

        if (json.status && json.data) {
          const isDoc = uploadModalType === "document";
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file_url: json.data.file_url,
            file_path: json.data.file_path,
            file_name: json.data.original_name || file.name,
            extension: json.data.extension,
            is_image: json.data.is_image,
            is_pdf: json.data.is_pdf,
            size_formatted: json.data.size_formatted,
            service_type: isDoc ? "document" : "photo",
            paper_size: "A4",
            color_type: isDoc ? "bw" : "color",
            orientation: "portrait",
            side_type: "single",
            pages_count: Math.max(1, json.data.pages_count || 1),
            copies: 1,
          });
        }
      }

      setUploadProgress(100);

      if (newItems.length > 0) {
        setUploadedFiles((prev) => [...prev, ...newItems]);
        toast.success(`تم رفع ${newItems.length} ملف بنجاح!`);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        setIsUploading(false);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "حدث خطأ أثناء رفع الملفات، يرجى المحاولة ثانية");
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // تعديل خيارات ملف معين
  const updateFileOption = (
    id: string,
    key: keyof UploadedFileItem,
    value: any
  ) => {
    setUploadedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  // حذف ملف
  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((item) => item.id !== id));
    toast.success("تم حذف الملف من القائمة");
  };

  // إرسال الطلب وإضافته للسلة
  const handleAddToCart = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("يرجى رفع ملف واحد على الأقل للمتابعة");
      return;
    }

    setIsAddingToCart(true);
    const toastId = toast.loading("جاري إضافة طلب الطباعة إلى السلة...");

    try {
      const payload = {
        files: uploadedFiles.map((f) => ({
          file_url: f.file_url,
          file_path: f.file_path,
          file_name: f.file_name,
          service_type: f.service_type,
          paper_size: f.paper_size,
          color_type: f.color_type,
          orientation: f.orientation,
          side_type: f.side_type,
          pages_count: f.pages_count,
          copies: f.copies,
        })),
        note: generalNote,
      };

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const res = await fetch(`${API_URL}/stationery/add-to-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.status) {
        throw new Error(json.message || "فشلت إضافة الطلب إلى السلة");
      }

      toast.success("تمت إضافة خدمات الطباعة إلى السلة بنجاح!", { id: toastId });

      // تحديث السلة في الـ Context
      if (refreshCart) {
        await refreshCart();
      }

      // الانتقال إلى السلة أو صفحة الدفع
      router.push("/cart");
    } catch (err: any) {
      console.error("Cart error:", err);
      toast.error(err.message || "حدث خطأ أثناء إضافة الطلب للسلة", { id: toastId });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 text-slate-800 font-sans" dir="rtl">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#14213d] to-[#1a2c50] text-white pt-8 pb-14 px-4 md:px-8 border-b border-slate-700/50">
        <div className="absolute inset-0 bg-[radial-gradient(#ff7300_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#ffa655] text-xs font-bold mb-3 shadow-sm">
            <FiPrinter className="w-3.5 h-3.5" />
            <span>خدمات القرطاسية والطباعة</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">
            اطبع مستنداتك وصورك بدقة عالية
          </h1>
          <p className="text-slate-300 text-xs md:text-sm max-w-xl mx-auto">
            طباعة رقمية فورية بمقاسات A0 إلى A5 مع استلام من الفرع أو شحن لباب بيتك.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-6">
        {/* Main Content Card */}
        {uploadedFiles.length === 0 ? (
          /* Step 1: Initial Choice */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* The Single Unified Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 flex-1 text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-pro text-xs font-bold">
                    <span>📄 طباعة فورية</span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black text-slate-900">
                    طباعة المستندات والصور
                  </h2>

                  <p className="text-slate-500 text-xs md:text-sm">
                    ملفات PDF، وورد، وصور فوتوغرافية بأعلى دقة ليزر.
                  </p>

                  <ul className="space-y-1.5 text-xs md:text-sm text-slate-700 font-semibold pt-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pro" />
                      <span>المقاسات: A0 إلى A5 (الافتراضي A4)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pro" />
                      <span>ألوان أو أبيض وأسود • وجه أو وجهين</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pro" />
                      <span>
                        تبدأ من{" "}
                        <strong className="text-pro font-black">
                          {startingDocPrice.toFixed(2)} ر.س
                        </strong>{" "}
                        / صفحة
                      </span>
                    </li>
                  </ul>

                  {/* ONE Single Blue Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="w-full sm:w-auto min-w-[240px] py-3.5 px-7 rounded-xl bg-pro hover:bg-pro-max active:scale-[0.99] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <FiUploadCloud className="w-5 h-5" />
                      <span>اختيار الملفات (Select files)</span>
                    </button>
                  </div>
                </div>

                {/* Visual Graphic */}
                <div className="w-full md:w-56 shrink-0 flex items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-center space-y-1.5">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-3xl">
                      🖨️
                    </div>
                    <div className="text-xs font-extrabold text-slate-800">
                      طباعة فورية
                    </div>
                    <div className="text-[11px] text-slate-400">
                      شحن أو استلام من الفرع
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promises Section (As in Screenshots 1 & 2) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="text-center mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  — التزام وجودة تالا الجزيرة —
                </span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">
                  أمان وخصوصية تامة لملفاتك ومستنداتك
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-2.5 text-lg shadow-xs">
                    🗑️
                  </div>
                  <h5 className="text-xs md:text-sm font-bold text-slate-800 mb-0.5">
                    حذف تلقائي بعد الطباعة
                  </h5>
                  <p className="text-[11px] text-slate-400 max-w-[180px]">
                    حذف الملفات نهائياً فور الانتهاء لحماية خصوصيتك
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mb-2.5 text-lg shadow-xs">
                    🔒
                  </div>
                  <h5 className="text-xs md:text-sm font-bold text-slate-800 mb-0.5">
                    تشفير وحماية تامة
                  </h5>
                  <p className="text-[11px] text-slate-400 max-w-[180px]">
                    رفع وتخزين مشفر وآمن لبياناتك ومستنداتك
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-2.5 text-lg shadow-xs">
                    🛡️
                  </div>
                  <h5 className="text-xs md:text-sm font-bold text-slate-800 mb-0.5">
                    مراكز طباعة مجهزة
                  </h5>
                  <p className="text-[11px] text-slate-400 max-w-[180px]">
                    طباعة ليزر احترافية بأعلى معايير الدقة
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Step 2: Print Details Screen (Matching Screenshot 3 & Specs) */
          <div className="space-y-6">
            {/* Top Navigation & Action */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUploadedFiles([])}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                  title="الرجوع للبداية"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-extrabold text-base md:text-lg text-slate-900">
                    تفاصيل ومواصفات الطباعة
                  </h3>
                  <p className="text-xs text-slate-500">
                    حدد خيارات كل ملف من المقاس واللون والنسخ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openUploadModal(selectedService)}
                  className="px-4 py-2.5 rounded-xl bg-pro hover:bg-pro-max text-white font-bold text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>إضافة ملفات</span>
                </button>
              </div>
            </div>

            {/* Uploaded Files Cards List */}
            <div className="space-y-5">
              {uploadedFiles.map((file, idx) => {
                const fileCost = calculateFileTotal(file);
                const currentUnitPrice = getPagePrice(
                  file.service_type,
                  file.paper_size,
                  file.color_type,
                  file.side_type,
                  file.pages_count
                );

                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-5 relative"
                  >
                    {/* File Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-xl">
                          {file.is_image ? "🖼️" : "📄"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm md:text-base text-slate-900 truncate" title={file.file_name}>
                            {file.file_name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                              {file.service_type === "photo" ? "صورة" : "مستند"}
                            </span>
                            <span>•</span>
                            <span>{file.size_formatted || "ملف جاهز"}</span>
                            <span>•</span>
                            <span className="text-pro font-bold bg-pro/5 px-2 py-0.5 rounded">
                              {file.pages_count > 1 ? `ملف (${file.pages_count} صفحة)` : "ورقة مفردة (1 صفحة)"}
                            </span>
                            <span>•</span>
                            <span className="text-slate-500 font-medium">
                              ({currentUnitPrice} ر.س / ورقة)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-base font-extrabold text-[#ff7300]">
                          {fileCost.toFixed(2)} ر.س
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"
                          title="حذف هذا الملف"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Control 1: Number of copies */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          عدد النسخ المطلوبة:
                        </label>
                        <div className="flex items-center justify-between bg-white rounded-lg border border-slate-300 p-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateFileOption(file.id, "copies", Math.max(1, file.copies - 1))
                            }
                            className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-base transition"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-sm text-slate-900 px-4">
                            {file.copies}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateFileOption(file.id, "copies", file.copies + 1)
                            }
                            className="w-8 h-8 rounded-md bg-amber-50 hover:bg-amber-100 text-[#ff7300] flex items-center justify-center font-bold text-base transition"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          إجمالي الصفحات المطبوعة: {file.pages_count * file.copies} صفحة
                        </span>
                      </div>

                      {/* Control 2: Number of pages (editable) */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          عدد صفحات الملف:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={file.pages_count}
                            onChange={(e) =>
                              updateFileOption(
                                file.id,
                                "pages_count",
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-full bg-white px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-[#ff7300]"
                          />
                          <span className="text-xs text-slate-500 whitespace-nowrap">صفحة</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          يمكنك تعديل عدد الصفحات يدوياً
                        </span>
                      </div>

                      {/* Control 3: Colour preset (B&W vs Color) */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          نوع الألوان (Colour Preset):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => updateFileOption(file.id, "color_type", "bw")}
                            className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                              file.color_type === "bw"
                                ? "border-[#ff7300] bg-white text-[#ff7300] shadow-xs"
                                : "border-slate-200 bg-white/50 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <span>⚪ أبيض وأسود</span>
                            <span className="text-[10px] text-slate-400">
                              {getPagePrice(file.service_type, file.paper_size, "bw").toFixed(2)} ر.س/ص
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateFileOption(file.id, "color_type", "color")}
                            className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                              file.color_type === "color"
                                ? "border-[#ff7300] bg-white text-[#ff7300] shadow-xs"
                                : "border-slate-200 bg-white/50 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <span>🎨 ألوان ملونة</span>
                            <span className="text-[10px] text-slate-400">
                              {getPagePrice(file.service_type, file.paper_size, "color").toFixed(2)} ر.س/ص
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Control 4: Paper Size (A0 to A5) */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 md:col-span-2 lg:col-span-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700">
                            حجم الورقة (Paper Size A0 - A5):
                          </label>
                          <span className="text-[11px] text-slate-500 font-medium">
                            المقاس المختار: {file.paper_size} ({sizeDimensions[file.paper_size] || ""})
                          </span>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {availableSizes.map((size) => {
                            const isSelected = file.paper_size.toUpperCase() === size.toUpperCase();
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => updateFileOption(file.id, "paper_size", size)}
                                className={`py-2 px-2.5 rounded-xl border text-center transition ${
                                  isSelected
                                    ? "border-[#ff7300] bg-white text-[#ff7300] shadow-xs ring-2 ring-[#ff7300]/10"
                                    : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                                }`}
                              >
                                <div className="font-extrabold text-sm">{size}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                  {sizeDimensions[size] || ""}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Control 5: Print Orientation */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          اتجاه الطباعة (Print Orientation):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => updateFileOption(file.id, "orientation", "portrait")}
                            className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              file.orientation === "portrait"
                                ? "border-[#ff7300] bg-white text-[#ff7300] shadow-xs"
                                : "border-slate-200 bg-white/50 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <span>📄 طولي (Portrait)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateFileOption(file.id, "orientation", "landscape")}
                            className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              file.orientation === "landscape"
                                ? "border-[#ff7300] bg-white text-[#ff7300] shadow-xs"
                                : "border-slate-200 bg-white/50 text-slate-600 hover:bg-white"
                            }`}
                          >
                            <span>📑 عرضي (Landscape)</span>
                          </button>
                        </div>
                      </div>

                      {/* Control 6: Print Sides (Single vs Double) */}
                      {file.service_type === "document" && (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            طباعة الوجه (Sides):
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => updateFileOption(file.id, "side_type", "single")}
                              className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                file.side_type === "single"
                                  ? "border-[#ff7300] bg-white text-[#ff7300] shadow-xs"
                                  : "border-slate-200 bg-white/50 text-slate-600 hover:bg-white"
                              }`}
                            >
                              <span>وجه واحد</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateFileOption(file.id, "side_type", "double")}
                              className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                file.side_type === "double"
                                  ? "border-[#ff7300] bg-white text-[#ff7300] shadow-xs"
                                  : "border-slate-200 bg-white/50 text-slate-600 hover:bg-white"
                              }`}
                            >
                              <span>وجهين</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* General Order Notes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <label className="block text-xs md:text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <FiInfo className="text-[#ff7300]" />
                <span>ملاحظات إضافية على أمر الطباعة (اختياري):</span>
              </label>
              <textarea
                rows={2}
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder="مثال: يرجى التدبيس في الزاوية العلوية، أو وضع غلاف شفاف، أو أي متطلبات خاصة..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#ff7300] transition resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal (Matching Screenshot 2) */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden text-right"
              dir="rtl"
            >
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}

              {isUploading ? (
                <div className="py-6 text-center space-y-5">
                  {/* Circular Percentage Badge */}
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-slate-50 border-4 border-pro/20 flex flex-col items-center justify-center shadow-inner relative">
                      <span className="text-3xl font-black text-pro tracking-tight">
                        {uploadProgress}%
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold mt-0.5">
                        {uploadProgress >= 100 ? "معالجة" : "جاري الرفع"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-extrabold text-slate-900 mb-1">
                      {uploadProgress >= 100
                        ? "اكتمل الرفع، جاري فحص الملفات..."
                        : "جاري رفع الملفات..."}
                    </h3>
                    <p
                      className="text-xs text-slate-500 max-w-sm mx-auto truncate font-medium mt-1"
                      dir="ltr"
                    >
                      {uploadCurrentFileName}
                    </p>
                    {uploadTotalFiles > 1 && (
                      <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        الملف {uploadCurrentIndex} من {uploadTotalFiles}
                      </span>
                    )}
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="space-y-2 px-2 max-w-md mx-auto">
                    <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                      <div
                        className="h-full bg-pro rounded-full transition-all duration-200 ease-out shadow-xs"
                        style={{ width: `${Math.max(5, uploadProgress)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                      <span>{formatBytes(uploadBytesLoaded)}</span>
                      <span className="text-pro font-black">{uploadProgress}%</span>
                      <span>{formatBytes(uploadBytesTotal)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl text-center text-xs text-amber-800 border border-amber-200/80 font-medium">
                    يرجى الانتظار حتى اكتمال عملية التحميل...
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                      اختر الملفات للطباعة
                    </h3>
                    <p className="text-xs text-slate-500">
                      نسمح بحد أقصى 10 ملفات حتى 30 ميجابايت للملف
                    </p>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={
                      uploadModalType === "photo"
                        ? "image/jpeg,image/png,image/heic,image/webp"
                        : ".pdf,.doc,.docx,application/pdf,application/msword"
                    }
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div className="space-y-3 mb-6">
                    {/* Upload Photo Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadModalType("photo");
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "image/jpeg,image/png,image/heic,image/webp";
                          fileInputRef.current.click();
                        }
                      }}
                      className={`w-full p-4 rounded-2xl border-2 text-right flex items-center gap-4 transition group ${
                        uploadModalType === "photo"
                          ? "border-pro bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-pro flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition">
                        🖼️
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 mb-0.5">
                          رفع صور (Upload photo)
                        </h4>
                        <p className="text-xs text-slate-500">
                          الصيغ المعتمدة: JPG, JPEG, PNG, HEIC, WEBP
                        </p>
                      </div>
                    </button>

                    {/* Upload Document Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadModalType("document");
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = ".pdf,.doc,.docx,application/pdf";
                          fileInputRef.current.click();
                        }
                      }}
                      className={`w-full p-4 rounded-2xl border-2 text-right flex items-center gap-4 transition group ${
                        uploadModalType === "document"
                          ? "border-pro bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-pro flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition">
                        📄
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 mb-0.5">
                          رفع مستند (Upload document)
                        </h4>
                        <p className="text-xs text-slate-500">
                          الصيغ المعتمدة: PDF, DOCX, DOC
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Bottom Notice */}
                  <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200/60">
                    🔒 ملاحظة: سيتم حذف ملفاتك المرفوعة بعد الطباعة لضمان الخصوصية
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Summary Bar (Active when files are uploaded) */}
      {uploadedFiles.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl py-3.5 px-4">
          <div className="container mx-auto max-w-5xl flex items-center justify-between gap-4 flex-wrap">
            {/* Left/Start side: Summary info */}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg md:text-2xl font-black text-[#ff7300]">
                  {grandTotal.toFixed(2)} ر.س
                </span>
                <span className="text-xs text-slate-400">شامل الضريبة</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{uploadedFiles.length} مستندات</span>
                <span>•</span>
                <span>{totalPagesAll} صفحات إجمالية</span>
                <span className="hidden md:inline">• استلام من الفرع أو شحن</span>
              </div>
            </div>

            {/* Right/End side: Action Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isAddingToCart}
                onClick={handleAddToCart}
                className="px-6 md:px-10 py-3.5 rounded-xl bg-pro hover:bg-pro-max active:scale-95 text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition cursor-pointer disabled:opacity-50"
              >
                {isAddingToCart ? (
                  <>
                    <FiRefreshCw className="w-5 h-5 animate-spin" />
                    <span>جاري التجهيز...</span>
                  </>
                ) : (
                  <>
                    <span>إضافة إلى السلة وإتمام الطلب</span>
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

