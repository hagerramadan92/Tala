// components/product/StickerForm/MaterialSelector.tsx
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

interface MaterialSelectorProps {
  apiData: any;
  showValidation: boolean;
}

export function MaterialSelector({ apiData, showValidation }: MaterialSelectorProps) {
  const { material, setMaterial, markDirty } = useStickerForm();
  const needMaterial = (apiData?.materials?.length ?? 0) > 0;

  if (!needMaterial) return null;

  return (
    <Box>
      <FormControl fullWidth size="small" required error={showValidation && needMaterial && material === "اختر"}>
        <InputLabel>الخامة</InputLabel>
        <Select
          value={material}
          onChange={(e) => {
            setMaterial(e.target.value as string);
            markDirty();
          }}
          label="الخامة"
          className="bg-white"
        >
          <MenuItem value="اختر" disabled>
            <em className="text-gray-400">اختر</em>
          </MenuItem>
          {apiData.materials.map((m: any) => (
            <MenuItem key={m.id} value={m.name}>
              <div className="flex items-center justify-between gap-2 w-full">
                <span>{m.name}</span>
                {Number(m.additional_price || 0) > 0 ? (
                  <span className="text-xs font-black text-amber-700">+ {m.additional_price}</span>
                ) : (
                  <span className="text-xs font-black text-slate-500">0</span>
                )}
              </div>
            </MenuItem>
          ))}
        </Select>
        {showValidation && needMaterial && material === "اختر" && (
          <FormHelperText className="text-red-500 text-xs">يجب اختيار الخامة</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}