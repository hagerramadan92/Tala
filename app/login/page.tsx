"use client";

import React, { useEffect, useState } from "react";
import ButtonComponent from "@/components/ButtonComponent";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BiSolidHide, BiSolidShow } from "react-icons/bi";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import LoginWithGoogle from "@/components/loginWithGoogle";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FiPhone, FiLock, FiMessageCircle, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Logo from "../../components/Logo";

type LoginMode = "otp" | "password";

export default function Page() {
	const [mode, setMode] = useState<LoginMode>("otp");
	const [phone, setPhone] = useState("");
	const [errors, setErrors] = useState<{ phone?: string; password?: string; otp?: string; form?: string }>({});
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [pending, setPending] = useState(false);

	const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
	const [otp, setOtp] = useState("");
	const [otpPending, setOtpPending] = useState(false);
	const [resendIn, setResendIn] = useState(0);

	const router = useRouter();
	const { data: session, status } = useSession();
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1";

	const { login: loginContext } = useAuth();

	const validateInput = (input: string) => {
		const trimmed = input.trim();
		if (!trimmed) return "من فضلك أدخل رقم الجوال";

		const phoneRegex = /^(?:\+?966|00966)?0?5[03456789]\d{7}$/;
		if (phoneRegex.test(trimmed)) return "";

		return "من فضلك أدخل رقم جوال سعودي صالح";
	};

	const completeLogin = (data: any, successMessage: string) => {
		const token = data?.data?.token;
		const user = data?.data?.user;

		if (token && user) {
			loginContext(token, user.name, user.email, user.image, user.name);
		}

		Swal.fire({
			icon: "success",
			title: successMessage,
			timer: 1400,
			showConfirmButton: false,
		});

		router.push("/");
	};

	useEffect(() => {
		if (resendIn <= 0) return;
		const timer = setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
		return () => clearInterval(timer);
	}, [resendIn]);

	/* ------------------------- WhatsApp OTP ------------------------- */
	const sendOtp = async (e?: React.SyntheticEvent) => {
		e?.preventDefault();
		if (otpPending) return;

		setErrors({});
		const phoneError = validateInput(phone);
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

			completeLogin(data, data?.data?.is_new_user ? "تم إنشاء حسابك بنجاح" : "تم تسجيل الدخول بنجاح");
		} catch (error: any) {
			const msg = error?.message || "رمز التحقق غير صحيح";
			setErrors((prev) => ({ ...prev, otp: msg }));
			Swal.fire({ icon: "error", title: "خطأ", text: msg, confirmButtonText: "موافق" });
		} finally {
			setOtpPending(false);
		}
	};

	/* ------------------------- Password login ------------------------- */
	const handlePasswordSubmit = async (e?: React.SyntheticEvent) => {
		e?.preventDefault();
		if (pending) return;

		setErrors({});
		const phoneError = validateInput(phone);
		if (phoneError) {
			setErrors((prev) => ({ ...prev, phone: phoneError }));
			Swal.fire({ icon: "error", title: "خطأ", text: phoneError, confirmButtonText: "حسناً" });
			return;
		}

		if (!password.trim()) {
			setErrors((prev) => ({ ...prev, password: "كلمة المرور مطلوبة" }));
			Swal.fire({ icon: "error", title: "خطأ", text: "كلمة المرور مطلوبة", confirmButtonText: "حسناً" });
			return;
		}

		try {
			setPending(true);
			const res = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ phone: phone.trim(), password }),
			});
			const data = await res.json();

			if (!res.ok || data.status === false) {
				throw new Error(data.message || "بيانات الدخول غير صحيحة");
			}

			completeLogin(data, "تم تسجيل الدخول بنجاح");
		} catch (error: any) {
			const msg = error?.message || "حدث خطأ أثناء تسجيل الدخول";
			setErrors((prev) => ({ ...prev, form: msg }));
			Swal.fire({ icon: "error", title: "خطأ", text: msg, confirmButtonText: "موافق" });
		} finally {
			setPending(false);
		}
	};

	useEffect(() => {
		if (status === "authenticated" && session?.user) {
			localStorage.setItem("userEmail", session.user.email || "");
			localStorage.setItem("userName", session.user.name || "");
			localStorage.setItem("userImage", session.user.image || "");
			router.push("/");
		}
	}, [status, session, router]);

	const fieldBase =
		"w-full md:rounded-2xl rounded-lg border bg-white px-4 py-3 text-[15px] font-semibold outline-none transition " +
		"placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-pro/20 duration-200";

	const fieldOk = "border-slate-200 focus:border-pro focus:ring-pro/10";
	const fieldBad = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";

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
			<Logo className="absolute top-2 right-[30px]" />
			<motion.div
				initial={{ opacity: 0, y: 16, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.35, ease: "easeOut" }}
				className="w-full relative z-[10] max-w-xl"
			>
				<div className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] overflow-hidden">
					<div className="p-7 pb-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white">
						<h1 className="text-xl text-center md:text-2xl font-extrabold leading-snug">تسجيل الدخول</h1>
						<p className="text-center text-xs text-slate-300 font-semibold mt-1">
							دخول سريع برقم الجوال ورمز واتساب
						</p>
					</div>

					<div className="p-7">
						{/* Mode tabs */}
						<div className="grid grid-cols-2 gap-2 mb-5 bg-slate-100 p-1 rounded-2xl">
							<button
								type="button"
								onClick={() => {
									setMode("otp");
									setOtpStep("phone");
									setErrors({});
								}}
								className={`py-2.5 rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-2 ${
									mode === "otp" ? "bg-white shadow text-emerald-700" : "text-slate-500"
								}`}
							>
								<FaWhatsapp className="w-4 h-4" />
								رمز واتساب
							</button>
							<button
								type="button"
								onClick={() => {
									setMode("password");
									setErrors({});
								}}
								className={`py-2.5 rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-2 ${
									mode === "password" ? "bg-white shadow text-slate-900" : "text-slate-500"
								}`}
							>
								<FiLock className="w-4 h-4" />
								كلمة المرور
							</button>
						</div>

						{errors.form && (
							<div className="mb-4 md:rounded-2xl rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
								{errors.form}
							</div>
						)}

						{mode === "otp" ? (
							<form className="space-y-4" onSubmit={otpStep === "phone" ? sendOtp : verifyOtp}>
								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">رقم الجوال السعودي</label>
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
											className={[fieldBase, "pr-11", errors.phone ? fieldBad : fieldOk, otpStep === "code" ? "bg-slate-50 text-slate-500" : ""].join(" ")}
										/>
									</div>
									{errors.phone && <p className="mt-2 text-xs font-bold text-rose-600">{errors.phone}</p>}
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
											<label className="block text-sm font-extrabold text-slate-800 mb-2">رمز التحقق (6 أرقام)</label>
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
												className={[fieldBase, "text-center tracking-[0.55em] text-xl font-black", errors.otp ? fieldBad : fieldOk].join(" ")}
											/>
											{errors.otp && <p className="mt-2 text-xs font-bold text-rose-600">{errors.otp}</p>}
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
											type="submit"
											title={
												otpPending
													? "جارٍ المعالجة..."
													: otpStep === "phone"
														? "إرسال رمز واتساب"
														: "تأكيد الرمز وتسجيل الدخول"
											}
										/>
									</div>
								</div>

								<p className="text-center text-[11px] text-slate-500 font-semibold leading-relaxed">
									سيصلك رمز التحقق على واتساب. برمز صحيح يتم إنشاء حساب تلقائيًا إذا لم يكن لديك حساب.
								</p>
							</form>
						) : (
							<form className="space-y-4" onSubmit={handlePasswordSubmit}>
								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">رقم الجوال السعودي</label>
									<div className="relative">
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
											<FiPhone />
										</span>
										<input
											type="tel"
											inputMode="tel"
											autoComplete="tel"
											value={phone}
											onChange={(e) => {
												setPhone(e.target.value);
												if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
											}}
											placeholder="05XXXXXXXX"
											className={[fieldBase, "pr-11", errors.phone ? fieldBad : fieldOk].join(" ")}
										/>
									</div>
									{errors.phone && <p className="mt-2 text-xs font-bold text-rose-600">{errors.phone}</p>}
								</div>

								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">كلمة المرور</label>
									<div className="relative">
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
											<FiLock />
										</span>
										<input
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(e) => {
												setPassword(e.target.value);
												if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
											}}
											placeholder="••••••••"
											className={[fieldBase, "pr-11 pl-12", errors.password ? fieldBad : fieldOk].join(" ")}
										/>
										<button
											type="button"
											onClick={() => setShowPassword((prev) => !prev)}
											className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-2 text-slate-600 hover:bg-slate-100 transition"
											aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
										>
											{showPassword ? <BiSolidShow size={22} /> : <BiSolidHide size={22} />}
										</button>
									</div>
									{errors.password && <p className="mt-2 text-xs font-bold text-rose-600">{errors.password}</p>}
								</div>

								<div className="flex items-center justify-between pt-1">
									<Link href="/login/forgetPassword" className="text-sm font-extrabold text-pro hover:opacity-80 transition">
										نسيت كلمة المرور؟
									</Link>
									<Link href="/signup" className="text-sm font-extrabold text-slate-700 hover:text-slate-900 transition">
										ليس لدي حساب
									</Link>
								</div>

								<div className="pt-2">
									<div className={`${pending ? "opacity-80 pointer-events-none" : ""}`}>
										<ButtonComponent
											type="submit"
											title={pending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
										/>
									</div>
								</div>
							</form>
						)}

						<div className="my-6 flex items-center gap-3">
							<div className="h-px flex-1 bg-slate-200" />
							<span className="text-xs font-extrabold text-slate-500">أو</span>
							<div className="h-px flex-1 bg-slate-200" />
						</div>

						<LoginWithGoogle />

						{mode === "otp" && (
							<p className="text-center text-xs font-bold text-slate-600 mt-5">
								ليس لديك حساب؟{" "}
								<Link href="/signup" className="text-pro hover:opacity-80">
									أنشئ حسابًا
								</Link>
							</p>
						)}
					</div>
				</div>

				<p className="text-center text-xs text-slate-500 font-semibold mt-4">
					بتسجيل الدخول أنت توافق على الشروط وسياسة الخصوصية.
				</p>
			</motion.div>
		</div>
	);
}
