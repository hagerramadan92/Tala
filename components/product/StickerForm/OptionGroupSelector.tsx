// components/product/StickerForm/OptionGroupSelector.tsx
import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { useStickerForm } from "./StickerFormContext";
import { DesignServiceBox } from "./DesignServiceBox";

interface OptionGroupSelectorProps {
  apiData: any;
  showValidation: boolean;
  productId: number;
  cartItemId?: number;
  onDesignFileChange?: (file: File | null) => void;
}

// مكون مساعد لعرض الخيارات بشكل متكرر
function RecursiveOptionRenderer({
  groupName,
  parentKey,
  items,
  level = 0,
  showValidation,
  onValueChange,
}: {
  groupName: string;
  parentKey: string;
  items: any[];
  level?: number;
  showValidation: boolean;
  onValueChange: (key: string, value: string) => void;
}) {
  const { optionChildren } = useStickerForm();
  
  const currentValue = optionChildren?.[parentKey] || "اختر";
  
  console.log(`Rendering level ${level}:`, { 
    groupName, 
    parentKey, 
    currentValue, 
    itemsCount: items.length 
  });

  const required = items.some((x: any) => Boolean(x?.is_required));
  const fieldError = showValidation && required && currentValue === "اختر";

  const handleChange = (e: any) => {
    const newValue = e.target.value as string;
    console.log(`📝 Level ${level} changed:`, { parentKey, newValue });
    onValueChange(parentKey, newValue);
  };

  return (
    <Box sx={{ mr: level > 0 ? 2 : 0, mt: level > 0 ? 2 : 0 }}>
      <FormControl fullWidth size="small" required={required} error={fieldError}>
        <InputLabel>{groupName}</InputLabel>
        <Select
          value={currentValue}
          onChange={handleChange}
          label={groupName}
          className="bg-white"
        >
          <MenuItem value="اختر" disabled>
            <em className="text-gray-600">اختر</em>
          </MenuItem>

          {items.map((item: any) => (
            <MenuItem key={item.id} value={item.value}>
              <div className="flex items-center justify-between gap-3 w-full">
                <span>{item.value}</span>
                {Number(item.base_price || 0) > 0 ? (
                  <span className="text-xs font-black text-amber-700">+ {item.base_price.toFixed(2)} ريال</span>
                ) : (
                  <span className="text-xs font-black text-slate-500"></span>
                )}
              </div>
            </MenuItem>
          ))}
        </Select>

        {fieldError && (
          <FormHelperText className="text-red-500 text-xs">
            يجب اختيار {groupName}
          </FormHelperText>
        )}
      </FormControl>

      {/* إذا كان الخيار المختار عنده أطفال، اعرضهم */}
      {currentValue !== "اختر" && (
        <RecursiveChildrenRenderer
          parentKey={parentKey}
          selectedValue={currentValue}
          items={items}
          level={level + 1}
          showValidation={showValidation}
          onValueChange={onValueChange}
        />
      )}
    </Box>
  );
}

// مكون مساعد لعرض أطفال الخيار المحدد
function RecursiveChildrenRenderer({
  parentKey,
  selectedValue,
  items,
  level = 0,
  showValidation,
  onValueChange,
}: {
  parentKey: string;
  selectedValue: string;
  items: any[];
  level?: number;
  showValidation: boolean;
  onValueChange: (key: string, value: string) => void;
}) {
  const selectedItem = items.find(item => item.value === selectedValue);
  
  console.log(`Children for ${selectedValue}:`, selectedItem?.children);
  
  if (!selectedItem?.children || selectedItem.children.length === 0) {
    return null;
  }

  const childGroupName = selectedItem.children[0]?.name || "خيارات إضافية";
  const newParentKey = `${parentKey}::${selectedValue}`;

  return (
    <RecursiveOptionRenderer
      groupName={childGroupName}
      parentKey={newParentKey}
      items={selectedItem.children}
      level={level}
      showValidation={showValidation}
      onValueChange={onValueChange}
    />
  );
}

export function OptionGroupSelector({ 
  apiData, 
  showValidation, 
  productId,
  cartItemId,
  onDesignFileChange 
}: OptionGroupSelectorProps) {
  const { 
    optionGroups, 
    optionChildren,
    handleOptionGroupChange, 
    handleChildChange,
    designSendMethod,
    setDesignSendMethod,
    designFile,
    setDesignFile,
  } = useStickerForm();

  // تحميل الخيارات المحفوظة مسبقاً عند فتح الصفحة
  React.useEffect(() => {
    console.log("Current saved options:", { optionGroups, optionChildren });
  }, [optionGroups, optionChildren]);

  const groupedOptions = React.useMemo(() => {
    const list = Array.isArray(apiData?.options) ? apiData.options : [];
    const out: Record<string, any[]> = {};
    list.forEach((o: any) => {
      const k = String(o.name || "").trim();
      if (!k) return;
      out[k] = o.items || [];
    });
    return out;
  }, [apiData]);

  if (Object.keys(groupedOptions).length === 0) return null;

  return (
    <>
      {Object.keys(groupedOptions).map((groupName) => {
        const items = groupedOptions[groupName] || [];
        const required = items.some((x: any) => Boolean(x?.is_required));
        const currentValue = optionGroups?.[groupName] || "اختر";
        const fieldError = showValidation && required && currentValue === "اختر";

        return (
          <Box key={groupName} className="mb-4">
            {/* مستوى أول */}
            <FormControl fullWidth size="small" required={required} error={fieldError}>
              <InputLabel>{groupName}</InputLabel>
              <Select
                value={currentValue}
                onChange={(e) => {
                  console.log(`📝 Main group ${groupName} changed to:`, e.target.value);
                  handleOptionGroupChange(groupName, e.target.value as string);
                }}
                label={groupName}
                className="bg-white"
              >
                <MenuItem value="اختر" disabled>
                  <em className="text-gray-600">اختر</em>
                </MenuItem>

                {items.map((o: any) => (
                  <MenuItem key={o.id} value={o.value}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span>{o.value}</span>
                      {Number(o.base_price || 0) > 0 ? (
                        <span className="text-xs font-black text-amber-700">+ {o.base_price.toFixed(2)} ريال</span>
                      ) : (
                        <span className="text-xs font-black text-slate-500"></span>
                      )}
                    </div>
                  </MenuItem>
                ))}
              </Select>

              {fieldError && (
                <FormHelperText className="text-red-500 text-xs">
                  يجب اختيار {groupName}
                </FormHelperText>
              )}
            </FormControl>

            {/* عرض المستويات التالية مع الاحتفاظ بالقيم المختارة */}
            {currentValue !== "اختر" && (
              <RecursiveChildrenRenderer
                parentKey={groupName}
                selectedValue={currentValue}
                items={items}
                level={1}
                showValidation={showValidation}
                onValueChange={handleChildChange}
              />
            )}

            {/* خدمة التصميم */}
            {(String(groupName).trim() === "خدمة تصميم" || String(groupName).trim() === "خدمة التصميم") && 
             ["رفع تصميم خاص", "رفع تصميمي الخاص", "لدي تصميم يحتاج تعديل"].includes(currentValue) && (
              <DesignServiceBox
                productId={productId}
                cartItemId={cartItemId}
                designSendMethod={designSendMethod}
                setDesignSendMethod={setDesignSendMethod}
                designFile={designFile}
                setDesignFile={setDesignFile}
                onDesignFileChange={onDesignFileChange}
              />
            )}
          </Box>
        );
      })}
    </>
  );
}