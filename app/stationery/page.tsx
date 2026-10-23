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
  paper_type: string;
  paper_size: string;
  bw_price: string | number;
  color_price: string | number;
  file_bw_price?: string | number;
  file_color_price?: string | number;
  side_type: "single" | "double";
  orientation: "portrait" | "landscape";
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
  paper_type: string;
  paper_size: string;
  color_type: "bw" | "color";
  orientation: "portrait" | "landscape";
  side_type: "single" | "double";
  pages_count: number;
  copies: number;
  services: string[];
}

interface StationeryService {
  id: number;
  key: string;
  name: string;
  price: string | number;
}

interface UploadedFileResponse {
  status: boolean;
  message?: string;
  completed?: boolean;
  data?: {
    file_url: string;
    file_path: string;
    original_name?: string;
    extension: string;
    is_image: boolean;
    is_pdf: boolean;
    size_formatted?: string;
    pages_count?: number;
  };
}

const SUPPORTED_PAPER_SIZES = ["A4", "A3", "A5", "A2", "A1"];
const LARGE_PAPER_SIZES = ["A1", "A2"];
const MIN_LARGE_PAPER_SHEETS = 100;

// السعر الأدنى لأول 100 ورقة للمقاسات الكبيرة (A1 / A2) حسب الوجه واللون.
const LARGE_FORMAT_MINIMUMS: Record<string, Record<string, Record<string, number>>> = {
  A2: {
    single: { bw: 400, color: 500 },
    double: { bw: 750, color: 850 },
  },
  A1: {
    single: { bw: 500, color: 600 },
    double: { bw: 900, color: 1000 },
  },
};

export default function StationeryPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // الحالة العامة
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

  // مصفوفات الأسعار والأحجام من الـ API
  const [pricesList, setPricesList] = useState<PriceItem[]>([]);
  const [services, setServices] = useState<StationeryService[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>(SUPPORTED_PAPER_SIZES);
  const [paperTypes, setPaperTypes] = useState<Record<"document" | "photo", Record<string, string>>>({
    document: { plain: "ورق عادي", coated: "ورق كوشيه", cardstock: "ورق مقوّى" },
    photo: { glossy: "ورق صور لامع", matte: "ورق صور مطفي" },
  });
  const [sizeDimensions, setSizeDimensions] = useState<Record<string, string>>({
    A1: "59.4 × 84.1 cm",
    A2: "42.0 × 59.4 cm",
    A3: "29.7 × 42.0 cm",
    A4: "21.0 × 29.7 cm",
    A5: "14.8 × 21.0 cm",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1";

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
            if (json.data.services) setServices(json.data.services);
            if (json.data.sizes) {
              setAvailableSizes(json.data.sizes.filter((size: string) => SUPPORTED_PAPER_SIZES.includes(size.toUpperCase())));
            }
            if (json.data.size_dimensions) setSizeDimensions(json.data.size_dimensions);
            if (json.data.paper_types) setPaperTypes(json.data.paper_types);
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

  // السعر الأدنى لأول 100 ورقة للمقاسات الكبيرة حسب المقاس والوجه واللون
  const getMinimumLargeFormatTotal = (
    paperSize: string,
    colorType: "bw" | "color",
    sideType: "single" | "double"
  ): number => {
    const size = paperSize.toUpperCase();
    return LARGE_FORMAT_MINIMUMS[size]?.[sideType]?.[colorType] ?? 0;
  };

  // دالة جلب سعر الصفحة بناء على المقاس واللون ونوع الخدمة (ورقة منفردة أو ورقة في ملف)
  // كل الأسعار تُدخل يدوياً من الداشبورد لكل مقاس ونوع ورق، بدون معادلات أو مضاعفات.
  const getPagePrice = (
    serviceType: "document" | "photo",
    paperSize: string,
    paperType: string,
    colorType: "bw" | "color",
    sideType: "single" | "double" = "single",
    orientation: "portrait" | "landscape" = "portrait",
    pagesCount: number = 1
  ): number => {
    const normalizedSize = paperSize.toUpperCase();
    const item = pricesList.find(
      (p) =>
        p.service_type === serviceType &&
        p.paper_size.toUpperCase() === normalizedSize &&
        p.paper_type === paperType &&
        p.side_type === sideType &&
        p.orientation === orientation &&
        p.is_active
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

    return Math.max(0.05, Number(base.toFixed(2)));
  };

  // أقل سعر للورقة المفردة يبدأ به قسم المستندات (من أول ريال)
  const documentSinglePrices = pricesList
    .filter((p) => p.service_type === "document" && p.is_active)
    .map((p) => Number(p.bw_price))
    .filter((price) => Number.isFinite(price) && price > 0);
  const startingDocPrice = documentSinglePrices.length
    ? Math.max(1, Math.min(...documentSinglePrices))
    : 1;

  // حساب تكلفة الطباعة فقط لملف واحد (بدون الخدمات الإضافية)
  const calculatePrintTotal = (file: UploadedFileItem): number => {
    const pricePerPage = getPagePrice(
      file.service_type,
      file.paper_size,
      file.paper_type,
      file.color_type,
      file.side_type,
      file.orientation,
      file.pages_count
    );
    const sheets = file.pages_count * file.copies;
    const normalizedSize = file.paper_size.toUpperCase();
    if (LARGE_PAPER_SIZES.includes(normalizedSize)) {
      const minimumTotal = getMinimumLargeFormatTotal(
        normalizedSize,
        file.color_type,
        file.side_type
      );
      return Number(
        (minimumTotal + Math.max(0, sheets - MIN_LARGE_PAPER_SHEETS) * pricePerPage).toFixed(2)
      );
    }
    return Number((sheets * pricePerPage).toFixed(2));
  };

  // سعر الخدمات الإضافية للملف الواحد — تُحتسب لكل نسخة
  const calculateFileServicesTotal = (file: UploadedFileItem): number => {
    const perCopy = services
      .filter((service) => file.services.includes(service.key))
      .reduce((sum, service) => sum + Number(service.price), 0);
    return Number((perCopy * file.copies).toFixed(2));
  };

  // حساب تكلفة ملف واحد = طباعة + خدمات إضافية
  const calculateFileTotal = (file: UploadedFileItem): number =>
    Number((calculatePrintTotal(file) + calculateFileServicesTotal(file)).toFixed(2));

  // إجمالي السعر لجميع الملفات (الخدمات محسوبة داخل كل ملف)
  const filesTotal = uploadedFiles.reduce(
    (sum, file) => sum + calculateFileTotal(file),
    0
  );

  const servicesTotal = uploadedFiles.reduce(
    (sum, file) => sum + calculateFileServicesTotal(file),
    0
  );

  const grandTotal = filesTotal;

  const totalPagesAll = uploadedFiles.reduce(
    (sum, f) => sum + f.pages_count * f.copies,
    0
  );

  const fileSheets = (file: UploadedFileItem) => file.pages_count * file.copies;
  const filesBelowMinimum = uploadedFiles.filter(
    (file) => LARGE_PAPER_SIZES.includes(file.paper_size.toUpperCase()) && fileSheets(file) < MIN_LARGE_PAPER_SHEETS
  );

  // اختيار / إلغاء خدمة إضافية لملف معين
  const toggleService = (fileId: string, key: string) => {
    setUploadedFiles((prev) =>
      prev.map((item) =>
        item.id === fileId
          ? {
              ...item,
              services: item.services.includes(key)
                ? item.services.filter((serviceKey) => serviceKey !== key)
                : [...item.services, key],
            }
          : item
      )
    );
  };

  // تغيير مقاس الملف: الورق العادي غير متاح للمقاسات الكبيرة A1/A2
  const changeFileSize = (fileId: string, size: string) => {
    const isLarge = LARGE_PAPER_SIZES.includes(size.toUpperCase());
    setUploadedFiles((prev) =>
      prev.map((item) => {
        if (item.id !== fileId) return item;
        let paperType = item.paper_type;
        if (isLarge && paperType === "plain") {
          paperType =
            Object.keys(paperTypes[item.service_type] || {}).find(
              (type) => type !== "plain"
            ) || paperType;
        }
        return { ...item, paper_size: size, paper_type: paperType };
      })
    );
  };

  // دالة مساعدة لتنسيق حجم الملفات (Bytes to KB/MB)
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // حجم كل جزء في الرفع المتقطع (أقل من حد السيرفر 1MB)
  const UPLOAD_CHUNK_SIZE = 512 * 1024;

  const createUploadId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  };

  // دالة رفع ملف واحد على أجزاء مع تتبع نسبة التقدم
  const uploadSingleFileWithProgress = (
    file: File,
    offsetLoaded: number,
    onProgress: (loaded: number) => void
  ): Promise<UploadedFileResponse> => {
    return new Promise((resolve, reject) => {
      const uploadId = createUploadId();
      const totalChunks = Math.max(1, Math.ceil(file.size / UPLOAD_CHUNK_SIZE));
      let chunkIndex = 0;
      let loadedBeforeChunk = offsetLoaded;

      const sendChunk = () => {
        const start = chunkIndex * UPLOAD_CHUNK_SIZE;
        const blob = file.slice(start, Math.min(file.size, start + UPLOAD_CHUNK_SIZE));

        const formData = new FormData();
        formData.append("upload_id", uploadId);
        formData.append("chunk_index", String(chunkIndex));
        formData.append("total_chunks", String(totalChunks));
        formData.append("original_name", file.name);
        formData.append("chunk", blob, file.name);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/stationery/upload-chunk`);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(
              Math.min(loadedBeforeChunk + event.loaded, offsetLoaded + file.size)
            );
          }
        };

        xhr.onload = () => {
          loadedBeforeChunk += blob.size;

          if (xhr.status < 200 || xhr.status >= 300) {
            let message = `فشل رفع الملف (${xhr.status})`;
            if (xhr.status === 413) {
              message = "حجم الملف أكبر من الحد المسموح على السيرفر، يرجى المحاولة ثانية.";
            } else if (xhr.status === 429) {
              message = "تم إرسال عدد كبير من الأجزاء، انتظر دقيقة ثم حاول مرة أخرى.";
            } else {
              try {
                const json = JSON.parse(xhr.responseText) as { message?: string };
                message = json.message || message;
              } catch {
                // ignore
              }
            }
            reject(new Error(message));
            return;
          }

          let json: UploadedFileResponse;
          try {
            json = JSON.parse(xhr.responseText) as UploadedFileResponse;
          } catch {
            reject(new Error("استجابة غير صحيحة من الخادم"));
            return;
          }

          onProgress(loadedBeforeChunk);

          if (chunkIndex === totalChunks - 1) {
            if (!json.status) {
              reject(new Error(json.message || "فشل رفع الملف"));
              return;
            }
            resolve(json);
          } else {
            chunkIndex += 1;
            sendChunk();
          }
        };

        xhr.onerror = () =>
          reject(
            new Error(
              "انقطع الاتصال أثناء رفع الملف. تأكد من الإنترنت ثم حاول مرة أخرى"
            )
          );
        xhr.send(formData);
      };

      sendChunk();
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

        const json = await uploadSingleFileWithProgress(file, cumulativeLoaded, (loaded) => {
          const pct = Math.min(
            99,
            Math.round((loaded / (totalBytesAll || 1)) * 100)
          );
          setUploadProgress(pct);
          setUploadBytesLoaded(loaded);
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
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file_url: json.data.file_url,
            file_path: json.data.file_path,
            file_name: json.data.original_name || file.name,
            extension: json.data.extension,
            is_image: json.data.is_image,
            is_pdf: json.data.is_pdf,
            size_formatted: json.data.size_formatted,
            service_type: "document",
            paper_size: "A4",
            paper_type: Object.keys(paperTypes.document || {})[0] || "plain",
            color_type: "bw",
            orientation: "portrait",
            side_type: "single",
            pages_count: Math.max(1, json.data.pages_count || 1),
            copies: 1,
            services: [],
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

    if (filesBelowMinimum.length > 0) {
      const first = filesBelowMinimum[0];
      toast.error(`المقاس ${first.paper_size} يتطلب حدًا أدنى 100 ورقة.`);
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
          paper_type: f.paper_type,
          color_type: f.color_type,
          orientation: f.orientation,
          side_type: f.side_type,
          pages_count: f.pages_count,
          copies: f.copies,
          services: f.services,
        })),
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
            اطبع مستنداتك وملفاتك بدقة عالية
          </h1>
          <p className="text-slate-300 text-xs md:text-sm max-w-xl mx-auto">
            طباعة رقمية فورية بمقاسات A1 إلى A5 مع استلام من الفرع أو شحن لباب بيتك.
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
                    طباعة المستندات والملفات
                  </h2>

                  <p className="text-slate-500 text-xs md:text-sm">
                    ملفات PDF وورد بأعلى دقة ليزر.
                  </p>

                  <ul className="space-y-1.5 text-xs md:text-sm text-slate-700 font-semibold pt-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pro" />
                      <span>المقاسات: A1 إلى A5 (الافتراضي A4)</span>
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
                        / ورقة
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
                  onClick={() => setIsUploadModalOpen(true)}
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
                const printCost = calculatePrintTotal(file);
                const servicesCost = calculateFileServicesTotal(file);
                const fileCost = calculateFileTotal(file);
                const currentUnitPrice = getPagePrice(
                  file.service_type,
                  file.paper_size,
                  file.paper_type,
                  file.color_type,
                  file.side_type,
                  file.orientation,
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
                        <div className="text-left">
                          <span className="text-base font-extrabold text-[#ff7300]">
                            {fileCost.toFixed(2)} ر.س
                          </span>
                          {servicesCost > 0 && (
                            <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                              طباعة {printCost.toFixed(2)} + خدمات {servicesCost.toFixed(2)}
                            </div>
                          )}
                        </div>
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
                          عدد الورق: {file.pages_count} صفحة × {file.copies} نسخة ={" "}
                          {file.pages_count * file.copies} ورقة
                        </span>
                        {LARGE_PAPER_SIZES.includes(file.paper_size.toUpperCase()) && (
                          <div className="mt-2 text-[11px] font-bold text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                            أول 100 ورقة ={" "}
                            {getMinimumLargeFormatTotal(
                              file.paper_size,
                              file.color_type,
                              file.side_type
                            ).toFixed(2)}{" "}
                            ر.س، وكل ورقة زيادة تُحسب بسعرها من الداشبورد.
                          </div>
                        )}
                        {LARGE_PAPER_SIZES.includes(file.paper_size.toUpperCase()) && fileSheets(file) < MIN_LARGE_PAPER_SHEETS && (
                          <div className="mt-2 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                            المقاس {file.paper_size} يتطلب حدًا أدنى 100 ورقة.
                          </div>
                        )}
                      </div>

                      {/* Control 2: Number of pages (read-only) */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          عدد صفحات الملف:
                        </label>
                        <div className="flex items-center gap-2">
                          <output className="w-full bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 cursor-default">
                            {file.pages_count}
                          </output>
                          <span className="text-xs text-slate-500 whitespace-nowrap">صفحة</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          يتم تحديد عدد الصفحات تلقائياً من الملف
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
                              {getPagePrice(file.service_type, file.paper_size, file.paper_type, "bw", file.side_type, file.orientation, file.pages_count).toFixed(2)} ر.س/ص
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
                              {getPagePrice(file.service_type, file.paper_size, file.paper_type, "color", file.side_type, file.orientation, file.pages_count).toFixed(2)} ر.س/ص
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Control 4: Paper Type */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          نوع الورق:
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(paperTypes[file.service_type] || {})
                            .filter(
                              ([type]) =>
                                !(
                                  LARGE_PAPER_SIZES.includes(
                                    file.paper_size.toUpperCase()
                                  ) && type === "plain"
                                )
                            )
                            .map(([type, label]) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => updateFileOption(file.id, "paper_type", type)}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                                file.paper_type === type
                                  ? "border-[#ff7300] bg-white text-[#ff7300] shadow-xs ring-2 ring-[#ff7300]/10"
                                  : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {LARGE_PAPER_SIZES.includes(file.paper_size.toUpperCase()) && (
                          <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                            الورق العادي غير متاح لمقاسي A1 وA2 — يرجى اختيار الكوشيه أو المقوّى.
                          </p>
                        )}
                      </div>

                      {/* Control 5: Paper Size (A1 to A5) */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 md:col-span-2 lg:col-span-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700">
                            حجم الورقة (Paper Size A1 - A5):
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
                                onClick={() => changeFileSize(file.id, size)}
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

                      {/* Control 6: Print Orientation */}
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

                      {/* Control 7: Print Sides (Single vs Double) */}
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
                    </div>

                    {/* خدمات إضافية خاصة بهذا الملف — تُحتسب لكل نسخة */}
                    {services.length > 0 && (
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h4 className="text-xs md:text-sm font-extrabold text-slate-900">
                              خدمات إضافية لهذا الملف (اختياري)
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              يتم احتساب سعر الخدمة لكل نسخة من هذا الملف.
                            </p>
                          </div>
                          {servicesCost > 0 && (
                            <span className="text-[11px] font-extrabold text-[#ff7300] bg-amber-50 border border-amber-200 rounded-full px-3 py-1 whitespace-nowrap">
                              +{servicesCost.toFixed(2)} ر.س
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {services.map((service) => {
                            const active = file.services.includes(service.key);
                            return (
                              <button
                                key={service.key}
                                type="button"
                                onClick={() => toggleService(file.id, service.key)}
                                className={`p-3 rounded-xl border text-right transition ${
                                  active
                                    ? "border-[#ff7300] bg-amber-50 text-[#ff7300] ring-2 ring-[#ff7300]/10"
                                    : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-extrabold">{service.name}</span>
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? "bg-[#ff7300] border-[#ff7300] text-white" : "border-slate-300"}`}>
                                    {active && <FiCheck className="w-3 h-3" />}
                                  </span>
                                </div>
                                <div className="text-[11px] mt-1 font-bold text-slate-500">
                                  {Number(service.price).toFixed(2)} ر.س × {file.copies} نسخة
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-[11px] md:text-xs text-slate-500 bg-slate-100/70 border border-slate-200 rounded-xl px-3 py-2">
              <FiShield className="w-4 h-4 text-emerald-600" />
              <span>التوصيل داخل الرياض فقط — 20 ر.س لأي مكان. الاستلام من الفرع مجاني.</span>
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
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div className="space-y-3 mb-6">
                    {/* Upload Document Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 rounded-2xl border-2 text-right flex items-center gap-4 transition group border-pro bg-slate-50 hover:border-pro"
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
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>{uploadedFiles.length} مستندات</span>
                <span>•</span>
                <span>{totalPagesAll} صفحة / ورقة</span>
                {servicesTotal > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-[#ff7300] font-bold">
                      خدمات إضافية: {servicesTotal.toFixed(2)} ر.س
                    </span>
                  </>
                )}
                <span className="hidden md:inline">• التوصيل داخل الرياض 20 ر.س أو استلام مجاني</span>
              </div>
            </div>

            {/* Right/End side: Action Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isAddingToCart || filesBelowMinimum.length > 0}
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

