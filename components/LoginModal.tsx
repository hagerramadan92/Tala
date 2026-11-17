"use client";

import Dialog from "@mui/material/Dialog";
import PhoneOtpAuthForm from "./PhoneOtpAuthForm";

export default function LoginModal({
  open,
  onClose,
  onSuccess,
  title = "سجّل الدخول لإتمام الطلب",
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  title?: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <div dir="rtl" className="p-4 md:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-extrabold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xl leading-none"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          أدخل رقم جوالك ورمز التحقق — منتجاتك في السلة محفوظة.
        </p>
        <PhoneOtpAuthForm mode="login" onSuccess={onSuccess} />
      </div>
    </Dialog>
  );
}
