// components/product/StickerForm/SaveBar.tsx
import React from "react";
import { motion } from "framer-motion";
import { Button, CircularProgress, Alert } from "@mui/material";
import { Save, Refresh, Warning, CheckCircle } from "@mui/icons-material";
import { useStickerForm } from "./StickerFormContext";

interface SaveBarProps {
  onSave: () => Promise<void>;
  onReset: () => void;
  saving: boolean;
}

export function SaveBar({ onSave, onReset, saving }: SaveBarProps) {
  const { showSaveButton, savedSuccessfully } = useStickerForm();

  if (!showSaveButton && !savedSuccessfully) return null;

  return (
    <>
      {showSaveButton && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 md:rounded-2xl rounded-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Warning className="text-yellow-600 text-sm" />
              <p className="text-sm text-yellow-800 font-bold">لديك تغييرات غير محفوظة</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="small"
                onClick={onReset}
                startIcon={<Refresh />}
                sx={{ borderRadius: "14px", borderColor: "#e2e8f0", color: "#0f172a", fontWeight: 900 }}
              >
                إعادة تعيين
              </Button>

              <Button
                variant="contained"
                size="small"
                onClick={onSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                sx={{ borderRadius: "14px", backgroundColor: "#f59e0b", fontWeight: 900 }}
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {savedSuccessfully && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="mb-4"
        >
          <Alert severity="success" className="md:rounded-2xl rounded-lg" icon={<CheckCircle />}>
            تم حفظ التغييرات بنجاح
          </Alert>
        </motion.div>
      )}
    </>
  );
}