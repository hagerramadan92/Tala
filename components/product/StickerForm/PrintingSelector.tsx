// components/product/StickerForm/PrintingSelector.tsx
import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { useStickerForm } from "./StickerFormContext";

interface PrintingSelectorProps {
  apiData: any;
  showValidation: boolean;
}

export function PrintingSelector({ apiData, showValidation }: PrintingSelectorProps) {
  const { printingMethod, setPrintingMethod, printLocations, setPrintLocations, markDirty } = useStickerForm();
  
  const needPrintingMethod = (apiData?.printing_methods?.length ?? 0) > 0;
  const needPrintLocation = (apiData?.print_locations?.length ?? 0) > 0;

  return (
    <>
      {needPrintingMethod && (
        <Box>
          <FormControl fullWidth size="small" required error={showValidation && printingMethod === "اختر"}>
            <InputLabel>طريقة الطباعة</InputLabel>
            <Select
              value={printingMethod}
              onChange={(e) => {
                setPrintingMethod(e.target.value as string);
                markDirty();
              }}
              label="طريقة الطباعة"
              className="bg-white"
            >
              <MenuItem value="اختر" disabled>
                <em className="text-gray-400">اختر</em>
              </MenuItem>
              {apiData.printing_methods.map((p: any) => (
                <MenuItem key={p.id} value={p.name}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span>{p.name}</span>
                    <span className="text-xs font-black text-amber-700">{p.base_price}</span>
                  </div>
                </MenuItem>
              ))}
            </Select>

            {showValidation && printingMethod === "اختر" && (
              <FormHelperText className="text-red-500 text-xs">يجب اختيار طريقة الطباعة</FormHelperText>
            )}
          </FormControl>
        </Box>
      )}

      {needPrintLocation && (
        <Box>
          <FormControl fullWidth size="small" required error={showValidation && (!Array.isArray(printLocations) || printLocations.length === 0)}>
            <InputLabel>مكان الطباعة</InputLabel>
            <Select
              multiple
              value={printLocations}
              onChange={(e) => {
                setPrintLocations(e.target.value as string[]);
                markDirty();
              }}
              label="مكان الطباعة"
              className="bg-white"
              renderValue={(selected) => (Array.isArray(selected) ? selected.join("، ") : "")}
            >
              {apiData.print_locations.map((p: any) => {
                const checked = printLocations.includes(p.name);
                return (
                  <MenuItem key={p.id} value={p.name}>
                    <Checkbox checked={checked} />
                    <ListItemText
                      primary={
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span>{p.name}</span>
                          <span className="text-xs font-black text-slate-500">{p.type}</span>
                        </div>
                      }
                    />
                  </MenuItem>
                );
              })}
            </Select>

            {showValidation && (!Array.isArray(printLocations) || printLocations.length === 0) && (
              <FormHelperText className="text-red-500 text-xs">يجب اختيار مكان الطباعة</FormHelperText>
            )}
          </FormControl>
        </Box>
      )}
    </>
  );
}