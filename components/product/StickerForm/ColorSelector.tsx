// components/product/StickerForm/ColorSelector.tsx
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

interface ColorSelectorProps {
  apiData: any;
  showValidation: boolean;
}

export function ColorSelector({ apiData, showValidation }: ColorSelectorProps) {
  const { color, setColor, markDirty } = useStickerForm();
  const needColor = (apiData?.colors?.length ?? 0) > 0;

  if (!needColor) return null;

  return (
    <Box>
      <FormControl fullWidth size="small" required error={showValidation && needColor && color === "اختر"}>
        <InputLabel>اللون</InputLabel>
        <Select
          value={color}
          onChange={(e) => {
            setColor(e.target.value as string);
            markDirty();
          }}
          label="اللون"
          className="bg-white"
        >
          <MenuItem value="اختر" disabled>
            <em className="text-gray-400">اختر</em>
          </MenuItem>
          {apiData.colors.map((c: any) => (
            <MenuItem key={c.id} value={c.name}>
              <div className="flex items-center gap-2">
                {c.hex_code && <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c.hex_code }} />}
                <span>{c.name}</span>
              </div>
            </MenuItem>
          ))}
        </Select>
        {showValidation && needColor && color === "اختر" && (
          <FormHelperText className="text-red-500 text-xs">يجب اختيار اللون</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}