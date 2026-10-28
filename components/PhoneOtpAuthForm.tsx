"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { FiPhone, FiMessageCircle, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import ButtonComponent from "@/components/ButtonComponent";
import { useAuth } from "@/src/context/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1";

const fieldBase =
  "w-full md:rounded-2xl rounded-lg border bg-white px-4 py-3 text-[15px] font-semibold outline-none transition " +
  "placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-pro/20 duration-200";
const fieldOk = "border-slate-200 focus:border-pro focus:ring-pro/10";
const fieldBad = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";

export default function PhoneOtpAuthForm({
  mode = "login",
}: {
  mode?: "login" | "signup";
}) {
  const router = useRouter();
  const { login: loginContext } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [otpPending, setOtpPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [errors, setErrors] = useState<{ phone?: string; otp?: string; form?: string }>({});

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(
      () => setResendIn((value) => Math.max(0, value - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, [resendIn]);

  const validatePhone = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return "من فضلك أدخل رقم الجوال";

    const phoneRegex = /^(?:\+?966|00966)?0?5[03456789]\d{7}$/;
    if (phoneRegex.test(trimmed)) return "";

    return "من فضلك أدخل رقم جوال سعودي صالح";
  };

  const completeLogin = (data: any) => {
    const token = data?.data?.token;
    const user = data?.data?.user;

    if (!token || !user) {
      throw new Error("لم يتم استلام بيانات الدخول من الخادم");
    }

    loginContext(token, user.name, user.email, user.image, user.name);

    const isNewUser = Boolean(data?.data?.is_new_user);

    // رسالة نجاح واضحة تفضل لحد ما العميل يقول "تمام" أو 5 ثواني.
    Swal.fire({
      icon: "success",
      title: isNewUser ? "تم إنشاء حسابك بنجاح 🎉" : "تم تسجيل الدخول بنجاح",
      text: isNewUser ? "أهلاً بيك في تالا الجزيرة" : "نوّرت تاني 👋",
      confirmButtonText: "تمام",
      confirmButtonColor: "#14213d",
      timer: 5000,
      timerProgressBar: true,
      allowOutsideClick: false,
    }).then(() => {
      router.replace("/");
      router.refresh();
    });
  };

  const sendOtp = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (otpPending) return;

    setErrors({});
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      Swal.fire({ icon: "error", title: "خطأ", text: phoneError, confirmButtonText: "حسناً" });
      return;
    }

    try {
      setOtpPending(true);
      const res = await fetch(`${API_URL}/auth/phone/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();

      if (!res.ok || data.status === false) {
        throw new Error(data.message || "تعذر إرسال رمز التحقق");
      }

      setOtpStep("code");
      setOtp("");
      setResendIn(Number(data?.data?.resend_after || 60));
      Swal.fire({
        icon: "success",
        title: "تم إرسال الرمز",
        text: "افتح واتساب وانسخ رمز التحقق المكوّن من 6 أرقام.",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      const msg = error?.message || "تعذر إرسال رمز التحقق";
      setErrors((prev) => ({ ...prev, form: msg }));
      Swal.fire({ icon: "error", title: "خطأ", text: msg, confirmButtonText: "موافق" });
    } finally {
      setOtpPending(false);
    }
  };

  const verifyOtp = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (otpPending) return;

    const cleanOtp = otp.replace(/\D/g, "").slice(0, 6);
    if (cleanOtp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "رمز التحقق يجب أن يكون 6 أرقام" }));
      return;
    }

    try {
      setOtpPending(true);
      const res = await fetch(`${API_URL}/auth/phone/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone: phone.trim(), otp: cleanOtp }),
      });
      const data = await res.json();

      if (!res.ok || data.status === false) {
        throw new Error(data.message || "رمز التحقق غير صحيح");
      }

      completeLogin(data);
    } catch (error: any) {
      const msg = error?.message || "رمز التحقق غير صحيح";
      setErrors((prev) => ({ ...prev, otp: msg }));
      Swal.fire({ icon: "error", title: "خطأ", text: msg, confirmButtonText: "موافق" });
    } finally {
      setOtpPending(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={otpStep === "phone" ? sendOtp : verifyOtp}>
      {errors.form && (
        <div className="mb-4 md:rounded-2xl rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
          {errors.form}
        </div>
      )}

      <div>
        <label className="block text-sm font-extrabold text-slate-800 mb-2">
          رقم الجوال السعودي
        </label>
        <div className="relative">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <FiPhone />
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            disabled={otpStep === "code"}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
            }}
            placeholder="05XXXXXXXX"
            className={[
              fieldBase,
              "pr-11",
              errors.phone ? fieldBad : fieldOk,
              otpStep === "code" ? "bg-slate-50 text-slate-500" : "",
            ].join(" ")}
          />
        </div>
        {errors.phone && (
          <p className="mt-2 text-xs font-bold text-rose-600">{errors.phone}</p>
        )}
      </div>

      {otpStep === "code" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <FiMessageCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-bold">
              أرسلنا رمز التحقق إلى واتساب الرقم <span dir="ltr">{phone}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-2">
              رمز التحقق (6 أرقام)
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
              }}
              placeholder="000000"
              dir="ltr"
              className={[
                fieldBase,
                "text-center tracking-[0.55em] text-xl font-black",
                errors.otp ? fieldBad : fieldOk,
              ].join(" ")}
            />
            {errors.otp && (
              <p className="mt-2 text-xs font-bold text-rose-600">{errors.otp}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setOtpStep("phone");
                setOtp("");
                setErrors({});
              }}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <FiArrowRight className="w-3.5 h-3.5" />
              تغيير الرقم
            </button>

            <button
              type="button"
              disabled={otpPending || resendIn > 0}
              onClick={sendOtp}
              className="text-emerald-700 disabled:text-slate-400 flex items-center gap-1"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${otpPending ? "animate-spin" : ""}`} />
              {resendIn > 0 ? `إعادة الإرسال بعد ${resendIn} ث` : "إعادة إرسال الرمز"}
            </button>
          </div>
        </div>
      )}

      <div className="pt-2">
        <div className={`${otpPending ? "opacity-80 pointer-events-none" : ""}`}>
          <ButtonComponent
            // بننادي الدالة مباشرة: motion.button مش بينفّذ submit الفورم
            // مع الكليك الحقيقي بالماوس (بينفّذ بس مع الكليك البرمجي).
            type="button"
            onClick={otpStep === "phone" ? sendOtp : verifyOtp}
            title={
              otpPending
                ? "جارٍ المعالجة..."
                : otpStep === "phone"
                  ? "إرسال رمز واتساب"
                  : mode === "signup"
                    ? "تأكيد الرمز وإنشاء الحساب"
                    : "تأكيد الرمز وتسجيل الدخول"
            }
          />
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-500 font-semibold leading-relaxed">
        <FaWhatsapp className="inline w-3.5 h-3.5 text-emerald-600 ml-1" />
        سيصلك رمز التحقق على واتساب. برمز صحيح يتم إنشاء حساب تلقائيًا إذا لم يكن لديك حساب.
      </p>

      <p className="text-center text-xs font-bold text-slate-600 mt-1">
        {mode === "signup" ? (
          <>
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-pro hover:opacity-80">
              تسجيل الدخول
            </Link>
          </>
        ) : (
          <>
            ليس لديك حساب؟{" "}
            <Link href="/signup" className="text-pro hover:opacity-80">
              أنشئ حسابًا
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
