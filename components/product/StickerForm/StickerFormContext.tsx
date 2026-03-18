// components/product/StickerForm/StickerFormContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { SelectedOptions, DesignSendMethod } from "@/Types/product.types";

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
  getAllFlatOptions: () => Array<{ name: string; value: string; price: number }>;
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
  }) => void;
}

export function StickerFormProvider({ 
  children, 
  apiData, 
  cartItemId,
  onOptionsChange,
  onDesignFileChange,
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

  // دالة متكررة محسنة لجمع جميع خيارات الأطفال مع الأسعار من جميع المستويات
  const collectAllChildrenOptions = useCallback((
    groupName: string,
    startValue: string,
    items: any[],
    parentPath: string = ""
  ): Array<{ name: string; value: string; price: number }> => {
    const result: Array<{ name: string; value: string; price: number }> = [];
    
    // بناء المسار الحالي
    const currentPath = parentPath ? `${parentPath}::${startValue}` : `${groupName}::${startValue}`;
    
    // البحث عن العنصر الحالي
    const findCurrentItem = (searchItems: any[], targetValue: string): any | null => {
      for (const item of searchItems) {
        if (item.value === targetValue) {
          return item;
        }
        if (item.children && item.children.length > 0) {
          const found = findCurrentItem(item.children, targetValue);
          if (found) return found;
        }
      }
      return null;
    };

    const currentItem = findCurrentItem(items, startValue);
    if (!currentItem) return result;

    // الحصول على قيمة الطفل في هذا المستوى
    const childValue = optionChildren[currentPath];
    
    if (childValue && childValue !== "اختر" && currentItem.children) {
      // البحث عن الطفل المحدد
      const childItem = currentItem.children.find((c: any) => c.value === childValue);
      
      if (childItem) {
        const childPrice = Number(childItem.base_price || 0);
        console.log(`✅ Found child at path ${currentPath}:`, {
          name: childItem.name || `تفاصيل إضافية`,
          value: childValue,
          price: childPrice
        });

        // إضافة الطفل الحالي
        result.push({
          name: childItem.name || `تفاصيل إضافية`,
          value: childValue,
          price: childPrice
        });

        // البحث في المستويات الأعمق
        if (childItem.children && childItem.children.length > 0) {
          const deeperChildren = collectAllChildrenOptions(
            groupName,
            childValue,
            [childItem],
            currentPath
          );
          result.push(...deeperChildren);
        }
      }
    }
    
    return result;
  }, [optionChildren]);

  // دالة الحصول على المسار الكامل لخيار معين
  const getFullOptionPath = useCallback((groupName: string): string[] => {
    const path: string[] = [groupName];
    let currentValue = optionGroups[groupName];
    
    if (!currentValue || currentValue === "اختر") return path;
    
    path.push(currentValue);
    
    // استمر في إضافة المستويات طالما يوجد أطفال
    let currentKey = `${groupName}::${currentValue}`;
    let childValue = optionChildren[currentKey];
    
    while (childValue && childValue !== "اختر") {
      path.push(childValue);
      currentKey = `${currentKey}::${childValue}`;
      childValue = optionChildren[currentKey];
    }
    
    return path;
  }, [optionGroups, optionChildren]);

  // دالة محسنة للحصول على جميع الخيارات المسطحة مع دعم جميع المستويات
  const getAllFlatOptions = useCallback(() => {
    const flatOptions: Array<{ name: string; value: string; price: number }> = [];
    
    console.log("🔍 Starting getAllFlatOptions with:", {
      optionGroups,
      optionChildren,
      groupedOptionsKeys: Object.keys(groupedOptions)
    });
    
    // تصفح كل المجموعات الرئيسية
    Object.keys(groupedOptions).forEach(groupName => {
      const mainValue = optionGroups[groupName];
      if (!mainValue || mainValue === "اختر") {
        return;
      }
      
      console.log(`📌 Processing group: ${groupName} = ${mainValue}`);
      
      // أضف الخيار الرئيسي
      const mainItems = groupedOptions[groupName] || [];
      const mainItem = mainItems.find((item: any) => item.value === mainValue);
      
      const mainPrice = Number(mainItem?.base_price || 0);
      console.log(`📌 Main option price: ${mainPrice}`);
      
      flatOptions.push({
        name: groupName,
        value: mainValue,
        price: mainPrice
      });
      
      // جمع جميع الأطفال من جميع المستويات
      if (mainItem?.children && mainItem.children.length > 0) {
        console.log(`🔍 Collecting children for "${mainValue}"`);
        const childOptions = collectAllChildrenOptions(groupName, mainValue, mainItems);
        
        if (childOptions.length > 0) {
          console.log(`✅ Found ${childOptions.length} child options:`, childOptions);
          flatOptions.push(...childOptions);
        }
      }
    });
    
    // حساب المجموع الكلي
    const total = flatOptions.reduce((sum, opt) => sum + (opt.price || 0), 0);
    console.log("📋 Final flat selected options:", flatOptions);
    console.log("💰 Total options price:", total);
    
    return flatOptions;
  }, [groupedOptions, optionGroups, collectAllChildrenOptions]);

  // دالة التحقق من صحة الخيارات
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

    // التحقق من option groups مع كل المستويات
    if (Array.isArray(apiData?.options) && apiData.options.length > 0) {
      requiredOptionGroups.forEach((groupName) => {
        const v = optionGroups?.[groupName];
        
        if (!v || v === "اختر") {
          isValid = false;
          return;
        }

        // التحقق من جميع مستويات الأطفال بشكل متكرر
        const validateChildren = (
          groupName: string,
          parentValue: string,
          level: number = 0
        ) => {
          const children = getChildrenForOption(groupName, parentValue);
          if (children && children.length > 0) {
            const parentKey = level === 0
              ? `${groupName}::${parentValue}`
              : `${groupName}::${parentValue}::level-${level}`;
            
            const childValue = optionChildren?.[parentKey];
            
            // تحقق من وجود أطفال مطلوبين
            children.forEach((child: any) => {
              if (child.is_required && (!childValue || childValue === "اختر")) {
                isValid = false;
              }
            });

            // استمر في التحقق من المستوى التالي
            if (childValue && childValue !== "اختر") {
              const selectedChild = children.find(
                (c: any) => c.value === childValue
              );
              if (selectedChild?.children?.length > 0) {
                validateChildren(groupName, childValue, level + 1);
              }
            }
          }
        };

        validateChildren(groupName, v);
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
    optionGroups, optionChildren, requiredOptionGroups, getChildrenForOption,
    printingMethod, printLocations
  ]);

  const getOptionsObj = useCallback((): SelectedOptions => {
    // الحصول على الخيارات بشكل مسطح
    const flatOptions = getAllFlatOptions();
    
    // حساب السعر الإجمالي من flatOptions
    const flatOptionsTotal = flatOptions.reduce((sum, opt) => sum + (opt.price || 0), 0);
    
    // الحصول على المسارات الكاملة
    const fullOptions: Record<string, string[]> = {};
    Object.keys(groupedOptions).forEach(groupName => {
      const path = getFullOptionPath(groupName);
      fullOptions[groupName] = path;
    });
    
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
      fullOptions,
      flatOptions,
      flatOptionsTotal,
      printing_method: printingMethod,
      print_locations: printLocations,
      isValid: validateCurrentOptions(),
    };
    
    console.log("📦 getOptionsObj returning:", {
      size: options.size,
      flatOptions: options.flatOptions,
      flatOptionsTotal: options.flatOptionsTotal,
      size_total_price: options.size_total_price
    });
    
    return options;
  }, [
    size, sizeTierId, sizeTierQty, sizeTierUnit, sizeTierTotal, 
    color, material, optionGroups, optionChildren, groupedOptions,
    printingMethod, printLocations, validateCurrentOptions, 
    getFullOptionPath, getAllFlatOptions
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

    const finalTotal = backendTotal > 0 ? backendTotal : (qty && unit ? qty * unit : 0);

    setSizeTierId(tier ? Number(tier.id) : null);
    setSizeTierQty(qty);
    setSizeTierUnit(unit);
    setSizeTierTotal(finalTotal > 0 ? finalTotal : null);

    markDirty();
  }, [sizeTiers, markDirty]);

  const handleOptionGroupChange = useCallback((groupName: string, value: string) => {
    const oldValue = optionGroups[groupName];

    setOptionGroups((prev) => ({ ...prev, [groupName]: value }));
    
    // مسح كل الـ children القديمة لهذا الخيار
    if (oldValue && oldValue !== value) {
      setOptionChildren((prev) => {
        const newChildren = { ...prev };
        const oldChildKey = `${groupName}::${oldValue}`;
        
        // احذف كل المفاتيح التي تبدأ بهذا المسار
        Object.keys(newChildren).forEach(key => {
          if (key.startsWith(oldChildKey)) {
            delete newChildren[key];
          }
        });
        
        return newChildren;
      });
    }
    
    // إضافة child جديد إذا وجد
    const newChildren = getChildrenForOption(groupName, value);
    if (newChildren && newChildren.length > 0) {
      const newChildKey = `${groupName}::${value}`;
      setOptionChildren((prev) => ({ ...prev, [newChildKey]: "اختر" }));
    }

    markDirty();

    // إعادة تعيين خيارات التصميم إذا كانت مجموعة تصميم
    if (String(groupName).trim() === "خدمة تصميم" || String(groupName).trim() === "خدمة التصميم") {
      setDesignSendMethod(null);
      setDesignFile(null);
    }
  }, [optionGroups, getChildrenForOption, markDirty]);

  const handleChildChange = useCallback((parentKey: string, value: string) => {
    setOptionChildren((prev) => {
      const newChildren = { ...prev, [parentKey]: value };
      
      // عندما يختار المستخدم قيمة جديدة، احذف أي أطفال سابقين لهذا المسار
      Object.keys(newChildren).forEach(key => {
        if (key.startsWith(`${parentKey}::`)) {
          delete newChildren[key];
        }
      });
      
      console.log("Updated optionChildren:", newChildren);
      return newChildren;
    });
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
    console.log("Loading saved options for cart item:", cartItemId);
  }, [cartItemId, apiData]);

  // Notify parent of changes
  useEffect(() => {
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
    console.log("🟢 Sending options to parent:", {
      flatOptions: options.flatOptions,
      flatOptionsTotal: options.flatOptionsTotal
    });
    
    onOptionsChange(options);
    
  }, [getOptionsObj, onOptionsChange]);

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
    getOptionsObj, 
    validateCurrentOptions,
    getAllFlatOptions,
  };

  return (
    <StickerFormContext.Provider value={value}>
      {children}
    </StickerFormContext.Provider>
  );
}