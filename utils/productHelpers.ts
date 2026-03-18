// utils/productHelpers.ts
import { SelectedOptions, ValidationResult } from "@/Types/product.types";

export const num = (v: any): number => {
  const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};

export function getQty(opts: SelectedOptions): number {
  const q = Math.floor(num(opts?.size_quantity));
  return q > 0 ? q : 1;
}

export function computeSizeBaseTotal(opts: SelectedOptions): number {
  console.log("🔢 computeSizeBaseTotal input:", opts);
  
  // إذا كان هناك total_price مباشر
  if (opts.size_total_price && opts.size_total_price > 0) {
    console.log("✅ Using direct total:", opts.size_total_price);
    return opts.size_total_price;
  }

  // حساب من الكمية والسعر
  const qty = num(opts?.size_quantity);
  const unit = num(opts?.size_price_per_unit);
  
  if (qty > 0 && unit > 0) {
    const calculated = qty * unit;
    console.log(`✅ Calculated total: ${qty} * ${unit} = ${calculated}`);
    return calculated;
  }

  console.log("⚠️ No valid total found, returning 0");
  return 0;
}

export function isOneTimeServiceOption(optionName: string, optionValue?: string): boolean {
  const name = String(optionName || "").trim().toLowerCase();
  const value = String(optionValue || "").trim().toLowerCase();

  const ar1 = name.includes("خدمة تصميم");
  const ar2 = name.includes("خدمة التصميم");
  const ar3 = value.includes("خدمة تصميم") || value.includes("خدمة التصميم");
  const en1 = name.includes("design");
  const en2 = value.includes("design");

  return ar1 || ar2 || ar3 || en1 || en2;
}

export function buildIdsPayload(apiData: any, opts: SelectedOptions) {
  const sizeObj = apiData?.sizes?.find((s: any) => s?.name === opts.size);
  const colorObj = apiData?.colors?.find((c: any) => c?.name === opts.color);
  const materialObj = apiData?.materials?.find((m: any) => m?.name === opts.material);
  const pmObj = apiData?.printing_methods?.find((p: any) => p?.name === opts.printing_method);

  const printLocationIds = Array.isArray(opts.print_locations) && opts.print_locations.length
    ? opts.print_locations
        .map((name: any) => apiData?.print_locations?.find((pl: any) => pl?.name === name)?.id)
        .filter((id: any) => typeof id === "number")
    : [];

  return {
    size_id: typeof sizeObj?.id === "number" ? sizeObj.id : null,
    color_id: typeof colorObj?.id === "number" ? colorObj.id : null,
    material_id: typeof materialObj?.id === "number" ? materialObj.id : null,
    printing_method_id: typeof pmObj?.id === "number" ? pmObj.id : null,
    print_locations: printLocationIds,
    embroider_locations: [],
  };
}

// ✅ دالة جديدة لبناء selected_options من flatOptions (لجميع المستويات)
export function buildSelectedOptionsFromFlat(flatOptions: any[], qty: number) {
  return flatOptions.map(opt => ({
    option_name: opt.name,
    option_value: opt.value,
    additional_price: opt.price || 0
  }));
}

// ✅ تحديث buildSelectedOptionsWithPrice لدعم flatOptions
export function buildSelectedOptionsWithPrice(apiData: any, opts: SelectedOptions) {
  // ✅ إذا كان في flatOptions، استخدمها مباشرة (للجيل الثالث وما فوق)
  if (opts.flatOptions && opts.flatOptions.length > 0) {
    const qty = getQty(opts);
    console.log("📦 Using flatOptions for price calculation:", opts.flatOptions);
    
    return opts.flatOptions.map(opt => {
      // التحقق إذا كان هذا الخيار خدمة لمرة واحدة
      const oneTime = isOneTimeServiceOption(opt.name, opt.value);
      
      return {
        option_name: opt.name,
        option_value: opt.value,
        additional_price: oneTime ? opt.price : (opt.price * qty)
      };
    });
  }
  
  // ⬇️ الكود القديم كنسخة احتياطية (للمستويين الأول والثاني)
  console.log("⚠️ Using old method for price calculation (no flatOptions)");
  
  const selected_options: Array<{ option_name: string; option_value: string; additional_price: number }> = [];
  const qty = getQty(opts);

  Object.entries(opts.optionGroups || {}).forEach(([group, value]) => {
    if (!value || value === "اختر") return;

    const optionGroup = apiData?.options?.find((o: any) => o.name === group);
    if (!optionGroup) return;

    const optionItem = optionGroup.items?.find((item: any) => item.value === value);
    if (!optionItem) return;

    const perUnit = num(optionItem.base_price);
    const oneTime = isOneTimeServiceOption(group, value);

    selected_options.push({
      option_name: group,
      option_value: value,
      additional_price: oneTime ? perUnit : perUnit * qty,
    });

    // دالة متكررة لجمع كل المستويات (للكود القديم)
    const collectChildren = (parentKey: string, currentValue: string, items: any[]) => {
      const childKey = `${parentKey}::${currentValue}`;
      const childValue = opts.optionChildren?.[childKey];
      
      if (!childValue || childValue === "اختر") return;
      
      const currentItem = items.find((item: any) => item.value === currentValue);
      if (!currentItem?.children) return;
      
      const childItem = currentItem.children.find((child: any) => child.value === childValue);
      if (childItem) {
        const childPerUnit = num(childItem.base_price);
        const childOneTime = isOneTimeServiceOption(childItem.name || group, childValue);
        
        selected_options.push({
          option_name: childItem.name || `${group} - تفاصيل`,
          option_value: childValue,
          additional_price: childOneTime ? childPerUnit : childPerUnit * qty,
        });
        
        // استمر في البحث عن أطفال أعمق
        if (childItem.children && childItem.children.length > 0) {
          collectChildren(childKey, childValue, childItem.children);
        }
      }
    };
    
    // ابدأ جمع الأطفال
    collectChildren(group, value, optionGroup.items);
  });

  return selected_options;
}

export function extractValueFromOptions(options: any[], optionName: string) {
  if (!options || !Array.isArray(options)) return null;
  const option = options.find((opt: any) => String(opt.option_name || "").trim() === String(optionName || "").trim());
  return option ? option.option_value : null;
}

export function extractValuesFromOptions(options: any[], optionName: string) {
  if (!options || !Array.isArray(options)) return [];
  return options
    .filter((opt: any) => String(opt.option_name || "").trim() === String(optionName || "").trim())
    .map((x: any) => String(x.option_value || "").trim())
    .filter(Boolean);
}

export function getSocialValue(socialMedia: any, key: "whatsapp" | "email") {
  const arr = Array.isArray(socialMedia) ? socialMedia : [];
  const item = arr.find((x: any) => String(x?.key).toLowerCase() === key);
  const value = String(item?.value || "").trim();
  return value || null;
}

export function getPages(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current]);
  if (current - 1 >= 1) pages.add(current - 1);
  if (current + 1 <= total) pages.add(current + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);

  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && p - (prev as number) > 1) out.push("…");
    out.push(p);
  }
  return out;
}

// ✅ تحديث validateOptions لدعم flatOptions
export function validateOptions(
  options: SelectedOptions, 
  data: any, 
  designMode?: string,
  designFile?: File | null
): ValidationResult {
  if (!data) return { isValid: false, missingOptions: [] };

  let isValid = true;
  const missingOptions: string[] = [];

  console.log("Validating options:", options);
  console.log("API Data:", data);

  // التحقق من المقاس
  if (data.sizes?.length > 0) {
    if (!options.size || options.size === "اختر" || options.size === "") {
      isValid = false;
      missingOptions.push("المقاس");
      console.log("Missing: size");
    }
  }

  // التحقق من كمية المقاس إذا كان هناك tiers
  if (data.sizes?.length > 0 && options.size && options.size !== "اختر") {
    const selectedSizeObj = data.sizes.find((s: any) => s?.name === options.size);
    const hasTiers = Array.isArray(selectedSizeObj?.tiers) && selectedSizeObj.tiers.length > 0;
    
    if (hasTiers) {
      if (!options.size_tier_id) {
        isValid = false;
        missingOptions.push("كمية المقاس");
        console.log("Missing: size tier");
      }
    }
  }

  // التحقق من اللون
  if (data.colors?.length > 0) {
    if (!options.color || options.color === "اختر" || options.color === "") {
      isValid = false;
      missingOptions.push("اللون");
      console.log("Missing: color");
    }
  }

  // التحقق من الخامة
  if (data.materials?.length > 0) {
    if (!options.material || options.material === "اختر" || options.material === "") {
      isValid = false;
      missingOptions.push("الخامة");
      console.log("Missing: material");
    }
  }

  // التحقق من option groups
  if (Array.isArray(data?.options) && data.options.length > 0) {
    data.options.forEach((o: any) => {
      const groupName = String(o.name || "").trim();
      const items = o.items || [];
      
      // التحقق إذا كان أي من الخيارات في هذه المجموعة required
      const hasRequiredItem = items.some((x: any) => Boolean(x?.is_required));
      
      if (hasRequiredItem) {
        const v = options.optionGroups?.[groupName];
        
        if (!v || v === "اختر" || v === "") {
          isValid = false;
          missingOptions.push(groupName);
          console.log(`Missing required group: ${groupName}`);
        } else {
          // ✅ إذا كان في flatOptions، نثق إنها شايلة كل حاجة
          if (options.flatOptions && options.flatOptions.length > 0) {
            console.log(`✅ Using flatOptions, skipping deep validation for ${groupName}`);
            return;
          }
          
          // التحقق من children إذا كانت موجودة (للكود القديم)
          const item = items.find((i: any) => i.value === v);
          if (item?.children && item.children.length > 0) {
            const childKey = `${groupName}::${v}`;
            const childValue = options.optionChildren?.[childKey];
            
            // دالة متكررة للتحقق من كل المستويات
            const validateRecursive = (currentItems: any[], currentKey: string, currentValue: string) => {
              const currentItem = currentItems.find((i: any) => i.value === currentValue);
              if (!currentItem?.children || currentItem.children.length === 0) return;
              
              const nextKey = `${currentKey}::${currentValue}`;
              const nextValue = options.optionChildren?.[nextKey];
              
              // التحقق إذا كان أي child مطلوب
              const hasRequiredChild = currentItem.children.some((child: any) => Boolean(child?.is_required));
              
              if (hasRequiredChild && (!nextValue || nextValue === "اختر" || nextValue === "")) {
                isValid = false;
                missingOptions.push(`${currentItem.children[0]?.name || "تفاصيل إضافية"}`);
                console.log(`Missing required child at level ${currentKey}`);
              } else if (nextValue && nextValue !== "اختر") {
                // استمر في التحقق من المستوى التالي
                validateRecursive(currentItem.children, nextKey, nextValue);
              }
            };
            
            validateRecursive(item.children, childKey, childValue);
          }
        }
      }
    });
  }

  // التحقق من طريقة الطباعة
  if (data.printing_methods?.length > 0) {
    if (!options.printing_method || options.printing_method === "اختر" || options.printing_method === "") {
      isValid = false;
      missingOptions.push("طريقة الطباعة");
      console.log("Missing: printing method");
    }
  }

  // التحقق من مكان الطباعة
  if (data.print_locations?.length > 0) {
    if (!Array.isArray(options.print_locations) || options.print_locations.length === 0) {
      isValid = false;
      missingOptions.push("مكان الطباعة");
      console.log("Missing: print locations");
    }
  }

  console.log("Validation result:", { isValid, missingOptions });
  return { isValid, missingOptions };
}