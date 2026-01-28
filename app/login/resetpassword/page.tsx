"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BiSolidHide, BiSolidShow } from "react-icons/bi";
import { FiLock, FiArrowRight, FiShield } from "react-icons/fi";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";
  const otp = searchParams.get("code") || "";

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [msg, setMsg] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  const setMessage = (type: "error" | "success" | "info", text: string) => setMsg({ type, text });

  const fieldBase =
    "w-full rounded-2xl border bg-white px-4 py-3 text-[15px] font-semibold outline-none transition " +
    "placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200";

  const fieldOk = "border-slate-200 focus:border-pro focus:ring-pro/10";
  const fieldBad = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";

  const strength = useMemo(() => {
    const p = password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    const label = score <= 1 ? "ضعيفة" : score === 2 ? "متوسطة" : score === 3 ? "جيدة" : "قوية";
    return { score, label };
  }, [password]);

  const canSubmit = useMemo(() => {
    return password.trim().length > 0 && confirmPassword.trim().length > 0 && !loading;
  }, [password, confirmPassword, loading]);

  const handleResetPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setErrors({});
    setMsg(null);

    const newErrors: typeof errors = {};

    if (!password.trim()) newErrors.password = "كلمة المرور مطلوبة";
    else if (password.length < 8) newErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";

    if (!confirmPassword.trim()) newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
    else if (confirmPassword !== password) newErrors.confirmPassword = "كلمة المرور غير متطابقة";

    if (!email || !otp) {
      newErrors.form = "بيانات الرابط غير مكتملة (email / code)";
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      if (newErrors.form) setMessage("error", newErrors.form);
      return;
    }

    if (!API_URL) {
      setMessage("error", "NEXT_PUBLIC_API_URL غير موجود");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          password,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const m = data.message || "حدث خطأ أثناء إعادة التعيين";
        setMessage("error", m);
        setErrors((p) => ({ ...p, form: m }));
        return;
      }

      setMessage("success", "تم إعادة تعيين كلمة المرور بنجاح ✅");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch {
      setMessage("error", "فشل الاتصال بالخادم");
      setErrors((p) => ({ ...p, form: "فشل الاتصال بالخادم" }));
    } finally {
      setLoading(false);
    }
  };

  const invalidLink = !email || !otp;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 flex items-center justify-center" dir="rtl">
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(79,70,229,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.12) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          backgroundPosition: "-1px -1px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full relative z-[10] max-w-xl"
      >
        <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] overflow-hidden">
          {/* Header */}
          <div className="p-7 pb-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white">
            <h1 className="text-xl text-center md:text-2xl font-extrabold leading-snug">
              إعادة تعيين كلمة المرور
            </h1>
            <p className="text-center text-white/80 mt-2 text-sm font-semibold">
              اختر كلمة مرور جديدة لحسابك
            </p>
          </div>

          <div className="p-7">
            {/* message */}
            <AnimatePresence>
              {msg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={[
                    "mb-4 rounded-2xl border px-4 py-3 text-sm font-bold",
                    msg.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "",
                    msg.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "",
                    msg.type === "info" ? "border-slate-200 bg-slate-50 text-slate-700" : "",
                  ].join(" ")}
                >
                  {msg.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* invalid link guard */}
            {invalidLink ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
                  الرابط غير صحيح أو منتهي. ارجع لصفحة "نسيت كلمة المرور" واطلب كود جديد.
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    href="/login/forgetPassword"
                    className="inline-flex items-center gap-2 text-sm font-extrabold text-pro hover:opacity-80 transition"
                  >
                    <FiArrowRight />
                    الرجوع لنسيت كلمة المرور
                  </Link>

                  <Link
                    href="/login"
                    className="text-sm font-extrabold text-slate-700 hover:text-slate-900 transition"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                {/* email preview */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-bold text-slate-500">الحساب:</p>
                  <p className="text-sm font-extrabold text-slate-900 truncate">{email}</p>
                </div>

                {/* password */}
                <div>
                  <label className="block text-sm font-extrabold text-slate-800 mb-2">كلمة المرور الجديدة</label>

                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FiLock />
                    </span>

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                      }}
                      placeholder="••••••••"
                      className={[fieldBase, "pr-11 pl-12", errors.password ? fieldBad : fieldOk].join(" ")}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-2 text-slate-600 hover:bg-slate-100 transition"
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <BiSolidShow size={22} /> : <BiSolidHide size={22} />}
                    </button>
                  </div>

                  {/* strength */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <FiShield />
                      قوة كلمة المرور: <span className="text-slate-800">{strength.label}</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={[
                            "h-1.5 w-8 rounded-full",
                            i < strength.score ? "bg-slate-900" : "bg-slate-200",
                          ].join(" ")}
                        />
                      ))}
                    </div>
                  </div>

                  {errors.password && <p className="mt-2 text-xs font-bold text-rose-600">{errors.password}</p>}
                </div>

                {/* confirm */}
                <div>
                  <label className="block text-sm font-extrabold text-slate-800 mb-2">تأكيد كلمة المرور</label>

                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FiLock />
                    </span>

                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                      }}
                      placeholder="••••••••"
                      className={[fieldBase, "pr-11 pl-12", errors.confirmPassword ? fieldBad : fieldOk].join(" ")}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-2 text-slate-600 hover:bg-slate-100 transition"
                      aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showConfirm ? <BiSolidShow size={22} /> : <BiSolidHide size={22} />}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p className="mt-2 text-xs font-bold text-rose-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* submit */}
                <button
                  type="submit"
                  onClick={handleResetPassword as any}
                  disabled={!canSubmit}
                  className={[
                    "w-full rounded-2xl py-3 font-extrabold text-white transition",
                    "bg-slate-900 hover:opacity-95",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                  ].join(" ")}
                >
                  {loading ? "جاري إعادة التعيين..." : "إعادة تعيين كلمة المرور"}
                </button>

                {/* links */}
                <div className="flex items-center justify-between pt-1">
                  <Link
                    href="/login/forgetPassword"
                    className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-700 hover:text-slate-900 transition"
                  >
                    <FiArrowRight />
                    رجوع
                  </Link>

                  <Link
                    href="/login"
                    className="text-sm font-extrabold text-pro hover:opacity-80 transition"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 font-semibold mt-4">
          استخدم كلمة مرور قوية وتجنب تكرار كلمات المرور القديمة.
        </p>
      </motion.div>
    </div>
  );
}
