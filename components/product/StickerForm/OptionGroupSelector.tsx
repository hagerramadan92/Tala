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
    getChildrenForOption,
    designSendMethod,
    setDesignSendMethod,
    designFile,
    setDesignFile,
  } = useStickerForm();

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

        const children = getChildrenForOption(groupName, currentValue);
        const childKey = `${groupName}::${currentValue}`;
        const childValue = optionChildren?.[childKey] || "اختر";
        const childFieldError = showValidation && children.length > 0 && childValue === "اختر";

        return (
          <Box key={groupName}>
            <FormControl fullWidth size="small" required={required} error={fieldError}>
              <InputLabel>{groupName}</InputLabel>
              <Select
                value={currentValue}
                onChange={(e) => {
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
                        <span className="text-xs font-black text-amber-700">+ {o.base_price.toFixed(2)}</span>
                      ) : (
                        <span className="text-xs font-black text-slate-500"></span>
                      )}
                    </div>
                  </MenuItem>
                ))}
              </Select>

              {fieldError && <FormHelperText className="text-red-500 text-xs">يجب اختيار {groupName}</FormHelperText>}
            </FormControl>

            {children && children.length > 0 && currentValue !== "اختر" && (
              <div className="mt-3">
                <FormControl fullWidth size="small" required error={childFieldError}>
                  <InputLabel>{children[0]?.name || "تفاصيل إضافية"}</InputLabel>
                  <Select
                    value={childValue}
                    onChange={(e) => handleChildChange(childKey, e.target.value as string)}
                    label={children[0]?.name || "تفاصيل إضافية"}
                    className="bg-white"
                  >
                    <MenuItem value="اختر" disabled>
                      <em className="text-gray-600">اختر</em>
                    </MenuItem>

                    {children.map((child: any) => (
                      <MenuItem key={child.id} value={child.value}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span>{child.value}</span>
                          {Number(child.base_price || 0) > 0 ? (
                            <span className="text-xs font-black text-amber-700">+ {child.base_price.toFixed(2)}</span>
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
                </FormControl>
              </div>
            )}

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