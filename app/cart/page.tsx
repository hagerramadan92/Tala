"use client";

import Link from "next/link";
import Image from "next/image";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { BsTrash3 } from "react-icons/bs";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { IoIosCloseCircle } from "react-icons/io";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useCart } from "@/src/context/CartContext";
import CoBon from "@/components/cobon";
import Button from "@mui/material/Button";
import CartSkeleton from "@/components/skeletons/CartSkeleton";
import DesignImage from "@/components/ImageFallback/DesignImage";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Checkbox,
  ListItemText,
  Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import { Save, CheckCircle, Warning, Info, Refresh } from "@mui/icons-material";
import { StickerFormSkeleton } from "../../components/skeletons/HomeSkeletons";
import { useAppContext } from "@/src/context/AppContext";

interface StickerFormProps {
  cartItemId?: number;
  productId: number;
  productData?: any;
  cartItem?: any;
  onOptionsChange?: (cartItemId: number, options: any) => void;
  showValidation?: boolean;
}

type SelectedOpt = {
  option_name: string;
  option_value: string;
  additional_price?: number;
};

function n(v: any) {
  const x =
    typeof v === "string"
      ? Number(v)
      : typeof v === "number"
        ? v
        : Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function money(v: number) {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function safeParseSelectedOptions(raw: any): SelectedOpt[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as SelectedOpt[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SelectedOpt[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function safeParseIds(raw: any): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => n(x)).filter((x) => x > 0);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.map((x) => n(x)).filter((x) => x > 0);
    } catch {
      return raw
        .replace(/\[|\]/g, "")
        .split(",")
        .map((x) => n(String(x).trim()))
        .filter((x) => x > 0);
    }
  }
  return [];
}

function pickBasePrice(p: any) {
  const price = n(p?.price);
  const finalPrice = n(p?.final_price);
  const lowest = n(p?.lowest_price);

  if (p?.has_discount) {
    return finalPrice > 0 ? finalPrice : price > 0 ? price : lowest;
  }

  return price > 0 ? price : finalPrice > 0 ? finalPrice : lowest;
}

/**
 * Extras from selected_options:
 * - By default these are per-unit (multiplied by qty)
 * - BUT "خدمة تصميم" if NOT "لدى تصميم" => one-time fee (not multiplied)
 */
function computeExtrasFromSelectedOptions(item: any, p: any) {
  const selectedOptions = safeParseSelectedOptions(item.selected_options);

  let extrasPerUnit = 0;
  let oneTimeExtras = 0;
  let hasAnyAdditional = false;

  for (const opt of selectedOptions) {
    if (typeof opt?.additional_price !== "undefined") {
      const add = n(opt.additional_price);
      const name = String(opt.option_name || "").trim();
      const val = String(opt.option_value || "").trim();

      // ✅ one-time for design service (any option except "لدى تصميم")
      if (
        (name === "خدمة تصميم" || name === "خدمة التصميم") &&
        val &&
        !val.includes("لدى تصميم") &&
        add > 0
      ) {
        oneTimeExtras += add;
      } else {
        extrasPerUnit += add;
      }
      hasAnyAdditional = true;
    }
  }

  if (hasAnyAdditional) return { extrasPerUnit, oneTimeExtras };

  // fallback: lookup product options
  const productOptions = Array.isArray(p?.options) ? p.options : [];
  for (const sel of selectedOptions) {
    const match = productOptions.find(
      (x: any) =>
        String(x.option_name).trim() === String(sel.option_name).trim() &&
        String(x.option_value).trim() === String(sel.option_value).trim(),
    );

    if (match) {
      const add = n(match.additional_price);
      const name = String(sel.option_name || "").trim();
      const val = String(sel.option_value || "").trim();

      // ✅ one-time for design service (any option except "لدى تصميم")
      if (
        (name === "خدمة تصميم" || name === "خدمة التصميم") &&
        val &&
        !val.includes("لدى تصميم") &&
        add > 0
      ) {
        oneTimeExtras += add;
      } else {
        extrasPerUnit += add;
      }
    }
  }

  return { extrasPerUnit, oneTimeExtras };
}

function computePricing(item: any) {
  const p = item.product || {};
  const selected = safeParseSelectedOptions(item.selected_options);
  const hasDesignImage = !!item.image_design;

  // tier info might still exist (older behavior). keep compatibility
  const tierQty = n(
    selected.find((o) => o.option_name?.includes("كمية المقاس"))?.option_value,
  );
  const tierTotal = n(
    selected.find((o) => o.option_name?.includes("سعر المقاس الإجمالي"))
      ?.option_value,
  );

  const qty = tierQty > 0 ? tierQty : n(item.quantity || 1);

  const apiUnit = n(item.price_per_unit);
  const apiLine = n(item.line_total);

  const base = pickBasePrice(p);

  const { extrasPerUnit, oneTimeExtras } = computeExtrasFromSelectedOptions(
    item,
    p,
  );

  const baseLineFromTier = tierTotal > 0 ? tierTotal : base * qty;
  const lineAfterOptions =
    baseLineFromTier + extrasPerUnit * qty + oneTimeExtras;
  const unitAfterOptions = qty > 0 ? lineAfterOptions / qty : 0;

  const originalBaseUnit = n(p?.price) > 0 ? n(p?.price) : base;
  const discountBaseUnit = n(p?.final_price) > 0 ? n(p?.final_price) : base;

  const showRealProductPrice = {
    discount: !!p?.has_discount,
    unit_after_options: unitAfterOptions,
    original_unit_after_options: originalBaseUnit + extrasPerUnit, // per-unit only (oneTime not shown per unit)
    discount_unit_after_options: discountBaseUnit + extrasPerUnit,
    extras: extrasPerUnit,
    one_time_extras: oneTimeExtras,
    base_used: base,
    tier_qty: tierQty,
    tier_total: tierTotal,
    hasDesignImage,
  };

  const unit = unitAfterOptions > 0 ? unitAfterOptions : apiUnit;
  const line = lineAfterOptions > 0 ? lineAfterOptions : apiLine;

  return { unit, line, showRealProductPrice, effectiveQty: qty };
}

/**
 * ✅ Live pricing from StickerForm draft selections (before saving).
 * - Per-unit extras multiplied by qty
 * - "خدمة تصميم" (not "لدى تصميم") counted ONCE
 */
function computePricingWithDraft(item: any, draft: any) {
  // ✅ إذا كان draft فارغاً أو محفوظاً، استخدم السعر العادي
  // if (!draft || draft._isSaved || draft._hasNoChanges) {
  //     return computePricing(item);
  // }

  const p = item.product || {};
  const qty =
    n(draft?.size_tier_qty) > 0
      ? n(draft?.size_tier_qty)
      : n(item.quantity || 1);

  const base = pickBasePrice(p);
  const tierTotal = n(draft?.size_tier_total);
  const baseLine = tierTotal > 0 ? tierTotal : base * qty;

  let extrasPerUnit = 0;
  let oneTimeExtras = 0;

  // ✅ Handle option groups with children
  const groups = draft?.optionGroups || {};
  const children = draft?.optionChildren || {};

  // ✅ دالة للحصول على سعر الخيار مع children
  const getOptionPrice = (groupName: string, optionValue: string) => {
    const productOptions = Array.isArray(p?.options) ? p.options : [];
    const optionGroup = productOptions.find((o: any) => o.name === groupName);
    if (!optionGroup) return 0;

    const optionItem = optionGroup.items?.find(
      (item: any) => item.value === optionValue,
    );
    if (!optionItem) return 0;

    let totalPrice = n(optionItem.base_price);

    // ✅ إضافة سعر الـ child إذا تم اختياره
    const childKey = `${groupName}::${optionValue}`;
    const childValue = children[childKey];
    if (childValue && childValue !== "اختر") {
      const childItem = optionItem.children?.find(
        (child: any) => child.value === childValue,
      );
      if (childItem) {
        totalPrice += n(childItem.base_price);
      }
    }

    return totalPrice;
  };

  // حساب أسعار الخيارات
  Object.entries(groups).forEach(([groupName, value]) => {
    const v = String(value || "").trim();
    if (!v || v === "اختر") return;

    const price = getOptionPrice(groupName, v);

    // ✅ one-time for design service (any option except "لدى تصميم")
    if (
      (String(groupName).trim() === "خدمة تصميم" ||
        String(groupName).trim() === "خدمة التصميم") &&
      v &&
      !v.includes("لدى تصميم") &&
      price > 0
    ) {
      oneTimeExtras += price;
    } else {
      extrasPerUnit += price;
    }
  });

  // material additional
  const materials = Array.isArray(p?.materials) ? p.materials : [];
  const matName = String(draft?.material || "").trim();
  if (matName && matName !== "اختر") {
    const m = materials.find((x: any) => String(x.name).trim() === matName);
    if (m) extrasPerUnit += n(m.additional_price);
  }

  // color additional
  const colors = Array.isArray(p?.colors) ? p.colors : [];
  const colorName = String(draft?.color || "").trim();
  if (colorName && colorName !== "اختر") {
    const c = colors.find((x: any) => String(x.name).trim() === colorName);
    if (c) extrasPerUnit += n(c.additional_price);
  }

  // printing method additional
  const printingMethods = Array.isArray(p?.printing_methods)
    ? p.printing_methods
    : [];
  const pmName = String(draft?.printing_method || "").trim();
  if (pmName && pmName !== "اختر") {
    const pm = printingMethods.find(
      (x: any) => String(x.name).trim() === pmName,
    );
    if (pm) extrasPerUnit += n(pm.pivot_price ?? pm.base_price);
  }

  // print locations additional
  const printLocations = Array.isArray(p?.print_locations)
    ? p.print_locations
    : [];
  const selectedLocNames: string[] = Array.isArray(draft?.print_locations)
    ? draft.print_locations
    : [];
  for (const locName of selectedLocNames) {
    const loc = printLocations.find(
      (x: any) => String(x.name).trim() === String(locName).trim(),
    );
    if (loc) extrasPerUnit += n(loc.pivot_price ?? loc.additional_price);
  }

  const line = baseLine + extrasPerUnit * qty + oneTimeExtras;
  const unit = qty > 0 ? line / qty : 0;

  const originalBaseUnit = n(p?.price) > 0 ? n(p?.price) : base;
  const discountBaseUnit = n(p?.final_price) > 0 ? n(p?.final_price) : base;

  return {
    unit,
    line,
    effectiveQty: qty,
    showRealProductPrice: {
      discount: !!p?.has_discount,
      unit_after_options: unit,
      original_unit_after_options: originalBaseUnit + extrasPerUnit,
      discount_unit_after_options: discountBaseUnit + extrasPerUnit,
      extras: extrasPerUnit,
      one_time_extras: oneTimeExtras,
      base_used: base,
      tier_qty: n(draft?.size_tier_qty),
      tier_total: n(draft?.size_tier_total),
    },
  };
}

function productNeedsSelection(p: any) {
  return (
    (p?.sizes?.length ?? 0) > 0 ||
    (p?.colors?.length ?? 0) > 0 ||
    (p?.materials?.length ?? 0) > 0 ||
    (p?.options?.length ?? 0) > 0 ||
    (p?.printing_methods?.length ?? 0) > 0 ||
    (p?.print_locations?.length ?? 0) > 0
  );
}

function missingRequiredFields(item: any) {
  const p = item.product || {};
  const selected = safeParseSelectedOptions(item.selected_options);

  const hasSize = (p?.sizes?.length ?? 0) > 0;
  const hasColors = (p?.colors?.length ?? 0) > 0;
  const hasMaterials = (p?.materials?.length ?? 0) > 0;

  const requiredOpts = (Array.isArray(p?.options) ? p.options : []).filter(
    (o: any) => o.is_required,
  );
  const miss: any[] = [];

  if (
    hasSize &&
    !String(item?.size || "").trim() &&
    !selected.some((o) => o.option_name?.includes("المقاس"))
  )
    miss.push("المقاس");
  if (
    hasColors &&
    !String(item?.color?.name || item?.color || "").trim() &&
    !selected.some((o) => o.option_name?.includes("اللون"))
  )
    miss.push("اللون");
  if (
    hasMaterials &&
    !String(item?.material || "").trim() &&
    !selected.some((o) => o.option_name?.includes("الخامة"))
  )
    miss.push("الخامة");

  const requiredNames = Array.from(
    new Set(requiredOpts.map((o: any) => String(o.option_name).trim())),
  );
  for (const name of requiredNames) {
    const ok = selected.some(
      (s) =>
        String(s.option_name).trim() === name && String(s.option_value).trim(),
    );
    if (!ok) miss.push(name);
  }

  if (
    (p?.printing_methods?.length ?? 0) > 0 &&
    !String(item?.printing_method || "").trim() &&
    !selected.some((o) => o.option_name?.includes("طريقة الطباعة"))
  )
    miss.push("طريقة الطباعة");

  const locIds = safeParseIds(item?.print_locations);
  if (
    (p?.print_locations?.length ?? 0) > 0 &&
    locIds.length === 0 &&
    !selected.some((o) => o.option_name?.includes("مكان الطباعة"))
  )
    miss.push("مكان الطباعة");

  const sizeName =
    String(item?.size || "").trim() ||
    selected.find((o) => o.option_name?.includes("المقاس"))?.option_value;
  const sizeObj = sizeName
    ? (p?.sizes || []).find(
        (s: any) => String(s.name).trim() === String(sizeName).trim(),
      )
    : null;
  if (sizeObj?.tiers?.length) {
    if (n(item?.quantity) <= 0) miss.push("كمية المقاس");
  }

  return miss;
}

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    cartCount,
    removeFromCart,
    updateQuantity,
    loading,
    subtotal,
    total,
  } = useCart();
  const [code, setCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponNewTotal, setCouponNewTotal] = useState<number | null>(null);

  const [draftById, setDraftById] = useState<Record<number, any>>({});

  const handleOptionsChange = useCallback((cartItemId: number, opt: any) => {
    setDraftById((prev) => {
      // ✅ إذا كان الخيار يحتوي على علامة _isSaved، احذفه من drafts
      // if (opt && opt._isSaved) {
      //     const newDrafts = { ...prev };
      //     delete newDrafts[cartItemId];
      //     return newDrafts;
      // }

      // ✅ إذا كان الخيار فارغاً أو يحتوي على علامة _hasNoChanges، احذفه
      // if (!opt || opt._hasNoChanges) {
      //     const newDrafts = { ...prev };
      //     delete newDrafts[cartItemId];
      //     return newDrafts;
      // }

      const prevStr = JSON.stringify(prev[cartItemId] ?? null);
      const nextStr = JSON.stringify(opt ?? null);
      if (prevStr === nextStr) return prev;
      return { ...prev, [cartItemId]: opt };
    });
  }, []);

  const computed = useMemo(() => {
    const items = cart.map((it: any) => {
      const id = n(it.cart_item_id || it.id);
      const draft = id ? draftById[id] : null;

      // ✅ **بسّط: استخدم draft إذا كان موجوداً**
      const pr = draft
        ? computePricingWithDraft(it, draft)
        : computePricing(it);

      return {
        ...it,
        _unit: pr.unit,
        _line: pr.line,
        _real: pr.showRealProductPrice,
        _effectiveQty: pr.effectiveQty,
      };
    });

    const localSubtotal = items.reduce(
      (acc: number, it: any) => acc + n(it._line),
      0,
    );
    return { items, localSubtotal };
  }, [cart, draftById]);

  const backendSubtotal = n(subtotal);
  const backendTotal = n(total);

  // ✅ حساب الإجمالي الحالي مع التعديلات المحلية
  const currentTotal = useMemo(() => {
    let total = backendTotal;
    Object.keys(draftById).forEach((cartItemId) => {
      const item = cart.find(
        (it: any) => n(it.cart_item_id || it.id) === Number(cartItemId),
      );
      if (item) {
        const draft = draftById[Number(cartItemId)];
        if (draft) {
          const originalPricing = computePricing(item);
          const newPricing = computePricingWithDraft(item, draft);
          const diff = newPricing.line - originalPricing.line;
          total += diff;
        }
      }
    });
    if (couponDiscount > 0) {
      total -= couponDiscount;
    }
    return Math.max(0, total);
  }, [cart, draftById, backendTotal, couponDiscount]);

  // ✅ Save summary + coupon in localStorage for payment page
  const persistCheckoutSummary = useCallback(() => {
    const shippingFree = true;
    const shippingFee = shippingFree ? 0 : 48;
    const TAX_RATE = 0.15;

    // ✅ حفظ معلومات التصميم في التخزين المؤقت
    const designItems = cart.filter((item: any) => item.image_design);
    if (designItems.length > 0) {
      try {
        sessionStorage.setItem(
          "cart_designs",
          JSON.stringify(
            designItems.map((item: any) => ({
              cartItemId: item.cart_item_id,
              productId: item.product.id,
              designUrl: item.image_design,
              productName: item.product.name,
            })),
          ),
        );
      } catch (err) {
        console.error("Failed to save design info", err);
      }
    }

    const totalAfterCoupon =
      couponNewTotal !== null && couponNewTotal !== undefined
        ? Math.max(0, n(couponNewTotal))
        : Math.max(0, currentTotal - n(couponDiscount));

    const totalWithShipping = totalAfterCoupon + shippingFee;
    const taxAmount = totalWithShipping * (TAX_RATE / (1 + TAX_RATE));
    const totalWithoutTax = totalWithShipping - taxAmount;

    const payload = {
      version: "v1",
      created_at: new Date().toISOString(),
      items_count: cartCount,
      items_length: Array.isArray(cart) ? cart.length : 0,

      // backend totals
      subtotal: backendSubtotal,
      total: backendTotal,

      // coupon
      coupon_discount: n(couponDiscount),
      coupon_name: code,
      coupon_new_total:
        couponNewTotal !== null && couponNewTotal !== undefined
          ? n(couponNewTotal)
          : null,

      // derived totals used in TotalOrder
      shipping_fee: shippingFee,
      tax_rate: TAX_RATE,
      total_after_coupon: totalAfterCoupon,
      total_with_shipping: totalWithShipping,
      tax_amount: taxAmount,
      total_without_tax: totalWithoutTax,

      // ✅ إضافة الإجمالي المحسوب حالياً
      current_total: currentTotal,
    };

    try {
      sessionStorage.setItem("checkout_summary_v1", JSON.stringify(payload));
    } catch {}
  }, [
    backendSubtotal,
    backendTotal,
    couponDiscount,
    couponNewTotal,
    cartCount,
    cart,
    currentTotal,
    code,
  ]);

  // ✅ استعادة معاينات التصميم من localStorage
  useEffect(() => {
    const restoreDesignPreviews = () => {
      const previews: Record<number, string> = {};
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("design_temp_")) {
          const id = parseInt(key.replace("design_temp_", ""));
          const url = localStorage.getItem(key);
          if (url) {
            previews[id] = url;
          }
        }
      });

      if (Object.keys(previews).length > 0) {
        setDraftById((prev) => {
          const updated = { ...prev };
          Object.entries(previews).forEach(([id, url]) => {
            const numId = parseInt(id);
            if (updated[numId]) {
              updated[numId] = { ...updated[numId], existing_design_url: url };
            }
          });
          return updated;
        });
      }
    };

    restoreDesignPreviews();

    // ✅ تنظيف التخزين المؤقت عند الخروج
    return () => {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("design_temp_")) {
          localStorage.removeItem(key);
        }
      });
    };
  }, []);

  useEffect(() => {
    persistCheckoutSummary();
  }, [persistCheckoutSummary]);

  const handleClick = () => {
    let hasMissing = false;
    const errors: string[] = [];

    computed.items.forEach((item: any, idx: number) => {
      const miss = missingRequiredFields(item);
      if (miss.length) {
        hasMissing = true;
        errors.push(
          `• المنتج ${idx + 1}: ${item.product?.name} (${miss.join("، ")})`,
        );
      }
    });

    if (hasMissing) {
      const msg = `
			الرجاء اختيار كل الحقول المطلوبة قبل المتابعة
			المنتجات التي تحتاج إكمال البيانات:
			${errors.join("\n")}
				`;

      Swal.fire({
        icon: "error",
        title: "الحقول غير مكتملة",
        html: msg.replace(/\n/g, "<br/>"),
        confirmButtonText: "حسنًا",
        customClass: {
          popup: "font-sans text-sm",
          confirmButton: "bg-pro text-white font-bold",
        },
      });
      return;
    }

    // ✅ ensure saved before leaving
    persistCheckoutSummary();
    router.push("/payment");
  };

  if (loading) return <CartSkeleton />;

  if (!cart || cart.length === 0) {
    return (
      <div
        className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]"
        dir="rtl"
      >
        <Image
          src="/images/cart2.webp"
          alt="empty cart"
          width={300}
          height={250}
        />
        <h2 className="text-2xl font-bold mb-6 text-gray-700">العربة فارغة</h2>
        <Link
          href="/"
          className="bg-pro text-white py-3 px-8 md:rounded-2xl rounded-lg hover:bg-pro-max transition text-lg font-bold"
        >
          العودة للتسوق
        </Link>
      </div>
    );
  }

  return (
    <div className="container pb-8 !pt-5" dir="rtl">
      <div className="flex items-center gap-2 text-sm mb-2">
        <Link
          href="/"
          aria-label="go to home"
          className="text-pro-max font-bold"
        >
          الرئيسيه
        </Link>
        <MdKeyboardArrowLeft />
        <h6 className="text-gray-600 font-bold">عربة التسوق</h6>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="col-span-1 lg:col-span-2">
          <div className="flex flex-col my-4 bg-transparent overflow-hidden">
            {computed.items.map((item: any) => {
              const miss = missingRequiredFields(item);
              const hasVariants = productNeedsSelection(item.product);

              // NOTE: tier qty may be backend quantity, not selected_options
              const hasTierQty = (() => {
                const p = item.product || {};
                const sizeName = String(item?.size || "").trim();
                const sizeObj = sizeName
                  ? (p?.sizes || []).find(
                      (s: any) => String(s?.name).trim() === sizeName,
                    )
                  : null;
                const hasTiers = !!sizeObj?.tiers?.length;
                return hasTiers && n(item?.quantity) > 0;
              })();

              return (
                <div
                  key={item.cart_item_id}
                  className="p-5 relative border md:rounded-2xl rounded-lg border-slate-200 bg-white shadow-sm mb-4"
                >
                  <div className="relative md:border-0 border-b border-slate-200 pb-4">
                    <div className="md:flex justify-between items-start md:flex-row flex-col gap-3">
                      <div className="flex gap-3 w-full md:w-fit">
                        <div className="w-24 h-20 bg-slate-100 md:rounded-2xl rounded-lg overflow-hidden border border-slate-200">
                          <Link
                            href={`/product/${item.product.slug || item.product.id}`}
                          >
                            <Image
                              src={item.product.image || "/images/not.jpg"}
                              alt={item.product.name}
                              width={96}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                        </div>

                 
                        {(item.image_design ||
                          draftById[item.cart_item_id]
                            ?.existing_design_url) && (
                          <div className="w-24 h-20 bg-slate-100 md:rounded-2xl rounded-lg overflow-hidden border border-slate-200 relative group">
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded z-10">
                               {draftById[item.cart_item_id]?.existing_design_url && !item.image_design
											? "معاينة"
											: "التصميم"}
                            </div>
                            <Image
                                width={220}
                                height={160}
                              src={
                                item.image_design
                              }
                              alt="تصميم المرفوع"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(
                                  "Failed to load design image:",
                                  e,
                                );
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />

                            {/* ✅ إضافة زر لتغيير التصميم */}
                            {/* <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label
                                htmlFor={`design-change-${item.cart_item_id}`}
                                className="text-white text-xs bg-blue-600 px-2 py-1 rounded cursor-pointer hover:bg-blue-700"
                              >
                                تغيير
                              </label>
                              <input
                                type="file"
                                id={`design-change-${item.cart_item_id}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // ✅ تحديث الصورة مباشرة
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      setDraftById((prev) => ({
                                        ...prev,
                                        [item.cart_item_id]: {
                                          ...prev[item.cart_item_id],
                                          existing_design_url: e.target
                                            ?.result as string,
                                          has_new_design_file: true,
                                        },
                                      }));
                                      localStorage.setItem(
                                        `design_temp_${item.cart_item_id}`,
                                        e.target?.result as string,
                                      );
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div> */}
                          </div>
                        )}

                        <div className="flex flex-col justify-between">
                          <div>
                            <h3 className="font-extrabold text-[15px] text-slate-900">
                              {item.product.name}
                            </h3>

                            {hasTierQty && (
                              <p className="text-xs font-extrabold text-slate-600 mt-1">
                                كمية المقاس: {n(item?.quantity)} قطعة
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-extrabold text-slate-900">
                                {money(n(item._unit))}{" "}
                                <span className="text-xs">ريال</span>
                              </span>

                              {item._real?.discount &&
                                n(item._real?.original_unit_after_options) >
                                  n(item._unit) && (
                                  <>
                                    <span className="text-xs font-extrabold text-slate-500 line-through">
                                      {money(
                                        n(
                                          item._real
                                            ?.original_unit_after_options,
                                        ),
                                      )}{" "}
                                      ريال
                                    </span>
                                    <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      خصم
                                    </span>
                                  </>
                                )}
                            </div>

                            {(item.image_design ||
                              draftById[item.cart_item_id]
                                ?.existing_design_url) && (
                              <div className="mt-2">
                                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                                  ✓{" "}
                                  {draftById[item.cart_item_id]
                                    ?.existing_design_url && !item.image_design
                                    ? "معاينة التصميم"
                                    : "تم رفع التصميم"}
                                </span>
                              </div>
                            )}

                            {/* ✅ عرض الأسعار الإضافية لكل خيار */}
                            <div className="mt-2 text-xs text-gray-600">
                              {/* {item._real?.extras > 0 && (
																<div className="mb-1">
																	<span>الإضافات: +{money(n(item._real?.extras))} ريال (لكل قطعة)</span>
																</div>
															)} */}
                              {item._real?.one_time_extras > 0 && (
                                <div>
                                  <span>
                                    رسوم تصميم: +
                                    {money(n(item._real?.one_time_extras))} ريال
                                    (مرة واحدة)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex max-md:mt-6 max-md:justify-end items-center gap-2">
                        <div
                          className={`flex items-center gap-3 border border-slate-200 md:rounded-2xl rounded-lg overflow-hidden ${hasTierQty ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <button
                            onClick={() => {
                              // ✅ تعديل: تغيير الحد الأقصى من 10 إلى 1000
                              if (item.quantity >= 1000) {
                                toast.error(
                                  "الحد الأقصى 1000 قطعة فقط لهذا المنتج",
                                  { icon: "معلومة", duration: 4000 },
                                );
                              } else {
                                updateQuantity(
                                  item.cart_item_id,
                                  item.quantity + 1,
                                );
                              }
                            }}
                            className="w-10 h-9 text-slate-600 cursor-pointer border-slate-200 border-l transition flex items-center justify-center hover:bg-slate-50"
                          >
                            <FaPlus size={16} />
                          </button>

                          <span className="font-extrabold w-6 text-lg text-center bg-white text-slate-900">
                            {item._effectiveQty}
                          </span>

                          <button
                            onClick={() => {
                              if (item.quantity <= 1)
                                removeFromCart(item.cart_item_id);
                              else
                                updateQuantity(
                                  item.cart_item_id,
                                  item.quantity - 1,
                                );
                            }}
                            className="w-10 h-9 border-slate-200 border-r cursor-pointer transition flex items-center justify-center hover:bg-slate-50"
                          >
                            {item.quantity <= 1 ? (
                              <BsTrash3 className="text-rose-600" size={16} />
                            ) : (
                              <FaMinus className="text-slate-600" size={14} />
                            )}
                          </button>
                        </div>

                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "هل أنت متأكد؟",
                              text: "سيتم حذف هذا المنتج من السلة نهائيًا!",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "نعم، احذفه",
                              cancelButtonText: "لا، ألغِ الأمر",
                              reverseButtons: true,
                              customClass: {
                                popup: "animate__animated animate__fadeInDown",
                                confirmButton: "font-bold",
                                cancelButton: "font-bold",
                              },
                            });

                            if (result.isConfirmed)
                              await removeFromCart(item.cart_item_id);
                          }}
                          className="cursor-pointer md:relative"
                          aria-label="remove"
                        >
                          <IoIosCloseCircle
                            className="text-rose-500"
                            size={40}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {hasVariants && miss.length > 0 && (
                    <div className="mt-4 md:rounded-2xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="font-extrabold text-amber-800">
                        لازم تختار:{" "}
                        <span className="text-amber-900">
                          {miss.join("، ")}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-amber-700 mt-1">
                        السعر بيتغير حسب الاختيارات — اختياراتك هنا هتنعكس فورًا
                        على السعر.
                      </p>
                    </div>
                  )}

                  {hasVariants && (
                    <div className="mt-4 md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <StickerForm
                        cartItemId={item.cart_item_id}
                        productId={item.product.id}
                        productData={item.product}
                        cartItem={item}
                        onOptionsChange={handleOptionsChange}
                      />
                    </div>
                  )}

                  {/* ✅ عرض السعر الإجمالي لهذا المنتج */}
                  {/* <div className="mt-4 pt-3 border-t border-slate-100">
										<div className="flex items-center justify-between">
											<span className="text-sm font-bold text-slate-700">الإجمالي لهذا المنتج:</span>
											<span className="text-lg font-extrabold text-slate-900">
												{money(n(item.formattedGrandTotal))} <span className="text-sm">ريال</span>
											</span>
										</div>
									</div> */}
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-1 ">
          <div className="border lg:sticky lg:top-[150px] h-fit border-slate-200 md:rounded-2xl rounded-lg p-6 mt-4 bg-white shadow-sm">
            <CoBon
              code={code}
              setCode={setCode}
              onApplied={(res: any) => {
                const disc = Number(res?.data?.discount_amount || 0);
                const nt = res?.data?.new_total;
                setCouponDiscount(disc > 0 ? disc : 0);
                setCouponNewTotal(
                  nt !== undefined && nt !== null ? Number(nt) : null,
                );
              }}
              onCleared={() => {
                setCouponDiscount(0);
                setCouponNewTotal(null);
              }}
              onError={() => {
                setCouponDiscount(0);
                setCouponNewTotal(null);
              }}
            />

            <h4 className="text-md font-extrabold text-pro my-5">ملخص الطلب</h4>

            <TotalOrder
              items_count={cartCount}
              subtotal={backendSubtotal}
              total={currentTotal} // <-- التغيير الأهم هنا: استخدام currentTotal بدلاً من backendTotal
              items={cart}
              couponDiscount={couponDiscount}
              couponNewTotal={couponNewTotal}
              hasUnsavedChanges={Object.keys(draftById).length > 0}
              unsavedChangesCount={Object.keys(draftById).length}
              originalTotal={backendTotal}
            />
            <Button
              variant="contained"
              onClick={handleClick}
              fullWidth
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold",
                backgroundColor: "#14213d",
                "&:hover": { backgroundColor: "#0f1a31" },
                borderRadius: "14px",
                textTransform: "none",
              }}
              endIcon={<KeyboardBackspaceIcon className="mx-2" />}
            >
              تابع عملية الشراء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
// أضف هذه الدالة في بداية ملف cart/page.tsx (قبل StickerForm)
function getSocialValue(socialMedia: any, key: "whatsapp" | "email") {
  const arr = Array.isArray(socialMedia) ? socialMedia : [];
  const item = arr.find((x: any) => String(x?.key).toLowerCase() === key);
  const value = String(item?.value || "").trim();
  return value || null;
}
// أضف هذه الدالة في بداية ملف cart/page.tsx (قبل StickerForm)
// أضف هذه الدالة في بداية ملف cart/page.tsx (قبل StickerForm)
async function uploadDesignImage(file: File, cartItemId?: number): Promise<string | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // إضافة cart_item_id إذا كان موجوداً
    if (cartItemId) {
      formData.append('cart_item_id', String(cartItemId));
    }

    const response = await fetch('https://dashboard.talaaljazeera.com/api/v1/cart/upload-image', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    // محاولة تحليل الاستجابة كـ JSON
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('خطأ في تحليل استجابة الـ API:', parseError);
      throw new Error('استجابة غير صالحة من الخادم');
    }

    // التحقق من نجاح الطلب
    if (!response.ok) {
      // التحقق من وجود رسالة خطأ في الاستجابة
      const errorMessage = responseData?.message || responseData?.error || 'فشل رفع الصورة';
      throw new Error(errorMessage);
    }

    // التحقق من حالة الـ API (بعض الـ APIs ترجع status: false حتى مع 200 OK)
    if (responseData && responseData.status === false) {
      throw new Error(responseData.message || 'فشل رفع الصورة');
    }

    // محاولة الحصول على رابط الصورة من مسارات مختلفة حسب استجابة الـ API
    const imageUrl = 
      responseData?.url || 
      responseData?.image_url || 
      responseData?.path || 
      responseData?.data?.url ||
      responseData?.data?.image_url ||
      responseData?.data?.path ||
      null;

    if (!imageUrl) {
      console.warn('تم رفع الصورة ولكن لم يتم العثور على رابط الصورة في الاستجابة:', responseData);
      // قد يكون الـ API يرجع بيانات مختلفة، يمكن إرجاع null أو محاولة استخراج الرابط بطريقة أخرى
    }

    return imageUrl;

  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
    // إعادة رمي الخطأ ليتم معالجته في المستوى الأعلى
    throw error;
  }
}
const StickerForm = forwardRef(function StickerForm(
  {
    cartItemId,
    productId,
    productData,
    cartItem,
    onOptionsChange,
    showValidation = false,
  }: StickerFormProps,
  ref,
) {
  const { updateCartItem, updateQuantity, refreshCart } = useCart();
  // ✅ إضافة useAppContext للحصول على socialMedia
  const { socialMedia } = useAppContext() as any;
  
  const [size, setSize] = useState("اختر");
  const [color, setColor] = useState("اختر");
  const [material, setMaterial] = useState("اختر");

  const [optionGroups, setOptionGroups] = useState<Record<string, string>>({});
  const [optionChildren, setOptionChildren] = useState<Record<string, string>>({});
  const [printingMethod, setPrintingMethod] = useState("اختر");
  const [printLocations, setPrintLocations] = useState<string[]>([]);

  const [sizeTierId, setSizeTierId] = useState<number | null>(null);
  const [sizeTierQty, setSizeTierQty] = useState<number | null>(null);
  const [sizeTierUnit, setSizeTierUnit] = useState<number | null>(null);
  const [sizeTierTotal, setSizeTierTotal] = useState<number | null>(null);

  const [apiData, setApiData] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);

  const [existingDesignUrl, setExistingDesignUrl] = useState<string | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);

  // ✅ إضافة designSendMethod
  const [designSendMethod, setDesignSendMethod] = useState<"whatsapp" | "email" | "upload" | null>(null);

  // ✅ إضافة whatsapp و email من socialMedia
  const whatsappFromSocial = getSocialValue(socialMedia, "whatsapp");
  const emailFromSocial = getSocialValue(socialMedia, "email");

  const waText = encodeURIComponent(`مرحباً، لدي تصميم للمنتج رقم ${productId}${cartItemId ? ` - عنصر سلة: ${cartItemId}` : ""}`);

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

  const emailHref = useMemo(() => {
    if (!emailFromSocial) return null;
    return `mailto:${emailFromSocial}?subject=${encodeURIComponent("ملف تصميم")}&body=${encodeURIComponent(
      `لدي تصميم للمنتج رقم ${productId}${cartItemId ? ` - عنصر سلة: ${cartItemId}` : ""}`
    )}`;
  }, [emailFromSocial, productId, cartItemId]);

  // ✅ استخراج القيم من cartItem
  const cartSelectedOptionsRaw = cartItem?.selected_options;
  const cartSizeRaw = cartItem?.size;
  const cartColorRaw = cartItem?.color?.name || cartItem?.color;
  const cartMaterialRaw = cartItem?.material;
  const cartMaterialIdRaw = cartItem?.material_id;
  const cartPrintingRaw = cartItem?.printing_method;
  const cartPrintLocationsRaw = cartItem?.print_locations;
  const cartQuantityRaw = cartItem?.quantity;
  const cartImageDesignRaw = cartItem?.image_design;

  const groupedOptions = useMemo(() => {
    const list = Array.isArray(apiData?.options) ? apiData.options : [];
    const out: Record<string, any[]> = {};

    list.forEach((o: any) => {
      const k = String(o.name || "").trim();
      if (!k) return;
      out[k] = o.items || [];
    });

    return out;
  }, [apiData]);

  // ✅ دالة للحصول على children لخيار محدد
  const getChildrenForOption = useCallback(
    (groupName: string, optionValue: string) => {
      if (!apiData || !apiData.options) return [];

      const optionGroup = apiData.options.find(
        (o: any) => o.name === groupName,
      );
      if (!optionGroup) return [];

      const optionItem = optionGroup.items?.find(
        (item: any) => item.value === optionValue,
      );
      if (!optionItem) return [];

      return optionItem.children || [];
    },
    [apiData],
  );

  const requiredOptionGroups = useMemo(() => {
    const required: string[] = [];
    Object.keys(groupedOptions).forEach((k) => {
      const items = groupedOptions[k] || [];
      if (items.some((x: any) => Boolean(x?.is_required))) required.push(k);
    });
    return required;
  }, [groupedOptions]);

  const selectedSizeObj = useMemo(() => {
    return (
      (apiData?.sizes || []).find(
        (s: any) => String(s?.name).trim() === String(size).trim(),
      ) || null
    );
  }, [apiData, size]);

  const sizeTiers = useMemo(() => {
    const tiers = selectedSizeObj?.tiers;
    return Array.isArray(tiers) ? tiers : [];
  }, [selectedSizeObj]);

  const needSizeTier = useMemo(() => {
    return (
      (apiData?.sizes?.length ?? 0) > 0 &&
      size !== "اختر" &&
      sizeTiers.length > 0
    );
  }, [apiData, size, sizeTiers]);

  const validateCurrentOptions = useCallback(() => {
    if (!apiData) return false;

    let isValid = true;

    if (apiData.sizes?.length > 0 && (!size || size === "اختر"))
      isValid = false;
    if (apiData.colors?.length > 0 && (!color || color === "اختر"))
      isValid = false;
    if (apiData.materials?.length > 0 && (!material || material === "اختر"))
      isValid = false;

    if (Array.isArray(apiData?.options) && apiData.options.length > 0) {
      requiredOptionGroups.forEach((g) => {
        const v = optionGroups?.[g];
        if (!v || v === "اختر") isValid = false;

        // ✅ التحقق من children إذا كانت مطلوبة
        const children = getChildrenForOption(g, v);
        if (children && children.length > 0) {
          const childKey = `${g}::${v}`;
          const childValue = optionChildren?.[childKey];
          if (!childValue || childValue === "اختر") {
            isValid = false;
          }
        }
      });
    }

    if (
      Array.isArray(apiData?.printing_methods) &&
      apiData.printing_methods.length > 0
    ) {
      if (!printingMethod || printingMethod === "اختر") isValid = false;
    }

    if (
      Array.isArray(apiData?.print_locations) &&
      apiData.print_locations.length > 0
    ) {
      if (!Array.isArray(printLocations) || printLocations.length === 0)
        isValid = false;
    }

    if (needSizeTier && !sizeTierId) isValid = false;

    return isValid;
  }, [
    apiData,
    size,
    color,
    material,
    optionGroups,
    optionChildren,
    requiredOptionGroups,
    getChildrenForOption,
    printingMethod,
    printLocations,
    needSizeTier,
    sizeTierId,
  ]);

  useImperativeHandle(ref, () => ({
    getOptions: () => ({
      size,
      color,
      material,
      optionGroups,
      optionChildren,
      printing_method: printingMethod,
      print_locations: printLocations,
      size_tier_id: sizeTierId,
      size_tier_qty: sizeTierQty,
      size_tier_unit: sizeTierUnit,
      size_tier_total: sizeTierTotal,
      existing_design_url: existingDesignUrl,
      has_new_design_file: !!designFile,
      design_send_method: designSendMethod,
      isValid: validateCurrentOptions(),
    }),
    validate: () => validateCurrentOptions(),
  }));

  // ✅ تحديث cartItem عند تغيير draft
  useEffect(() => {
    if (!cartItemId || !onOptionsChange) return;
    
    // تحديث draft بالقيم الحالية
    onOptionsChange(cartItemId, {
      size,
      color,
      material,
      optionGroups,
      optionChildren,
      printing_method: printingMethod,
      print_locations: printLocations,
      size_tier_id: sizeTierId,
      size_tier_qty: sizeTierQty,
      size_tier_unit: sizeTierUnit,
      size_tier_total: sizeTierTotal,
      existing_design_url: existingDesignUrl,
      has_new_design_file: !!designFile,
      design_send_method: designSendMethod,
      isValid: validateCurrentOptions(),
    });
  }, [
    cartItemId,
    size,
    color,
    material,
    optionGroups,
    optionChildren,
    printingMethod,
    printLocations,
    sizeTierId,
    sizeTierQty,
    sizeTierUnit,
    sizeTierTotal,
    existingDesignUrl,
    designFile,
    designSendMethod,
    validateCurrentOptions,
    onOptionsChange,
  ]);

  // ✅ Prefill (stable deps) - معدل ليدعم الـ children بشكل صحيح
  useEffect(() => {
    setApiError(null);
    setFormLoading(true);

    try {
      if (!productData) throw new Error("لا توجد بيانات للمنتج");
      setApiData(productData);

      let out: Record<string, string> = {};
      let childrenOut: Record<string, string> = {};

      // ✅ تهيئة جميع المجموعات بـ "اختر"
      if (Array.isArray(productData?.options)) {
        productData.options.forEach((o: any) => {
          const k = String(o.name || "").trim();
          if (!k) return;
          out[k] = "اختر";
        });
      }

      const selected = safeParseSelectedOptions(cartSelectedOptionsRaw);

      const cartSize = String(cartSizeRaw || "").trim();
      const cartColor = String(cartColorRaw || "").trim();

      // ✅ **FIX: استرجاع طريقة الطباعة بشكل صحيح**
      let cartPrinting = "";

      // المحاولة الأولى: من cartItem.printing_method
      if (cartPrintingRaw) {
        cartPrinting = String(cartPrintingRaw).trim();
      }

      // المحاولة الثانية: من selected_options
      if (!cartPrinting) {
        const printingFromSel = selected.find(
          (o) =>
            String(o.option_name).trim() === "طريقة الطباعة" ||
            String(o.option_name).toLowerCase().includes("طريقة"),
        );
        if (printingFromSel) {
          cartPrinting = String(printingFromSel.option_value).trim();
        }
      }

      // المحاولة الثالثة: من productData.printing_methods إذا كان هناك واحد فقط
      if (
        !cartPrinting &&
        Array.isArray(productData?.printing_methods) &&
        productData.printing_methods.length === 1
      ) {
        cartPrinting = String(
          productData.printing_methods[0]?.name || "",
        ).trim();
      }

      // ✅ material: from material value OR material_id mapping (FIX #2)
      let cartMaterial = String(cartMaterialRaw?.name || "").trim();
      if (!cartMaterial) {
        const mid = n(cartMaterialIdRaw);
        if (mid > 0 && Array.isArray(productData?.materials)) {
          const matObj = productData.materials.find(
            (m: any) => n(m?.id) === mid,
          );
          if (matObj?.name) cartMaterial = String(matObj.name).trim();
        }
      }

      const sizeFromSel = selected.find(
        (o) => String(o.option_name).trim() === "المقاس",
      )?.option_value;
      const colorFromSel = selected.find(
        (o) => String(o.option_name).trim() === "اللون",
      )?.option_value;
      const materialFromSel = selected.find(
        (o) => String(o.option_name).trim() === "الخامة",
      )?.option_value;

      setSize(cartSize || (sizeFromSel ? String(sizeFromSel).trim() : "اختر"));
      setColor(
        cartColor || (colorFromSel ? String(colorFromSel).trim() : "اختر"),
      );
      setMaterial(
        cartMaterial ||
          (materialFromSel ? String(materialFromSel).trim() : "اختر"),
      );
      setPrintingMethod(cartPrinting || "اختر");

      const tierQtyFromSel = selected.find(
        (o) => String(o.option_name).trim() === "كمية المقاس",
      )?.option_value;
      const tierTotalFromSel = selected.find(
        (o) => String(o.option_name).trim() === "سعر المقاس الإجمالي",
      )?.option_value;

      const qFromCart = n(cartQuantityRaw);
      setSizeTierQty(
        tierQtyFromSel ? n(tierQtyFromSel) : qFromCart > 0 ? qFromCart : null,
      );
      setSizeTierTotal(tierTotalFromSel ? n(tierTotalFromSel) : null);

      // print locations: ids -> names
      const locIds = safeParseIds(cartPrintLocationsRaw);
      const locList = Array.isArray(productData?.print_locations)
        ? productData.print_locations
        : [];
      const namesByIds = locIds
        .map((id) => locList.find((x: any) => n(x?.id) === n(id))?.name)
        .filter(Boolean)
        .map((x: any) => String(x).trim());

      setPrintLocations(Array.from(new Set(namesByIds)));

      // ✅ **FIXED: استرجاع الـ children من selected_options بشكل صحيح**
      selected.forEach((opt) => {
        const name = String(opt.option_name || "").trim();
        const value = String(opt.option_value || "").trim();
        if (!name || !value) return;

        // ✅ البحث في المجموعات للعثور على المجموعة الأصلية
        if (Array.isArray(productData?.options)) {
          for (const group of productData.options) {
            const groupName = String(group.name || "").trim();

            // ✅ المحاولة الأولى: البحث في الـ items الرئيسية
            for (const item of group.items || []) {
              const itemValue = String(item.value || "").trim();

              // إذا تطابقت القيمة مع item رئيسي
              if (value === itemValue) {
                out[groupName] = value;

                // ✅ البحث عن children لهذا الـ item في الـ selected_options
                // نبحث عن خيارات children التي قد تكون مخزنة بشكل منفصل
                if (item.children && item.children.length > 0) {
                  // نبحث في الـ selected_options عن child يحمل نفس الاسم أو اسم مشتق
                  for (const childOpt of selected) {
                    const childName = String(childOpt.option_name || "").trim();
                    const childValue = String(
                      childOpt.option_value || "",
                    ).trim();

                    // التحقق إذا كان هذا child للـ item الحالي
                    const childItem = item.children.find(
                      (c: any) =>
                        c.value === childValue ||
                        String(c.name).trim() === childName,
                    );

                    if (childItem) {
                      const childKey = `${groupName}::${value}`;
                      childrenOut[childKey] = childValue;
                      break;
                    }
                  }
                }
                break;
              }
            }

            // ✅ المحاولة الثانية: التحقق إذا كان الاسم يتطابق مع اسم المجموعة مباشرة
            if (name === groupName) {
              out[groupName] = value;

              // البحث عن child لهذه المجموعة
              const item = group.items?.find((i: any) => i.value === value);
              if (item?.children && item.children.length > 0) {
                // البحث عن child في الـ selected_options
                for (const childOpt of selected) {
                  const childName = String(childOpt.option_name || "").trim();
                  const childValue = String(childOpt.option_value || "").trim();

                  // التحقق إذا كان هذا child للـ item الحالي
                  const childItem = item.children.find(
                    (c: any) =>
                      c.value === childValue ||
                      String(c.name).trim() === childName,
                  );

                  if (childItem) {
                    const childKey = `${groupName}::${value}`;
                    childrenOut[childKey] = childValue;
                    break;
                  }
                }
              }
            }
          }
        }
      });

      // ✅ design existing image
      const imgDesign = cartImageDesignRaw ? String(cartImageDesignRaw) : null;
      setExistingDesignUrl(imgDesign || null);

      // if backend already has design image => default delivery upload
      setDesignSendMethod("upload");

      if (
        imgDesign &&
        Object.prototype.hasOwnProperty.call(out, "خدمة تصميم")
      ) {
        out["خدمة تصميم"] = "لدى تصميم";
      }

      setOptionGroups(out);
      setOptionChildren(childrenOut);

      // reset local file (but keep server image)
      setDesignFile(null);
      if (designPreview) URL.revokeObjectURL(designPreview);
      setDesignPreview(null);

      setHasUnsavedChanges(false);
      setShowSaveButton(false);
      setSavedSuccessfully(false);
    } catch (err: any) {
      console.error("❌ خطأ في تحميل الخيارات:", err);
      setApiError(err?.message || "حدث خطأ أثناء تحميل الخيارات");
      setApiData(null);
    } finally {
      setFormLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productData,
    cartItemId,
    // ✅ إضافة هذه المتغيرات المستخرجة من cartItem
    cartSelectedOptionsRaw,
    cartSizeRaw,
    cartColorRaw,
    cartMaterialRaw,
    cartMaterialIdRaw,
    cartPrintingRaw,
    cartPrintLocationsRaw,
    cartQuantityRaw,
    cartImageDesignRaw,
  ]);

  // ✅ restore tier meta (id/unit/total) from qty when tiers exist
  useEffect(() => {
    if (!needSizeTier) {
      setSizeTierId(null);
      setSizeTierUnit(null);
      return;
    }

    if (sizeTierQty) {
      const found = sizeTiers.find(
        (t: any) => n(t.quantity) === n(sizeTierQty),
      );
      if (found) {
        const backendTotal = n(found.total_price);
        const computedTotal = n(found.quantity) * n(found.price_per_unit);

        setSizeTierId(n(found.id));
        setSizeTierUnit(n(found.price_per_unit));
        setSizeTierTotal(backendTotal > 0 ? backendTotal : computedTotal);
      } else {
        setSizeTierId(null);
      }
    }
  }, [needSizeTier, sizeTiers, sizeTierQty]);

  useEffect(() => {
    return () => {
      if (designPreview) URL.revokeObjectURL(designPreview);
    };
  }, [designPreview]);

  const resetAllOptions = () => {
    setSize("اختر");
    setColor("اختر");
    setMaterial("اختر");

    const resetGroups: Record<string, string> = {};
    Object.keys(groupedOptions).forEach((g) => (resetGroups[g] = "اختر"));
    setOptionGroups(resetGroups);
    setOptionChildren({});

    setPrintingMethod("اختر");
    setPrintLocations([]);

    setSizeTierId(null);
    setSizeTierQty(null);
    setSizeTierUnit(null);
    setSizeTierTotal(null);

    // design reset
    setExistingDesignUrl(null);
    setDesignFile(null);
    if (designPreview) URL.revokeObjectURL(designPreview);
    setDesignPreview(null);
    setDesignSendMethod("upload");

    setHasUnsavedChanges(true);
    setShowSaveButton(true);
    setSavedSuccessfully(false);
  };

  const markDirty = () => {
    setShowSaveButton(true);
    setHasUnsavedChanges(true);
    setSavedSuccessfully(false);
  };

  const handleOptionChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    markDirty();
  };

  const handleSizeChange = (value: string) => {
    handleOptionChange(setSize, value);
    setSizeTierId(null);
    setSizeTierQty(null);
    setSizeTierUnit(null);
    setSizeTierTotal(null);
  };

  const handleTierChange = (tierIdStr: string) => {
    if (!tierIdStr || tierIdStr === "اختر") {
      setSizeTierId(null);
      setSizeTierQty(null);
      setSizeTierUnit(null);
      setSizeTierTotal(null);
      return;
    }

    const tierId = Number(tierIdStr);
    const tier = sizeTiers.find((t: any) => n(t?.id) === tierId) || null;

    if (!tier) {
      setSizeTierId(null);
      setSizeTierQty(null);
      setSizeTierUnit(null);
      setSizeTierTotal(null);
      return;
    }

    const qty = n(tier.quantity);
    const unit = n(tier.price_per_unit);
    const backendTotal = n(tier.total_price);
    const computedTotal = qty > 0 && unit > 0 ? qty * unit : 0;
    const finalTotal = backendTotal > 0 ? backendTotal : computedTotal;

    setSizeTierId(n(tier.id));
    setSizeTierQty(qty > 0 ? qty : null);
    setSizeTierUnit(unit > 0 ? unit : null);
    setSizeTierTotal(finalTotal > 0 ? finalTotal : null);

    markDirty();
  };

  // ✅ دالة لمعالجة تغيير الخيار الرئيسي
  const handleGroupChange = (groupName: string, value: string) => {
    const oldValue = optionGroups[groupName];

    // تحديث الخيار الرئيسي
    setOptionGroups((prev) => ({ ...prev, [groupName]: value }));

    // ✅ مسح children القديم لهذا الخيار
    if (oldValue && oldValue !== value) {
      const oldChildKey = `${groupName}::${oldValue}`;
      if (optionChildren[oldChildKey]) {
        setOptionChildren((prev) => {
          const newChildren = { ...prev };
          delete newChildren[oldChildKey];
          return newChildren;
        });
      }
    }

    // ✅ إذا كان الخيار الجديد يحتوي على children، نضيف خانة اختيار لهم
    const newChildren = getChildrenForOption(groupName, value);
    if (newChildren && newChildren.length > 0) {
      const newChildKey = `${groupName}::${value}`;
      setOptionChildren((prev) => ({
        ...prev,
        [newChildKey]: optionChildren[newChildKey] || "اختر",
      }));
    } else {
      // ✅ إذا لم يكن هناك children، نزيل الخيار إذا كان موجودًا
      const newChildKey = `${groupName}::${value}`;
      if (optionChildren[newChildKey]) {
        setOptionChildren((prev) => {
          const newChildren = { ...prev };
          delete newChildren[newChildKey];
          return newChildren;
        });
      }
    }

    markDirty();

    // ✅ design toggles
    if (
      String(groupName).trim() === "خدمة تصميم" ||
      String(groupName).trim() === "خدمة التصميم"
    ) {
      const v = String(value || "");
      // ✅ **FIX: عند اختيار "رفع تصميم خاص" نعرض قسم التصميم**
      if (
        v.includes("تصميم خاص") ||
        v.includes("رفع تصميم خاص") ||
        v.includes("لدى تصميم")
      ) {
        setDesignSendMethod("upload");
      } else {
        setDesignFile(null);
        if (designPreview) URL.revokeObjectURL(designPreview);
        setDesignPreview(null);
        setDesignSendMethod(null);
      }
    }
  };

  // ✅ دالة لمعالجة تغيير child
  const handleChildChange = (parentKey: string, value: string) => {
    setOptionChildren((prev) => ({ ...prev, [parentKey]: value }));
    markDirty();
  };

  const handlePrintLocationsChange = (value: string[]) => {
    setPrintLocations(value);
    markDirty();
  };

  const handleDesignFileChange = (file: File | null) => {
    setDesignFile(file);

    if (file) {
      // ✅ إنشاء URL للمعاينة
      const previewUrl = URL.createObjectURL(file);
      setDesignPreview(previewUrl);

      // ✅ حفظ المعاينة مؤقتاً في localStorage
      if (cartItemId) {
        localStorage.setItem(`design_temp_${cartItemId}`, previewUrl);
      }

      // ✅ تحديث draftById لعرض الصورة فوراً
      if (cartItemId && onOptionsChange) {
        onOptionsChange(cartItemId, {
          existing_design_url: previewUrl,
          has_new_design_file: true,
          design_send_method: designSendMethod,
        });
      }

      // ✅ إظهار معاينة فورية للصورة
      toast.success("تم اختيار ملف التصميم بنجاح", {
        icon: "📷",
        duration: 2000,
      });
    } else {
      if (designPreview) URL.revokeObjectURL(designPreview);
      setDesignPreview(null);
    }

    markDirty();
  };

  const saveAllOptions = async () => {
  if (!cartItemId || !apiData) return;

  setSaving(true);
  setSavedSuccessfully(false);

  try {
    const sizeObj = apiData?.sizes?.find(
      (s: any) => String(s.name).trim() === String(size).trim(),
    );
    const colorObj = apiData?.colors?.find(
      (c: any) => String(c.name).trim() === String(color).trim(),
    );
    const materialObj = apiData?.materials?.find(
      (m: any) => String(m.name).trim() === String(material).trim(),
    );

    // ✅ البحث الصحيح لطريقة الطباعة
    let methodObj = null;
    if (printingMethod && printingMethod !== "اختر") {
      methodObj = apiData?.printing_methods?.find(
        (p: any) => String(p.name).trim() === String(printingMethod).trim(),
      );
    }

    const locList = Array.isArray(apiData?.print_locations)
      ? apiData.print_locations
      : [];
    const selectedLocObjs = (printLocations || [])
      .map((name) =>
        locList.find((l: any) => String(l.name).trim() === String(name).trim()),
      )
      .filter(Boolean);

    let print_location_ids: number[] = [];
    let embroider_location_ids: number[] = [];

    for (const locObj of selectedLocObjs as any[]) {
      const id = locObj?.id;
      if (typeof id !== "number") continue;
      const t = String(locObj?.type || "").toLowerCase();
      if (t === "embroider" || t === "embroidery")
        embroider_location_ids.push(id);
      else print_location_ids.push(id);
    }

    // ✅ بناء selected_options مع دعم الـ children بشكل صحيح
    const selected_options: any[] = [];

    // ✅ دالة للحصول على جميع خيارات الـ child مع الأسعار
    const getAllChildrenOptions = (groupName: string, optionValue: string) => {
      const options: any[] = [];
      const optionGroup = apiData.options?.find(
        (o: any) => o.name === groupName,
      );
      if (!optionGroup) return options;

      const optionItem = optionGroup.items?.find(
        (item: any) => item.value === optionValue,
      );
      if (!optionItem) return options;

      // ✅ إضافة الخيار الرئيسي
      options.push({
        option_name: groupName,
        option_value: optionValue,
        additional_price: n(optionItem.base_price),
      });

      // ✅ إضافة الـ child إذا تم اختياره
      const childKey = `${groupName}::${optionValue}`;
      const childValue = optionChildren?.[childKey];
      if (childValue && childValue !== "اختر") {
        const childItem = optionItem.children?.find(
          (child: any) => child.value === childValue,
        );
        if (childItem) {
          options.push({
            option_name: childItem.name || `${groupName} - تفاصيل`,
            option_value: childValue,
            additional_price: n(childItem.base_price),
          });
        }
      }

      return options;
    };

    // ✅ بناء selected_options مع الـ children
    Object.entries(optionGroups || {}).forEach(([group, value]) => {
      if (!value || value === "اختر") return;
      const groupOptions = getAllChildrenOptions(group, value);
      groupOptions.forEach((opt) => {
        selected_options.push(opt);
      });
    });

    // ✅ إضافة طريقة الطباعة إلى selected_options إذا لم تكن موجودة بالفعل
    if (printingMethod && printingMethod !== "اختر" && methodObj) {
      const hasPrintingInOptions = selected_options.some(
        (opt) => String(opt.option_name).trim() === "طريقة الطباعة",
      );

      if (!hasPrintingInOptions) {
        const printingPrice = n(
          methodObj.base_price || methodObj.pivot_price || 0,
        );

        selected_options.push({
          option_name: "طريقة الطباعة",
          option_value: printingMethod,
          additional_price: printingPrice,
        });
      }
    }

    // إضافة الخيارات الأساسية إذا كانت مطلوبة
    const addSystemOptionIfMissing = (
      name: string,
      value: string,
      price: number = 0,
    ) => {
      const exists = selected_options.some(
        (opt) => String(opt.option_name).trim() === name,
      );
      if (!exists && value && value !== "اختر") {
        selected_options.push({
          option_name: name,
          option_value: value,
          additional_price: price,
        });
      }
    };

    // إضافة الخيارات الأساسية
    if (size && size !== "اختر") {
      addSystemOptionIfMissing("المقاس", size, 0);
    }
    if (color && color !== "اختر") {
      addSystemOptionIfMissing("اللون", color, 0);
    }
    if (material && material !== "اختر") {
      const materialPrice = materialObj ? n(materialObj.additional_price) : 0;
      addSystemOptionIfMissing("الخامة", material, materialPrice);
    }
    if (printLocations.length > 0) {
      printLocations.forEach((loc) => {
        const locObj = locList.find(
          (l: any) => String(l.name).trim() === String(loc).trim(),
        );
        const locPrice = locObj
          ? n(locObj.pivot_price ?? locObj.additional_price)
          : 0;
        addSystemOptionIfMissing("مكان الطباعة", loc, locPrice);
      });
    }

    // ✅ **جديد: رفع الصورة أولاً إذا كان هناك ملف تصميم جديد**
    let uploadedImageUrl = existingDesignUrl; // استخدم الصورة الموجودة كقيمة افتراضية
    
    const shouldUploadFile = designSendMethod === "upload" && !!designFile;
    
    if (shouldUploadFile) {
      toast.loading("جاري رفع الصورة...", { id: "upload-design" });
      try {
        uploadedImageUrl = await uploadDesignImage(designFile, cartItemId);
        toast.success("تم رفع الصورة بنجاح", { id: "upload-design" });
      } catch (error: any) {
        toast.error(error.message || "فشل رفع الصورة", { id: "upload-design" });
        setSaving(false);
        return; // أوقف العملية إذا فشل رفع الصورة
      }
    }

    const payload: any = {
      selected_options,
      size_id: sizeObj?.id ?? null,
      color_id: colorObj?.id ?? null,
      material_id: materialObj?.id ?? null,
      printing_method_id: methodObj?.id ?? null,
      print_locations: print_location_ids,
      embroider_locations: embroider_location_ids,
      design_send_method: designSendMethod,
    };

    // ✅ **جديد: إضافة رابط الصورة المرفوعة إلى الـ payload**
    const designServiceValue =
      optionGroups?.["خدمة تصميم"] || optionGroups?.["خدمة التصميم"];
    const isHasDesign =
      !!designServiceValue &&
      (String(designServiceValue).includes("لدى تصميم") ||
        String(designServiceValue).includes("تصميم خاص") ||
        String(designServiceValue).includes("رفع تصميم خاص"));

    if (isHasDesign) {
      payload.has_design = true;
      payload.design_option = designServiceValue;

      // ✅ استخدام رابط الصورة المرفوعة بدلاً من إرسال الملف
      if (uploadedImageUrl) {
        payload.image_design = uploadedImageUrl;
      }
    }
     if (uploadedImageUrl) {
      payload.image_design = uploadedImageUrl;
    }

    if (needSizeTier && sizeTierQty) {
      payload.quantity = Number(sizeTierQty);
    }

    // ✅ الآن نرسل البيانات إلى الـ API (بدون FormData)
    const success = await updateCartItem(cartItemId, payload);

    // ✅ الحصول على الرد من updateCartItem
    if (success && typeof success === "object" && (success as any).data) {
        await refreshCart();
      const responseData = (success as any).data;
      
      // تحديث local state ببيانات الخادم الجديدة
      if (responseData) {
        // تحديث الصورة إذا كانت موجودة في الرد
        if (responseData.image_design) {
          setExistingDesignUrl(responseData.image_design);
        }

        // تحديث الأسعار في الـ UI
        const updatedPricing = computePricingWithDraft(cartItem, {
          size,
          color,
          material,
          optionGroups,
          optionChildren,
          printing_method: printingMethod,
          print_locations: printLocations,
          size_tier_id: sizeTierId,
          size_tier_qty: sizeTierQty,
          size_tier_unit: sizeTierUnit,
          size_tier_total: sizeTierTotal,
          image_design: uploadedImageUrl,
        });

        // تحديث cartItem في الذاكرة
        cartItem = {
          ...cartItem,
          ...responseData,
          image_design: uploadedImageUrl || responseData.image_design,
          _unit: updatedPricing.unit,
          _line: updatedPricing.line,
          _real: updatedPricing.showRealProductPrice,
          _effectiveQty: updatedPricing.effectiveQty,
        };
      }
    }

    const qty = needSizeTier && sizeTierQty ? Number(sizeTierQty) : null;
    if (success && qty && typeof updateQuantity === "function") {
      try {
        await updateQuantity(cartItemId, qty);
      } catch {}
    }

    if (success) {
      setSavedSuccessfully(true);
      setHasUnsavedChanges(false);
      setShowSaveButton(false);

      // ✅ تحديث draftById بالقيم الجديدة بعد الحفظ مباشرة
      if (cartItemId && onOptionsChange) {
        onOptionsChange(cartItemId, {
          size: size,
          color: color,
          material: material,
          optionGroups: optionGroups,
          optionChildren: optionChildren,
          printing_method: printingMethod,
          print_locations: printLocations,
          size_tier_id: sizeTierId,
          size_tier_qty: sizeTierQty,
          size_tier_unit: sizeTierUnit,
          size_tier_total: sizeTierTotal,
          existing_design_url: uploadedImageUrl || existingDesignUrl,
          has_new_design_file: false,
          design_send_method: designSendMethod,
          isValid: true,
        });
      }

      // ✅ تنظيف المعاينة المؤقتة
      if (designPreview && cartItemId) {
        localStorage.removeItem(`design_temp_${cartItemId}`);
      }

      // ✅ تحديث السلة مباشرة
      await refreshCart();

      setTimeout(() => setSavedSuccessfully(false), 2500);
    }

  } catch (error: any) {
    console.error("❌ خطأ في حفظ الخيارات:", error);
    
    let errorMessage = "حدث خطأ أثناء حفظ التغييرات";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    toast.error(errorMessage);

  } finally {
    setSaving(false);
  }
};

  if (formLoading) return <StickerFormSkeleton />;

  if (apiError || !apiData) {
    return (
      <div className="md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 text-center">
        <p className="text-slate-700 font-extrabold">
          {apiError || "لا توجد بيانات للمنتج"}
        </p>
      </div>
    );
  }

  const needSize = apiData?.sizes?.length > 0;
  const needColor = apiData?.colors?.length > 0;
  const needMaterial = apiData?.materials?.length > 0;

  const needPrintingMethod =
    Array.isArray(apiData?.printing_methods) &&
    apiData.printing_methods.length > 0;
  const needPrintLocation =
    Array.isArray(apiData?.print_locations) &&
    apiData.print_locations.length > 0;

  const designServiceValue =
    optionGroups?.["خدمة تصميم"] || optionGroups?.["خدمة التصميم"];
  // ✅ **FIX: عرض قسم التصميم عند اختيار "رفع تصميم خاص" أو "لدى تصميم"**
  const showDesignSection =
    !!designServiceValue &&
    (String(designServiceValue).includes("لدى تصميم") ||
      String(designServiceValue).includes("تصميم خاص") ||
      String(designServiceValue).includes("رفع") ||
      String(designServiceValue).includes("لدي") ||
      String(designServiceValue).includes("رفع تصميم خاص"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pt-4 mt-4"
    >
      {cartItemId && showSaveButton && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 md:rounded-2xl rounded-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Warning className="text-yellow-600 text-sm" />
              <p className="text-sm text-yellow-800 font-bold">
                لديك تغييرات غير محفوظة
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="small"
                onClick={resetAllOptions}
                startIcon={<Refresh />}
                className="flex items-center gap-2"
                sx={{
                  borderRadius: "14px",
                  borderColor: "#e2e8f0",
                  color: "#0f172a",
                  fontWeight: 900,
                }}
              >
                إعادة تعيين
              </Button>

              <Button
                variant="contained"
                size="small"
                onClick={saveAllOptions}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                className="flex items-center gap-2"
                sx={{
                  borderRadius: "14px",
                  backgroundColor: "#f59e0b",
                  fontWeight: 900,
                }}
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {cartItemId && savedSuccessfully && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4"
        >
          <Alert
            severity="success"
            className="md:rounded-2xl rounded-lg"
            icon={<CheckCircle />}
          >
            تم حفظ التغييرات بنجاح
          </Alert>
        </motion.div>
      )}

      <div className="space-y-4">
        {needSize && (
          <Box>
            <FormControl
              fullWidth
              size="small"
              required
              error={showValidation && needSize && size === "اختر"}
            >
              <InputLabel>المقاس</InputLabel>
              <Select
                value={size}
                onChange={(e) => handleSizeChange(e.target.value as string)}
                label="المقاس"
                className="bg-white"
                displayEmpty
                renderValue={(selected) => {
                  if (!selected || selected === "اختر") {
                    return <em className="text-gray-400">اختر</em>;
                  }
                  return <span className="font-semibold">{selected}</span>;
                }}
              >
                <MenuItem value="اختر" disabled>
                  <em className="text-gray-400">اختر</em>
                </MenuItem>
                {apiData.sizes.map((s: any) => (
                  <MenuItem key={s.id} value={s.name}>
                    <span className="font-medium">{s.name}</span>
                  </MenuItem>
                ))}
              </Select>
              {showValidation && needSize && size === "اختر" && (
                <FormHelperText className="text-red-500 text-xs">
                  يجب اختيار المقاس
                </FormHelperText>
              )}
              {size !== "اختر" && (
                <FormHelperText className="text-green-600 text-xs">
                  ✓ تم اختيار: {size}
                </FormHelperText>
              )}
            </FormControl>
          </Box>
        )}

        {needSizeTier && (
          <Box>
            <FormControl
              fullWidth
              size="small"
              required
              error={showValidation && !sizeTierId}
            >
              <InputLabel>الكمية</InputLabel>
              <Select
                value={sizeTierId ? String(sizeTierId) : "اختر"}
                onChange={(e) => handleTierChange(e.target.value as string)}
                label="الكمية"
                className="bg-white"
                displayEmpty
                renderValue={(selected) => {
                  if (!selected || selected === "اختر") {
                    return <em className="text-gray-400">اختر</em>;
                  }
                  const tier = sizeTiers.find(
                    (t: any) => String(t.id) === selected,
                  );
                  if (tier) {
                    return (
                      <span className="font-semibold">
                        {n(tier.quantity)} قطعة
                      </span>
                    );
                  }
                  return "اختر";
                }}
              >
                <MenuItem value="اختر" disabled>
                  <em className="text-gray-400">اختر</em>
                </MenuItem>

                {sizeTiers.map((t: any) => {
                  const qty = n(t.quantity);
                  const unit = n(t.price_per_unit);
                  const backendTotal = n(t.total_price);
                  const computedTotal = qty > 0 && unit > 0 ? qty * unit : 0;
                  const showTotal =
                    backendTotal > 0 ? backendTotal : computedTotal;

                  return (
                    <MenuItem key={t.id} value={String(t.id)}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-medium">{qty} قطعة</span>
                        <span className="text-xs font-black text-slate-700">
                          {money(showTotal)} ر.س
                        </span>
                      </div>
                    </MenuItem>
                  );
                })}
              </Select>

              {showValidation && !sizeTierId && (
                <FormHelperText className="text-red-500 text-xs">
                  يجب اختيار الكمية
                </FormHelperText>
              )}

              {!!sizeTierId && (
                <FormHelperText className="text-green-600 text-xs">
                  ✓ تم اختيار: {sizeTierQty} قطعة (سعر الوحدة:{" "}
                  {money(n(sizeTierUnit))} — الإجمالي: {money(n(sizeTierTotal))}
                  )
                </FormHelperText>
              )}
            </FormControl>
          </Box>
        )}

        {needColor && (
          <Box>
            <FormControl
              fullWidth
              size="small"
              required
              error={showValidation && needColor && color === "اختر"}
            >
              <InputLabel>اللون</InputLabel>
              <Select
                value={color}
                onChange={(e) =>
                  handleOptionChange(setColor, e.target.value as string)
                }
                label="اللون"
                className="bg-white"
                displayEmpty
                renderValue={(selected) => {
                  if (!selected || selected === "اختر") {
                    return <em className="text-gray-400">اختر</em>;
                  }
                  const colorObj = apiData.colors.find(
                    (c: any) => c.name === selected,
                  );
                  return (
                    <div className="flex items-center gap-2">
                      {colorObj?.hex_code && (
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300"
                          style={{ backgroundColor: colorObj.hex_code }}
                          title={colorObj.hex_code}
                        />
                      )}
                      <span className="font-semibold">{selected}</span>
                    </div>
                  );
                }}
              >
                <MenuItem value="اختر" disabled>
                  <em className="text-gray-400">اختر</em>
                </MenuItem>
                {apiData.colors.map((c: any) => (
                  <MenuItem key={c.id} value={c.name}>
                    <div className="flex items-center gap-2">
                      {c.hex_code && (
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300"
                          style={{ backgroundColor: c.hex_code }}
                        />
                      )}
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
              {showValidation && needColor && color === "اختر" && (
                <FormHelperText className="text-red-500 text-xs">
                  يجب اختيار اللون
                </FormHelperText>
              )}
              {color !== "اختر" && (
                <FormHelperText className="text-green-600 text-xs">
                  ✓ تم اختيار: {color}
                </FormHelperText>
              )}
            </FormControl>
          </Box>
        )}

        {needMaterial && (
          <Box>
            <FormControl
              fullWidth
              size="small"
              required
              error={showValidation && needMaterial && material === "اختر"}
            >
              <InputLabel>الخامة</InputLabel>
              <Select
                value={material}
                onChange={(e) =>
                  handleOptionChange(setMaterial, e.target.value as string)
                }
                label="الخامة"
                className="bg-white"
                displayEmpty
                renderValue={(selected) => {
                  if (!selected || selected === "اختر") {
                    return <em className="text-gray-400">اختر</em>;
                  }
                  const materialObj = apiData.materials.find(
                    (m: any) => m.name === selected,
                  );
                  return (
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-semibold">{selected}</span>
                      {materialObj &&
                      Number(materialObj.additional_price || 0) > 0 ? (
                        <span className="text-xs font-black text-amber-700">
                          + {materialObj.additional_price}
                        </span>
                      ) : (
                        <span className="text-xs font-black text-slate-500">
                          0
                        </span>
                      )}
                    </div>
                  );
                }}
              >
                <MenuItem value="اختر" disabled>
                  <em className="text-gray-400">اختر</em>
                </MenuItem>
                {apiData.materials.map((m: any) => (
                  <MenuItem key={m.id} value={m.name}>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-medium">{m.name}</span>
                      {Number(m.additional_price || 0) > 0 ? (
                        <span className="text-xs font-black text-amber-700">
                          + {m.additional_price}
                        </span>
                      ) : (
                        <span className="text-xs font-black text-slate-500">
                          0
                        </span>
                      )}
                    </div>
                  </MenuItem>
                ))}
              </Select>
              {showValidation && needMaterial && material === "اختر" && (
                <FormHelperText className="text-red-500 text-xs">
                  يجب اختيار الخامة
                </FormHelperText>
              )}
              {material !== "اختر" && (
                <FormHelperText className="text-green-600 text-xs">
                  ✓ تم اختيار: {material}
                </FormHelperText>
              )}
            </FormControl>
          </Box>
        )}

        {/* option groups - مع دعم الـ children */}
        {Object.keys(groupedOptions).map((groupName) => {
          const items = groupedOptions[groupName] || [];
          const required = items.some((x: any) => Boolean(x?.is_required));
          const currentValue = optionGroups?.[groupName] || "اختر";
          const fieldError =
            showValidation && required && currentValue === "اختر";

          // ✅ الحصول على children للخيار المحدد
          const children = getChildrenForOption(groupName, currentValue);
          const childKey = `${groupName}::${currentValue}`;
          const childValue = optionChildren?.[childKey] || "اختر";
          const childFieldError =
            showValidation && children.length > 0 && childValue === "اختر";

          return (
            <Box key={groupName}>
              <FormControl
                fullWidth
                size="small"
                required={required}
                error={fieldError}
              >
                <InputLabel>{groupName}</InputLabel>
                <Select
                  value={currentValue}
                  onChange={(e) => {
                    handleGroupChange(groupName, e.target.value as string);
                  }}
                  label={groupName}
                  className="bg-white"
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected || selected === "اختر") {
                      return <em className="text-gray-400">اختر</em>;
                    }
                    const optionItem = items.find(
                      (o: any) => o.value === selected,
                    );
                    return (
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-semibold">{selected}</span>
                        {optionItem &&
                        Number(optionItem.base_price || 0) > 0 ? (
                          <span className="text-xs font-black text-amber-700">
                            + {optionItem.base_price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-slate-500"></span>
                        )}
                      </div>
                    );
                  }}
                >
                  <MenuItem value="اختر" disabled>
                    <em className="text-gray-600">اختر</em>
                  </MenuItem>

                  {items.map((o: any) => (
                    <MenuItem key={o.id} value={o.value}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-medium">{o.value}</span>
                        {Number(o.base_price || 0) > 0 ? (
                          <span className="text-xs font-black text-amber-700">
                            + {o.base_price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-slate-500"></span>
                        )}
                      </div>
                      {o.children && o.children.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1 mr-2">
                          ({o.children.length} خيار فرعي)
                        </div>
                      )}
                    </MenuItem>
                  ))}
                </Select>

                {fieldError && (
                  <FormHelperText className="text-red-500 text-xs">
                    يجب اختيار {groupName}
                  </FormHelperText>
                )}
                {currentValue !== "اختر" && (
                  <FormHelperText className="text-green-600 text-xs">
                    ✓ تم اختيار: {currentValue}
                  </FormHelperText>
                )}
              </FormControl>

              {/* ✅ عرض children إذا كان للخيار المحدد children */}
              {children && children.length > 0 && currentValue !== "اختر" && (
                <div className="mt-3">
                  <FormControl
                    fullWidth
                    size="small"
                    required
                    error={childFieldError}
                  >
                    <InputLabel>
                      {children[0]?.name || "تفاصيل إضافية"}
                    </InputLabel>
                    <Select
                      value={childValue}
                      onChange={(e) =>
                        handleChildChange(childKey, e.target.value as string)
                      }
                      label={children[0]?.name || "تفاصيل إضافية"}
                      className="bg-white"
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected || selected === "اختر") {
                          return <em className="text-gray-400">اختر</em>;
                        }
                        const childItem = children.find(
                          (c: any) => c.value === selected,
                        );
                        return (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="font-semibold">{selected}</span>
                            {childItem &&
                            Number(childItem.base_price || 0) > 0 ? (
                              <span className="text-xs font-black text-amber-700">
                                + {childItem.base_price.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs font-black text-slate-500"></span>
                            )}
                          </div>
                        );
                      }}
                    >
                      <MenuItem value="اختر" disabled>
                        <em className="text-gray-600">اختر</em>
                      </MenuItem>

                      {children.map((child: any) => (
                        <MenuItem key={child.id} value={child.value}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="font-medium">{child.value}</span>
                            {Number(child.base_price || 0) > 0 ? (
                              <span className="text-xs font-black text-amber-700">
                                + {child.base_price.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs font-black text-slate-500"></span>
                            )}
                          </div>
                        </MenuItem>
                      ))}
                    </Select>

                    {childFieldError && (
                      <FormHelperText className="text-red-500 text-xs">
                        يجب اختيار {children[0]?.name || "التفاصيل الإضافية"}
                      </FormHelperText>
                    )}
                    {childValue !== "اختر" && (
                      <FormHelperText className="text-green-600 text-xs">
                        ✓ تم اختيار: {childValue}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>
              )}

              {/* ✅ Design section مع جميع الخيارات - واتساب، ايميل، رفع مباشر */}
              {(groupName === "خدمة تصميم" || groupName === "خدمة التصميم") &&
                showDesignSection && (
                  <div className="mt-3 md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-extrabold text-slate-800">أرسل ملف التصميم عبر:</p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {whatsappHref && (
                        <button
                          type="button"
                          onClick={() => {
                            setDesignSendMethod("whatsapp");
                            markDirty();
                          }}
                          className={[
                            "md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition text-right",
                            designSendMethod === "whatsapp" ? "ring-2 ring-green-500" : "",
                          ].join(" ")}
                        >
                          <p className="font-black text-slate-900">WhatsApp</p>
                          <p className="text-xs text-slate-500 font-bold mt-1">إرسال عبر واتساب</p>
                        </button>
                      )}

                      {emailHref && emailFromSocial && (
                        <button
                          type="button"
                          onClick={() => {
                            setDesignSendMethod("email");
                            markDirty();
                          }}
                          className={[
                            "md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition text-right",
                            designSendMethod === "email" ? "ring-2 ring-blue-500" : "",
                          ].join(" ")}
                        >
                          <p className="font-black text-slate-900">📧 البريد الإلكتروني</p>
                          <p className="text-xs text-blue-600 font-bold mt-1 font-mono">{emailFromSocial}</p>
                          <p className="text-[10px] text-slate-400 mt-1">انقر للاختيار</p>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDesignSendMethod("upload");
                          markDirty();
                        }}
                        className={[
                          "md:rounded-2xl rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition text-right",
                          designSendMethod === "upload" ? "ring-2 ring-amber-300" : "",
                        ].join(" ")}
                      >
                        <p className="font-black text-slate-900">رفع الملف</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">رفع مباشر عبر الموقع</p>
                      </button>
                    </div>

                    {/* عرض محتوى واتساب فقط عند اختياره */}
                    {designSendMethod === "whatsapp" && (
                      <div className="mt-4">
                        <Divider className="!my-3" />
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                              📱
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-800">تم اختيار الإرسال عبر واتساب</p>
                              <p className="text-xs text-green-600">انقر على الزر أدناه لفتح المحادثة</p>
                            </div>
                          </div>
                          <Link
                            href={whatsappHref || "#"}
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

                    {/* عرض محتوى البريد الإلكتروني فقط عند اختياره */}
                    {designSendMethod === "email" && emailFromSocial && (
                      <div className="mt-4">
                        <Divider className="!my-3" />
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                              📧
                            </div>
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
                          <p className="text-xs text-center text-blue-500 mt-3">
                            أو أرسل مباشرة على: {emailFromSocial}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* عرض محتوى الرفع المباشر فقط عند اختياره */}
                    {designSendMethod === "upload" && (
                      <div className="mt-4">
                        <Divider className="!my-3" />
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                              📎
                            </div>
                            <div>
                              <p className="text-sm font-bold text-amber-800">تم اختيار الرفع المباشر</p>
                              <p className="text-xs text-amber-600">قم برفع ملف التصميم مباشرة</p>
                            </div>
                          </div>
                          
                          {/* Upload Card */}
                          <div className="relative">
                            <label
                              className={[
                                "flex flex-col items-center justify-center gap-2",
                                "w-full rounded-lg border-2 border-dashed",
                                "px-6 py-5 text-center cursor-pointer transition",
                                designPreview || existingDesignUrl
                                  ? "border-emerald-400 bg-emerald-50"
                                  : "border-amber-300 hover:border-amber-500 bg-white",
                              ].join(" ")}
                            >
                              <input
                                type="file"
                                accept="image/*,.pdf,.ai,.psd,.eps,.svg"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  if (file) {
                                    handleDesignFileChange(file);
                                    
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      setDesignPreview(e.target?.result as string);
                                      if (cartItemId) {
                                        localStorage.setItem(
                                          `design_temp_${cartItemId}`,
                                          e.target?.result as string
                                        );
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />

                              {!designPreview && !existingDesignUrl ? (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg mb-1">
                                    ⬆️
                                  </div>
                                  <p className="text-xs font-bold text-slate-700">اختر ملف التصميم</p>
                                  <p className="text-[10px] text-slate-500">PNG, JPG, PDF, AI, PSD, SVG</p>
                                </>
                              ) : (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg mb-1">
                                    ✅
                                  </div>
                                  <p className="text-xs font-bold text-emerald-700">
                                    {designFile ? designFile.name : "تم رفع التصميم"}
                                  </p>
                                 
                                </>
                              )}
                            </label>

                            {/* Remove button */}
                            {(designPreview || existingDesignUrl) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDesignFile(null);
                                  setDesignPreview(null);
                                  if (cartItemId) {
                                    localStorage.removeItem(`design_temp_${cartItemId}`);
                                  }
                                  if (onOptionsChange) {
                                    onOptionsChange(cartItemId!, {
                                      ...optionGroups,
                                      existing_design_url: null,
                                      has_new_design_file: false,
                                    });
                                  }
                                  markDirty();
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
                )}
            </Box>
          );
        })}

        {needPrintingMethod && (
          <Box>
            <FormControl
              fullWidth
              size="small"
              required
              error={showValidation && printingMethod === "اختر"}
            >
              <InputLabel>طريقة الطباعة</InputLabel>
              <Select
                value={printingMethod}
                onChange={(e) =>
                  handleOptionChange(
                    setPrintingMethod,
                    e.target.value as string,
                  )
                }
                label="طريقة الطباعة"
                className="bg-white"
                displayEmpty
                renderValue={(selected) => {
                  if (!selected || selected === "اختر") {
                    return <em className="text-gray-400">اختر</em>;
                  }
                  const methodObj = apiData.printing_methods.find(
                    (p: any) => p.name === selected,
                  );
                  return (
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="font-semibold">{selected}</span>
                      {methodObj && Number(methodObj.base_price || 0) > 0 ? (
                        <span className="text-xs font-black text-amber-700">
                          + {methodObj.base_price}
                        </span>
                      ) : (
                        <span className="text-xs font-black text-slate-500"></span>
                      )}
                    </div>
                  );
                }}
              >
                <MenuItem value="اختر" disabled>
                  <em className="text-gray-400">اختر</em>
                </MenuItem>
                {apiData.printing_methods.map((p: any) => (
                  <MenuItem key={p.id} value={p.name}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="font-medium">{p.name}</span>
                      {Number(p.base_price || 0) > 0 ? (
                        <span className="text-xs font-black text-amber-700">
                          + {p.base_price}
                        </span>
                      ) : (
                        <span className="text-xs font-black text-slate-500">
                          0
                        </span>
                      )}
                    </div>
                  </MenuItem>
                ))}
              </Select>

              {showValidation && printingMethod === "اختر" && (
                <FormHelperText className="text-red-500 text-xs">
                  يجب اختيار طريقة الطباعة
                </FormHelperText>
              )}
              {printingMethod !== "اختر" && (
                <FormHelperText className="text-green-600 text-xs">
                  ✓ تم اختيار: {printingMethod}
                </FormHelperText>
              )}
            </FormControl>
          </Box>
        )}

        {needPrintLocation && (
          <Box>
            <FormControl
              fullWidth
              size="small"
              required
              error={
                showValidation &&
                (!printLocations || printLocations.length === 0)
              }
            >
              <InputLabel>مكان الطباعة</InputLabel>
              <Select
                multiple
                value={printLocations}
                onChange={(e) =>
                  handlePrintLocationsChange(e.target.value as string[])
                }
                label="مكان الطباعة"
                className="bg-white"
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em className="text-gray-400">اختر</em>;
                  }
                  return (
                    <div>
                      <span className="font-semibold">
                        ✓ تم اختيار {selected.length} مكان
                      </span>
                      {selected.length > 0 && (
                        <span className="text-xs text-gray-600 block mt-1">
                          {selected.join("، ")}
                        </span>
                      )}
                    </div>
                  );
                }}
              >
                {apiData.print_locations.map((p: any) => (
                  <MenuItem key={p.id} value={p.name}>
                    <Checkbox checked={printLocations.indexOf(p.name) > -1} />
                    <ListItemText
                      primary={
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs font-black text-slate-500">
                            {p.type}
                          </span>
                        </div>
                      }
                    />
                  </MenuItem>
                ))}
              </Select>

              {showValidation &&
                (!printLocations || printLocations.length === 0) && (
                  <FormHelperText className="text-red-500 text-xs">
                    يجب اختيار مكان الطباعة
                  </FormHelperText>
                )}
              {printLocations.length > 0 && (
                <FormHelperText className="text-green-600 text-xs">
                  ✓ تم اختيار {printLocations.length} مكان:{" "}
                  {printLocations.join("، ")}
                </FormHelperText>
              )}
            </FormControl>
          </Box>
        )}
      </div>

      {apiData?.options_note && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 md:rounded-2xl rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="text-blue-500 text-sm mt-0.5" />
            <p className="text-sm text-blue-700 font-semibold">
              {apiData.options_note}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
});

function TotalOrder({
  items_count,
  subtotal,
  total, // <-- هذا هو currentTotal الذي سيتم استخدامه الآن
  items,
  couponDiscount = 0,
  couponNewTotal = null,
  hasUnsavedChanges = false,
  unsavedChangesCount = 0,
  originalTotal = null,
}: {
  items_count: number;
  subtotal: number;
  total: number; // <-- سيكون currentTotal
  items: any[];
  couponDiscount?: number;
  couponNewTotal?: number | null;
  hasUnsavedChanges?: boolean;
  unsavedChangesCount?: number;
  originalTotal?: number | null;
}) {
  const shippingFree = true;
  const shippingFee = shippingFree ? 0 : 48;

  // ✅ التصحيح: استخدام prop `total` (الذي هو currentTotal) لحساب الإجمالي بعد الكوبون
  const totalAfterCoupon =
    couponNewTotal !== null && couponNewTotal !== undefined
      ? Math.max(0, n(couponNewTotal))
      : Math.max(0, n(total) - n(couponDiscount)); // <-- هنا تم استخدام `total`

  const TAX_RATE = 0.15;

  const totalWithShipping = totalAfterCoupon + shippingFee;
  const taxAmount = totalWithShipping * (TAX_RATE / (1 + TAX_RATE));
  const totalWithoutTax = totalWithShipping - taxAmount;

  const formattedSubtotal = n(subtotal).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedTax = n(taxAmount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedTotalWithoutTax = n(totalWithoutTax).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedGrandTotal = n(totalWithShipping).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedCoupon = n(couponDiscount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const hasPriceChanges =
    originalTotal !== null && n(originalTotal) !== n(total);

  return (
    <div className="my-4 gap-2 flex flex-col">
         <div className="flex text-sm items-center justify-between text-black">
                <p className="font-semibold">المجموع ({items_count} عناصر)</p>
				</div>

      {(n(couponDiscount) > 0 ||
        (couponNewTotal !== null && couponNewTotal !== undefined)) && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-emerald-800 font-semibold">خصم الكوبون</p>
          <p className="font-extrabold text-emerald-700">
            - {formattedCoupon}
            <span className="text-xs me-1">ريال</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <p>الإجمالي بعد الخصم</p>
        <p className="font-semibold">
          {n(totalAfterCoupon).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="text-xs me-1">ريال</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p>الإجمالي بدون الضريبة</p>
        <p className="font-semibold">
          {formattedTotalWithoutTax}
          <span className="text-xs me-1">ريال</span>
        </p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <p>ضريبة القيمة المضافة (15%)</p>
        <p className="font-semibold">
          {formattedTax}
          <span className="text-xs me-1">ريال</span>
        </p>
      </div>

      <div className="flex items-center justify-between pb-3 pt-2 border-t border-slate-200 mt-2">
        <div className="flex gap-1 items-center">
          <p className="text-nowrap text-md text-pro font-semibold">
            الإجمالي الكلي:
          </p>
        </div>
        <p className="text-lg text-pro font-bold">
          {formattedGrandTotal}
          <span className="text-sm me-1">ريال</span>
        </p>
      </div>
    </div>
  );
}
