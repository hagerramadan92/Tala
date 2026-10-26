"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";

import CustomSeparator from "@/components/Breadcrumbs";
import ProductGallery from "@/components/ProductGallery";
import InStockSlider from "@/components/InStockSlider";
import ProductCard from "@/components/ProductCard";

import { ProductPageSkeleton } from "@/components/shared/Skeletons/ProductPageSkeleton";
import { ReviewsSkeleton } from "@/components/shared/Skeletons/ReviewsSkeleton";

import { ProductHeader } from "@/components/product/ProductInfo/ProductHeader";
import { ProductDescription } from "@/components/product/ProductInfo/ProductDescription";
import { ShippingInfo } from "@/components/product/ProductInfo/ShippingInfo";
import { ProductSpecs } from "@/components/product/ProductInfo/ProductSpecs";
import { StickerForm } from "@/components/product/StickerForm";
import { Reviews } from "@/components/product/Reviews";
import { BottomBar } from "@/components/product/BottomBar";
import { SelectedOptionsSummary } from "@/components/product/SelectedOptionsSummary";

import { TabKey, SelectedOptions, StickerFormHandle } from "@/Types/product.types";
import { 
  num, 
  computeSizeBaseTotal, 
  buildSelectedOptionsWithPrice, 
  buildIdsPayload,
  validateOptions 
} from "@/utils/productHelpers";

const fadeUp: any = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function ProductPageClient() {
  const { id } = useParams();
  const productId = id as string;

  const { authToken: token, user, userId } = useAuth() as any;
  const currentUserId: number | null = typeof userId === "number" ? userId : user?.id ?? null;

  const { addToCart } = useCart();

  const stickerFormRef = useRef<StickerFormHandle | null>(null);

  const [product, setProduct] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("options");
  const [showValidation, setShowValidation] = useState(false);

  // Design state
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [uploadingDesign, setUploadingDesign] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    size: "اختر",
    size_tier_id: null,
    size_quantity: null,
    size_price_per_unit: null,
    size_total_price: null,
    color: "اختر",
    material: "اختر",
    optionGroups: {},
    optionChildren: {},
    printing_method: "اختر",
    print_locations: [],
    isValid: false,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Related products (server-side pagination)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedLastPage, setRelatedLastPage] = useState(1);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const relatedRequestRef = useRef(0);

  // Reviews state
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [myRating, setMyRating] = useState<number>(5);
  const [myComment, setMyComment] = useState<string>("");
  const [forceUpdate, setForceUpdate] = useState(0);

  const handleForceUpdate = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  // ✅ مراقبة تغييرات selectedOptions
  useEffect(() => {
    console.log("🟡 selectedOptions changed:", {
      flatOptions: selectedOptions.flatOptions,
      flatOptionsTotal: selectedOptions.flatOptionsTotal,
      size_total_price: selectedOptions.size_total_price,
      optionGroups: selectedOptions.optionGroups,
      optionChildren: selectedOptions.optionChildren
    });
  }, [selectedOptions]);

  // Fetch product
  useEffect(() => {
    let mounted = true;

    async function fetchProduct() {
      if (!productId || !API_URL) return;

      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });

        if (!res.ok) throw new Error("not_found");

        const json = await res.json();
        const prod = json?.data ?? null;

        if (!mounted) return;

        setProduct(prod);
        setApiData(json?.data);

        // Seed reviews from product details
        if (Array.isArray(prod?.reviews)) {
          setReviewsData({
            reviews: prod.reviews,
            stats: {
              average_rating: num(prod?.average_rating),
              total_reviews: num(prod?.total_reviews ?? prod?.reviews?.length),
              rating_distribution: {},
            },
            pagination: {
              total: num(prod?.total_reviews ?? prod?.reviews?.length),
              per_page: prod.reviews.length || 10,
              current_page: 1,
              last_page: 1,
            },
            user_review: null,
          });
        }

        const saved = JSON.parse(localStorage.getItem("favorites") || "[]") as number[];
        setIsFavorite(!!prod && saved.includes(prod.id));
      } catch (e: any) {
        if (!mounted) return;
        setErrorMsg(e?.message === "not_found" ? "المنتج غير موجود" : "حدث خطأ أثناء تحميل المنتج");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProduct();
    return () => {
      mounted = false;
    };
  }, [productId, token, API_URL]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (!API_URL || !productId) return;

    setReviewsLoading(true);
    setReviewsError(null);

    try {
      const params = new URLSearchParams();
      params.set("sort_by", "created_at");
      params.set("sort_direction", "desc");
      params.set("page", String(reviewsPage));

      const res = await fetch(`${API_URL}/reviews/product/${productId}?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok || !json.status) throw new Error(json.message || "فشل تحميل التقييمات");

      setReviewsData(json.data);
    } catch (e: any) {
      setReviewsError(e?.message || "حدث خطأ أثناء تحميل التقييمات");
    } finally {
      setReviewsLoading(false);
    }
  }, [API_URL, productId, token, reviewsPage]);

  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviews();
    }
  }, [activeTab, fetchReviews]);

  // جلب المنتجات المشابهة من السيرفر مع Pagination
  const fetchRelatedProducts = useCallback(
    async (nextPage: number) => {
      if (!API_URL || !productId) return;

      const requestId = ++relatedRequestRef.current;
      setRelatedLoading(true);

      try {
        const res = await fetch(
          `${API_URL}/products/${encodeURIComponent(productId)}/related?per_page=12&page=${nextPage}`,
          { headers: { Accept: "application/json" }, cache: "no-store" }
        );
        const json = await res.json();

        if (requestId !== relatedRequestRef.current) return;
        if (!res.ok || !json.status) throw new Error(json.message || "فشل تحميل المنتجات المشابهة");

        const items = json.data?.products || [];

        setRelatedProducts((prev) => {
          if (nextPage === 1) return items;
          const merged = [...prev, ...items];
          return Array.from(new Map(merged.map((p: any) => [p.id, p])).values());
        });
        setRelatedPage(json.data?.pagination?.current_page ?? nextPage);
        setRelatedLastPage(json.data?.pagination?.last_page ?? 1);
      } catch (err: any) {
        if (requestId !== relatedRequestRef.current) return;
        console.error("Error fetching related products:", err);
        if (nextPage === 1) {
          setRelatedProducts([]);
          setRelatedLastPage(1);
        }
      } finally {
        if (requestId === relatedRequestRef.current) setRelatedLoading(false);
      }
    },
    [API_URL, productId]
  );

  useEffect(() => {
    fetchRelatedProducts(1);
  }, [fetchRelatedProducts]);

  const hasOptions = useMemo(() => {
    if (!apiData) return false;

    return (
      Array.isArray(apiData?.sizes) && apiData.sizes.length > 0 ||
      Array.isArray(apiData?.colors) && apiData.colors.length > 0 ||
      Array.isArray(apiData?.materials) && apiData.materials.length > 0 ||
      Array.isArray(apiData?.options) && apiData.options.length > 0 ||
      Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0 ||
      Array.isArray(apiData?.print_locations)
    );
  }, [apiData]);

  const warrantyText = useMemo(() => {
    const w = apiData?.warranty;
    if (!w) return null;

    const months = w?.months;
    if (typeof months === "number" && months > 0) return `${months} أشهر ضمان`;

    const raw = String(w?.display_text || "").trim();
    if (!raw) return null;
    return raw;
  }, [apiData]);

  const getSelectedOptions = async () => {
    if (stickerFormRef.current?.getOptions) {
      const opts = await stickerFormRef.current.getOptions();
      setSelectedOptions(opts);
      return opts;
    }
    return selectedOptions;
  };

  // ✅ حساب سعر المقاس
  const basePrice = useMemo(() => {
    // استخدام size_total_price إذا كان موجوداً
    if (selectedOptions.size_total_price && selectedOptions.size_total_price > 0) {
      console.log("🔢 Using size_total_price:", selectedOptions.size_total_price);
      return selectedOptions.size_total_price;
    }
    
    // وإلا استخدم computeSizeBaseTotal
    const total = computeSizeBaseTotal(selectedOptions);
    console.log("🔢 Base price computed:", total, "from options:", selectedOptions);
    return total > 0 ? total : 0;
  }, [selectedOptions]);

  // ✅ حساب سعر الإضافات (الخيارات)
  const extrasTotal = useMemo(() => {
    if (!apiData) return 0;
    
    // ✅ إذا كان في flatOptions، استخدم flatOptionsTotal مباشرة
    if (selectedOptions.flatOptionsTotal !== undefined && selectedOptions.flatOptionsTotal > 0) {
      console.log("💰 Using flatOptionsTotal:", selectedOptions.flatOptionsTotal);
      return selectedOptions.flatOptionsTotal;
    }
    
    // ✅ إذا كان في flatOptions، احسب المجموع منها
    if (selectedOptions.flatOptions && selectedOptions.flatOptions.length > 0) {
      const total = selectedOptions.flatOptions.reduce((sum, opt) => sum + (opt.price || 0), 0);
      console.log("💰 Extras total from flatOptions array:", total, selectedOptions.flatOptions);
      return total;
    }
    
    // ✅ غير ذلك استخدم الدالة القديمة
    console.log("⚠️ Using old method for extras total");
    const selected = buildSelectedOptionsWithPrice(apiData, selectedOptions);
    const total = selected.reduce((sum, o) => sum + num(o.additional_price), 0);
    console.log("💰 Extras total from old method:", total, selected);
    return total;
  }, [apiData, selectedOptions]);

  // ✅ حساب السعر الإجمالي
  const displayTotal = useMemo(() => {
    const total = basePrice + extrasTotal;
    console.log("💰 Display total:", total, "= base:", basePrice, "+ extras:", extrasTotal);
    console.log("📊 Price breakdown:", {
      basePrice,
      extrasTotal,
      total,
      flatOptions: selectedOptions.flatOptions,
      size_total_price: selectedOptions.size_total_price
    });
    return total > 0 ? total : 0;
  }, [basePrice, extrasTotal, selectedOptions]);

  const currentValidation = validateOptions(selectedOptions, apiData);
  const showMissingBadge = showValidation && hasOptions && !currentValidation.isValid;

  // الكمية المختارة من العميل: أي كمية أكبر من 300 تتحول لمدة الأوفست (10 - 15 يوم).
  // الكمية ممكن تكون من شرائح المقاس (size_quantity) أو من خيار منتج اسمه "الكمية"
  // وقيمته زي "10000 حبة (0.73 ريال / للحبة)".
  const parseSelectedQuantity = (opts: SelectedOptions): number => {
    const direct = Number(opts?.size_quantity || 0);
    if (direct > 0) return direct;

    const candidates: Array<{ name: string; value: string }> = [];
    (opts?.flatOptions || []).forEach((option) => {
      candidates.push({
        name: String(option?.name || ""),
        value: String(option?.value || ""),
      });
    });
    Object.entries(opts?.optionGroups || {}).forEach(([name, value]) => {
      candidates.push({ name: String(name), value: String(value || "") });
    });

    const extract = (regex: RegExp): number => {
      for (const candidate of candidates) {
        if (!regex.test(candidate.name)) continue;
        const match = candidate.value.match(/(\d[\d,]*)/);
        if (!match) continue;
        const quantity = parseInt(match[1].replace(/,/g, ""), 10);
        if (quantity > 0) return quantity;
      }
      return 0;
    };

    return extract(/(كمي|حبات|حبة|qty|quantity)/i) || extract(/(عدد|قطع|sheet)/i);
  };

  const selectedQuantity = parseSelectedQuantity(selectedOptions);
  const largeQuantityThreshold = Number(apiData?.large_quantity_threshold ?? 300);

  const effectiveDeliveryTime = useMemo(() => {
    if (selectedQuantity > largeQuantityThreshold && apiData?.offset_delivery_time) {
      return apiData.offset_delivery_time;
    }
    return apiData?.delivery_time;
  }, [
    selectedQuantity,
    largeQuantityThreshold,
    apiData?.offset_delivery_time,
    apiData?.delivery_time,
  ]);

  const handleAddToCart = async () => {
    setShowValidation(true);

    const opts = await getSelectedOptions();
    console.log("📦 Options to validate:", opts);
    console.log("📦 API Data:", apiData);
    
    const validation = validateOptions(opts, apiData);
    console.log("📦 Validation result:", validation);

    if (!validation.isValid && hasOptions) {
      toast.error(`يرجى اختيار: ${validation.missingOptions.join("، ")}`);
      return;
    }

    if (!token) return toast.error("يجب تسجيل الدخول أولاً");
    if (!API_URL) return toast.error("API غير متوفر");

    if (!product || !product.id) {
      return toast.error("بيانات المنتج غير متوفرة");
    }

    const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
    const idsPayload = buildIdsPayload(apiData, opts);

    const qty = Math.max(1, Number(opts?.size_quantity || 1));

    console.log("📦 IDs Payload:", idsPayload);
    console.log("📦 Selected Options with Price:", selected_options);
    console.log("📦 Flat Options:", opts.flatOptions);
    console.log("📦 Flat Options Total:", opts.flatOptionsTotal);

    const cartData = {
      product_id: product.id,
      quantity: qty,
      ...idsPayload,
      selected_options,
      design_service_id: null,
      is_sample: false,
      note: "",
      image_design: designFile ? "pending" : null,
    };

    console.log("📦 Cart Data being sent:", cartData);

    try {
      const res: any = await addToCart(product.id, cartData);
      console.log("📦 Add to cart response:", res);

      const cartItemId =
        Number(res?.data?.cart_item_id) ||
        Number(res?.data?.id) ||
        Number(res?.cart_item_id) ||
        Number(res?.id) ||
        null;

      if (designFile && cartItemId) {
        setUploadingDesign(true);
        try {
          const fd = new FormData();
          fd.append("image", designFile);
          fd.append("cart_item_id", String(cartItemId));

          const res2 = await fetch(`${API_URL}/cart/upload-image`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: fd,
          });

          const json2 = await res2.json().catch(() => null);
          if (!res2.ok || (json2 && json2.status === false)) {
            throw new Error(json2?.message || "فشل رفع ملف التصميم");
          }
        } catch (e: any) {
          toast.error(e?.message || "حدث خطأ أثناء رفع ملف التصميم");
        } finally {
          setUploadingDesign(false);
        }
      }

      setShowValidation(false);
      toast.success("تمت الإضافة إلى السلة ✅");
    } catch (e: any) {
      console.error("❌ Error adding to cart:", e);
      toast.error(e?.message || "حدث خطأ أثناء إضافة المنتج للسلة");
    }
  };

  const toggleFavorite = async () => {
    if (!token) return toast.error("يجب تسجيل الدخول أولاً");
    if (!product) return;

    const newState = !isFavorite;
    setIsFavorite(newState);

    let saved = JSON.parse(localStorage.getItem("favorites") || "[]") as number[];
    if (newState) {
      if (!saved.includes(product.id)) saved.push(product.id);
    } else {
      saved = saved.filter((pid) => pid !== product.id);
    }
    localStorage.setItem("favorites", JSON.stringify(saved));

    try {
      const res = await fetch(`${API_URL}/favorites/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.status) {
        setIsFavorite(!newState);
        toast.error(data.message || "فشل تحديث المفضلة");
      }
    } catch {
      setIsFavorite(!newState);
      toast.error("حدث خطأ أثناء تحديث المفضلة");
    }
  };

  const submitReview = async () => {
    if (!token) return toast.error("يجب تسجيل الدخول أولاً");
    if (!product) return;

    const comment = myComment.trim();
    if (!comment) return toast.error("اكتب تعليقك أولاً");
    if (myRating < 1 || myRating > 5) return toast.error("التقييم غير صحيح");

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          rating: myRating,
          comment,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.status) throw new Error(json.message || "فشل إرسال التقييم");

      toast.success("تم إرسال تقييمك ✅");
      setReviewsPage(1);
      await fetchReviews();
    } catch (e: any) {
      toast.error(e?.message || "حدث خطأ أثناء إرسال التقييم");
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!token) return toast.error("يجب تسجيل الدخول أولاً");

    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok || !json.status) throw new Error(json.message || "فشل حذف التقييم");

      toast.success("تم حذف التقييم");
      setReviewsPage(1);
      await fetchReviews();
    } catch (e: any) {
      toast.error(e?.message || "حدث خطأ أثناء حذف التقييم");
    }
  };

  if (loading) return <ProductPageSkeleton />;

  if (errorMsg || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="font-extrabold text-slate-900">{errorMsg || "المنتج غير موجود"}</p>
          <button
            onClick={() => location.reload()}
            className="mt-4 w-full md:rounded-2xl rounded-lg bg-slate-900 text-white py-3 font-extrabold hover:opacity-95 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="container pt-8 pb-24" dir="rtl">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-4">
          <CustomSeparator proName={product.name} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Info */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-5 lg:col-span-5">
            <ProductHeader
              name={product.name}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              averageRating={product.average_rating || 0}
              reviews={product.reviews || []}
            />

            <ProductDescription description={product.description} />

            {effectiveDeliveryTime && (
              <ShippingInfo
                deliveryTime={effectiveDeliveryTime}
                warrantyText={warrantyText}
                offers={apiData.offers}
              />
            )}

            <ProductSpecs features={apiData?.features} />

            {/* Tabs */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 border-b border-slate-200">
                <button
                  disabled={!hasOptions}
                  className={[
                    "py-3 font-extrabold transition",
                    activeTab === "options" ? "bg-[#14213d] text-white" : "bg-white text-slate-800",
                    !hasOptions ? "opacity-40 cursor-not-allowed" : "",
                  ].join(" ")}
                  onClick={() => hasOptions && setActiveTab("options")}
                >
                  خيارات المنتج
                </button>

                <button
                  className={[
                    "py-3 font-extrabold transition",
                    activeTab === "reviews" ? "bg-[#14213d] text-white" : "bg-white text-slate-800",
                  ].join(" ")}
                  onClick={() => setActiveTab("reviews")}
                >
                  تقييمات المنتج
                </button>
              </div>

              <div className="m-4">
                {activeTab === "options" && (
                  hasOptions ? (
                    <StickerForm
                      productId={product.id}
                      productData={apiData}
                      ref={stickerFormRef}
                      onOptionsChange={setSelectedOptions}
                      showValidation={showValidation}
                      onDesignFileChange={setDesignFile}
                    />
                  ) : (
                    <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-600 font-bold">
                      لا توجد خيارات لهذا المنتج.
                    </div>
                  )
                )}

                {activeTab === "reviews" && (
                  reviewsLoading ? (
                    <ReviewsSkeleton />
                  ) : (
                    <Reviews
                      reviewsData={reviewsData}
                      loading={reviewsLoading}
                      error={reviewsError}
                      token={token}
                      currentUserId={currentUserId}
                      myRating={myRating}
                      setMyRating={setMyRating}
                      myComment={myComment}
                      setMyComment={setMyComment}
                      currentPage={reviewsPage}
                      lastPage={reviewsData?.pagination?.last_page || 1}
                      onPageChange={setReviewsPage}
                      onSubmitReview={submitReview}
                      onDeleteReview={deleteReview}
                      onRetry={fetchReviews}
                    />
                  )
                )}
              </div>
            </div>

            <SelectedOptionsSummary
              selectedOptions={selectedOptions}
              basePrice={basePrice}
              extrasTotal={extrasTotal}
              displayTotal={displayTotal}
              showMissingBadge={showMissingBadge}
            />
          </motion.div>

          {/* Right: Gallery */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-7">
            <div className="lg:sticky lg:top-[150px]">
              <ProductGallery mainImage={product.image} images={product.images} />
            </div>
          </motion.div>
        </div>

        {/* Similar products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10">
            <div className="mb-6">
              <InStockSlider
                title="منتجات قد تعجبك"
                inStock={relatedProducts}
                CardComponent={(props: any) => (
                  <ProductCard
                    {...props}
                    product={props}
                    classNameHome="hidden"
                    className2="hidden"
                  />
                )}
              />
            </div>

            {relatedPage < relatedLastPage && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchRelatedProducts(relatedPage + 1)}
                  disabled={relatedLoading}
                  className="rounded-xl px-6 py-2.5 text-sm md:text-base font-extrabold border border-pro bg-white text-pro hover:bg-pro hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
                >
                  {relatedLoading ? "جاري تحميل المزيد..." : "تحميل المزيد"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <BottomBar
        key={forceUpdate}
        product={{ ...product, delivery_time: effectiveDeliveryTime }}
        displayTotal={displayTotal}
        showMissingBadge={showMissingBadge}
        uploadingDesign={uploadingDesign}
        onAddToCart={handleAddToCart}
      />

      <div className="h-16" />
    </>
  );
}