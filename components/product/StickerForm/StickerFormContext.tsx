// components/product/StickerForm/StickerFormContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { SelectedOptions, DesignSendMethod } from "@/Types/product.types";
import { extractValueFromOptions, extractValuesFromOptions } from "@/utils/productHelpers";

interface StickerFormContextType {
  // States
  size: string;
  color: string;
  material: string;
  optionGroups: Record<string, string>;
  optionChildren: Record<string, string>;
  printingMethod: string;
  printLocations: string[];
  sizeTierId: number | null;
  sizeTierQty: number | null;
  sizeTierUnit: number | null;
  sizeTierTotal: number | null;
  designFile: File | null;
  designSendMethod: DesignSendMethod;
  showSaveButton: boolean;
  savedSuccessfully: boolean;
  saving: boolean;
  apiData: any;
  groupedOptions: Record<string, any[]>;
  requiredOptionGroups: string[];
  sizeTiers: any[];
  needSize: boolean;
  needSizeTier: boolean;

  // Setters
  setSize: (value: string) => void;
  setColor: (value: string) => void;
  setMaterial: (value: string) => void;
  setOptionGroups: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setOptionChildren: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setPrintingMethod: (value: string) => void;
  setPrintLocations: (value: string[]) => void;
  setSizeTierId: (value: number | null) => void;
  setSizeTierQty: (value: number | null) => void;
  setSizeTierUnit: (value: number | null) => void;
  setSizeTierTotal: (value: number | null) => void;
  setDesignFile: (value: File | null) => void;
  setDesignSendMethod: (value: DesignSendMethod) => void;
  setShowSaveButton: (value: boolean) => void;
  setSavedSuccessfully: (value: boolean) => void;
  setSaving: (value: boolean) => void;

  // Handlers
  markDirty: () => void;
  resetAllOptions: () => void;
  handleOptionGroupChange: (groupName: string, value: string) => void;
  handleChildChange: (parentKey: string, value: string) => void;
  handleSizeChange: (value: string) => void;
  handleTierChange: (tierIdStr: string) => void;
  getChildrenForOption: (groupName: string, optionValue: string) => any[];
  loadSavedOptions: () => Promise<void>;

  // Computed
  getOptionsObj: () => SelectedOptions;
  validateCurrentOptions: () => boolean;
}

const StickerFormContext = createContext<StickerFormContextType | undefined>(undefined);

export function useStickerForm() {
  const context = useContext(StickerFormContext);
  if (!context) {
    throw new Error("useStickerForm must be used within StickerFormProvider");
  }
  return context;
}

interface StickerFormProviderProps {
  children: React.ReactNode;
  apiData: any;
  cartItemId?: number;
  onOptionsChange?: (options: SelectedOptions) => void;
  onDesignFileChange?: (file: File | null) => void;
  setContextMethods?: (methods: {
    getOptionsObj: () => SelectedOptions;
    validateCurrentOptions: () => boolean;
  }) => void; // ✅ أضف هذا السطر
}

export function StickerFormProvider({ 
  children, 
  apiData, 
  cartItemId,
  onOptionsChange,
  onDesignFileChange ,
  setContextMethods,
}: StickerFormProviderProps) {
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
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designSendMethod, setDesignSendMethod] = useState<DesignSendMethod>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize option groups
  useEffect(() => {
    if (!apiData) return;

    const out: Record<string, string> = {};
    if (Array.isArray(apiData?.options)) {
      apiData.options.forEach((o: any) => {
        const k = String(o.name || "").trim();
        if (!k) return;
        out[k] = "اختر";
      });
    }
    setOptionGroups(out);
    setOptionChildren({});
  }, [apiData]);

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

  const requiredOptionGroups = useMemo(() => {
    const required: string[] = [];
    Object.keys(groupedOptions).forEach((k) => {
      const items = groupedOptions[k] || [];
      if (items.some((x: any) => Boolean(x?.is_required))) required.push(k);
    });
    return required;
  }, [groupedOptions]);

  const selectedSizeObj = useMemo(() => {
    return (apiData?.sizes || []).find((s: any) => String(s?.name).trim() === String(size).trim()) || null;
  }, [apiData, size]);

  const sizeTiers = useMemo(() => {
    const tiers = selectedSizeObj?.tiers;
    return Array.isArray(tiers) ? tiers : [];
  }, [selectedSizeObj]);

  const needSize = (apiData?.sizes?.length ?? 0) > 0;
  const needSizeTier = needSize && size !== "اختر" && sizeTiers.length > 0;

  const getChildrenForOption = useCallback((groupName: string, optionValue: string) => {
    if (!apiData || !apiData.options) return [];
    
    const optionGroup = apiData.options.find((o: any) => o.name === groupName);
    if (!optionGroup) return [];
    
    const optionItem = optionGroup.items?.find((item: any) => item.value === optionValue);
    if (!optionItem) return [];
    
    return optionItem.children || [];
  }, [apiData]);
  

 // components/product/StickerForm/StickerFormContext.tsx
// استبدل دالة validateCurrentOptions بهذا الكود

const validateCurrentOptions = useCallback(() => {
  if (!apiData) return false;

  let isValid = true;

  // التحقق من المقاس
  if (needSize && (!size || size === "اختر")) {
    isValid = false;
  }

  // التحقق من كمية المقاس
  if (needSizeTier && !sizeTierId) {
    isValid = false;
  }

  // التحقق من اللون
  if (apiData.colors?.length > 0 && (!color || color === "اختر")) {
    isValid = false;
  }

  // التحقق من الخامة
  if (apiData.materials?.length > 0 && (!material || material === "اختر")) {
    isValid = false;
  }

  // التحقق من option groups
  if (Array.isArray(apiData?.options) && apiData.options.length > 0) {
    apiData.options.forEach((o: any) => {
      const groupName = String(o.name || "").trim();
      const items = o.items || [];
      
      // التحقق إذا كان أي من الخيارات في هذه المجموعة required
      const hasRequiredItem = items.some((x: any) => Boolean(x?.is_required));
      
      if (hasRequiredItem) {
        const v = optionGroups?.[groupName];
        
        if (!v || v === "اختر") {
          isValid = false;
        } else {
          // التحقق من children إذا كانت موجودة
          const item = items.find((i: any) => i.value === v);
          if (item?.children && item.children.length > 0) {
            const childKey = `${groupName}::${v}`;
            const childValue = optionChildren?.[childKey];
            
            // التحقق إذا كان أي child مطلوب
            const hasRequiredChild = item.children.some((child: any) => Boolean(child?.is_required));
            
            if (hasRequiredChild && (!childValue || childValue === "اختر")) {
              isValid = false;
            }
          }
        }
      }
    });
  }

  // التحقق من طريقة الطباعة
  if (apiData.printing_methods?.length > 0 && (!printingMethod || printingMethod === "اختر")) {
    isValid = false;
  }

  // التحقق من مكان الطباعة
  if (apiData.print_locations?.length > 0 && (!Array.isArray(printLocations) || printLocations.length === 0)) {
    isValid = false;
  }

  return isValid;
}, [
  apiData, needSize, needSizeTier, size, sizeTierId, color, material,
  optionGroups, optionChildren, printingMethod, printLocations
]);

const getOptionsObj = useCallback((): SelectedOptions => {
  const options = {
    size,
    size_tier_id: sizeTierId,
    size_quantity: sizeTierQty,
    size_price_per_unit: sizeTierUnit,
    size_total_price: sizeTierTotal,
    color,
    material,
    optionGroups,
    optionChildren,
    printing_method: printingMethod,
    print_locations: printLocations,
    isValid: validateCurrentOptions(),
  };
  
  console.log("getOptionsObj returning:", options);
  return options;
}, [
  size, sizeTierId, sizeTierQty, sizeTierUnit, sizeTierTotal, 
  color, material, optionGroups, optionChildren, printingMethod, 
  printLocations, validateCurrentOptions
]);

  const markDirty = useCallback(() => {
    if (!cartItemId) return;
    setShowSaveButton(true);
    setSavedSuccessfully(false);
  }, [cartItemId]);

  const handleSizeChange = useCallback((value: string) => {
    setSize(value);
    setSizeTierId(null);
    setSizeTierQty(null);
    setSizeTierUnit(null);
    setSizeTierTotal(null);
    markDirty();
  }, [markDirty]);


const handleTierChange = useCallback((tierIdStr: string) => {
  const tierId = Number(tierIdStr);
  const tier = sizeTiers.find((t: any) => Number(t?.id) === tierId) || null;

  const qty = tier ? Number(tier.quantity) : null;
  const unit = tier ? Number(tier.price_per_unit) : 0;
  const backendTotal = tier ? Number(tier.total_price) : 0;

  // استخدم backendTotal إذا كان موجوداً، وإلا احسبها
  const finalTotal = backendTotal > 0 ? backendTotal : (qty && unit ? qty * unit : 0);

  console.log("Tier changed:", { tierId, qty, unit, backendTotal, finalTotal });

  setSizeTierId(tier ? Number(tier.id) : null);
  setSizeTierQty(qty);
  setSizeTierUnit(unit);
  setSizeTierTotal(finalTotal > 0 ? finalTotal : null);

  markDirty();
}, [sizeTiers, markDirty]);
  const handleOptionGroupChange = useCallback((groupName: string, value: string) => {
    setOptionGroups((prev) => ({ ...prev, [groupName]: value }));
    
    // Clear old child
    const oldChildKey = `${groupName}::${optionGroups[groupName]}`;
    if (optionChildren[oldChildKey]) {
      setOptionChildren((prev) => {
        const newChildren = { ...prev };
        delete newChildren[oldChildKey];
        return newChildren;
      });
    }
    
    // Add new child if exists
    const newChildren = getChildrenForOption(groupName, value);
    if (newChildren && newChildren.length > 0) {
      const newChildKey = `${groupName}::${value}`;
      setOptionChildren((prev) => ({ ...prev, [newChildKey]: "اختر" }));
    }

    markDirty();

    if (String(groupName).trim() === "خدمة تصميم" || String(groupName).trim() === "خدمة التصميم") {
      setDesignSendMethod(null);
      setDesignFile(null);
    }
  }, [optionGroups, optionChildren, getChildrenForOption, markDirty]);

  const handleChildChange = useCallback((parentKey: string, value: string) => {
    setOptionChildren((prev) => ({ ...prev, [parentKey]: value }));
    markDirty();
  }, [markDirty]);

  const resetAllOptions = useCallback(() => {
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

    setDesignFile(null);
    setDesignSendMethod(null);

    markDirty();
  }, [groupedOptions, markDirty]);

  const loadSavedOptions = useCallback(async () => {
    if (!cartItemId || !apiData) return;

    // This would need a fetch function from cart context
    // For now, we'll leave it as a placeholder
    console.log("Loading saved options for cart item:", cartItemId);
  }, [cartItemId, apiData]);

  // Notify parent of changes
  useEffect(() => {
//     if (onOptionsChange) {
//       onOptionsChange(getOptionsObj());
//     }
//   }, [getOptionsObj, onOptionsChange]);
   if (setContextMethods) {
      setContextMethods({
        getOptionsObj,
        validateCurrentOptions,
      });
    }
  }, [getOptionsObj, validateCurrentOptions, setContextMethods]);
useEffect(() => {
  if (!onOptionsChange) return;
  
  const options = getOptionsObj();
  console.log("🟢 Sending options to parent:", options);
  console.log("🟢 Base price from options:", options.size_total_price);
  
  // إرسال التحديث فوراً بدون تأخير
  onOptionsChange(options);
  
}, [getOptionsObj, onOptionsChange]); // يتغير عندما تتغير أي خيار
  const value = {
    // States
    size, color, material, optionGroups, optionChildren,
    printingMethod, printLocations, sizeTierId, sizeTierQty,
    sizeTierUnit, sizeTierTotal, designFile, designSendMethod,
    showSaveButton, savedSuccessfully, saving,
    apiData, groupedOptions, requiredOptionGroups, sizeTiers,
    needSize, needSizeTier,

    // Setters
    setSize, setColor, setMaterial, setOptionGroups, setOptionChildren,
    setPrintingMethod, setPrintLocations, setSizeTierId, setSizeTierQty,
    setSizeTierUnit, setSizeTierTotal, setDesignFile, setDesignSendMethod,
    setShowSaveButton, setSavedSuccessfully, setSaving,

    // Handlers
    markDirty, resetAllOptions, handleOptionGroupChange, handleChildChange,
    handleSizeChange, handleTierChange, getChildrenForOption, loadSavedOptions,

    // Computed
    getOptionsObj, validateCurrentOptions,
  };

  return (
    <StickerFormContext.Provider value={value}>
      {children}
    </StickerFormContext.Provider>
  );
}