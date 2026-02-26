// components/product/StickerForm/SizeTierSelector.tsx
import React, { useMemo } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { useStickerForm } from "./StickerFormContext";
import { num } from "@/utils/productHelpers";

interface SizeTierSelectorProps {
  apiData: any;
  showValidation: boolean;
}

export function SizeTierSelector({ apiData, showValidation }: SizeTierSelectorProps) {
  const { size, sizeTierId, handleTierChange, sizeTierUnit, sizeTierTotal } = useStickerForm();

  const selectedSizeObj = useMemo(() => {
    return (apiData?.sizes || []).find((s: any) => String(s?.name).trim() === String(size).trim()) || null;
  }, [apiData, size]);

  const sizeTiers = useMemo(() => {
    const tiers = selectedSizeObj?.tiers;
    return Array.isArray(tiers) ? tiers : [];
  }, [selectedSizeObj]);

  const needSize = (apiData?.sizes?.length ?? 0) > 0;
  const needSizeTier = needSize && size !== "اختر" && sizeTiers.length > 0;

  if (!needSizeTier) return null;

  return (
    <Box>
      <FormControl fullWidth size="small" required error={showValidation && needSizeTier && !sizeTierId}>
        <InputLabel>الكمية</InputLabel>
        <Select
          value={sizeTierId ? String(sizeTierId) : "اختر"}
          onChange={(e) => handleTierChange(e.target.value as string)}
          label="الكمية"
          className="bg-white"
        >
          <MenuItem value="اختر" disabled>
            <em className="text-gray-400">اختر</em>
          </MenuItem>

          {sizeTiers.map((t: any) => {
            const qty = num(t.quantity);
            const unit = num(t.price_per_unit);
            const backendTotal = num(t.total_price);
            const computed = qty > 0 && unit > 0 ? qty * unit : 0;
            const showTotal = backendTotal > 0 ? backendTotal : computed;

            return (
              <MenuItem key={t.id} value={String(t.id)}>
                <div className="flex items-center justify-between gap-3 w-full">
                  <span>{qty} قطعة</span>
                  <span className="text-xs font-black text-slate-700">{Number(showTotal).toFixed(2)} ر.س</span>
                </div>
              </MenuItem>
            );
          })}
        </Select>

        {showValidation && needSizeTier && !sizeTierId && (
          <FormHelperText className="text-red-500 text-xs">يجب اختيار كمية المقاس</FormHelperText>
        )}

        {!!sizeTierId && (
          <FormHelperText className="text-slate-600 text-xs">
            سعر الوحدة: {num(sizeTierUnit).toFixed(2)} — الإجمالي: {num(sizeTierTotal).toFixed(2)}
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}