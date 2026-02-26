// components/product/StickerForm/SizeSelector.tsx
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

interface SizeSelectorProps {
  apiData: any;
  showValidation: boolean;
}

export function SizeSelector({ apiData, showValidation }: SizeSelectorProps) {
  const { size, handleSizeChange } = useStickerForm();
  const needSize = (apiData?.sizes?.length ?? 0) > 0;

  if (!needSize) return null;

  return (
    <Box>
      <FormControl fullWidth size="small" required error={showValidation && size === "اختر"}>
        <InputLabel>المقاس</InputLabel>
        <Select 
          value={size} 
          onChange={(e) => handleSizeChange(e.target.value as string)} 
          label="المقاس" 
          className="bg-white"
        >
          <MenuItem value="اختر" disabled>
            <em className="text-gray-400">اختر</em>
          </MenuItem>
          {apiData.sizes.map((s: any) => (
            <MenuItem key={s.id} value={s.name}>
              {s.name}
            </MenuItem>
          ))}
        </Select>
        {showValidation && needSize && size === "اختر" && (
          <FormHelperText className="text-red-500 text-xs">يجب اختيار المقاس</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}