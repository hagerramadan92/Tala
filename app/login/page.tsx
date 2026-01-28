"use client";

import React, { useEffect, useMemo, useState } from "react";
import ButtonComponent from "@/components/ButtonComponent";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BiSolidHide, BiSolidShow } from "react-icons/bi";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import LoginWithGoogle from "@/components/loginWithGoogle";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FiMail, FiLock } from "react-icons/fi";
import Logo from "../../components/Logo";

export default function Page() {
	const [email, setEmail] = useState("");
	const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [pending, setPending] = useState(false);

	const router = useRouter();
	const { data: session, status } = useSession();
	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const { login: loginContext } = useAuth();

	const validateInput = (input: string) => {
		const trimmed = input.trim();
		if (!trimmed) return "من فضلك أدخل البريد الإلكتروني أو رقم الهاتف";

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (emailRegex.test(trimmed)) return "";

		const phoneRegex = /^(?:\+?20|0)?1[0-9]{9}$/;
		if (phoneRegex.test(trimmed)) return "";

		return "من فضلك أدخل بريد إلكتروني أو رقم هاتف صالح";
	};

	const canSubmit = useMemo(() => {
		return email.trim().length > 0 && password.trim().length > 0 && !pending;
	}, [email, password, pending]);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (pending) return;

		setErrors({});

		const emailError = validateInput(email);
		if (emailError) {
			setErrors((p) => ({ ...p, email: emailError }));
			Swal.fire({ icon: "error", title: "خطأ", text: emailError, confirmButtonText: "حسناً" });
			return;
		}

		if (!password.trim()) {
			setErrors((p) => ({ ...p, password: "كلمة المرور مطلوبة" }));
			Swal.fire({ icon: "error", title: "خطأ", text: "كلمة المرور مطلوبة", confirmButtonText: "حسناً" });
			return;
		}

		try {
			setPending(true);

			const res = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				// credentials: "include", 
				headers: { "Content-Type": "application/json", Accept: "application/json" },

				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();

			if (res.ok && data.status !== false) {
				const token = data.data?.token;
				const userData = {
					name: data.data.user.name,
					email: data.data.user.email,
					image: data.data.user.image,
					fullName: data.data.user.name,
				};

				if (token) {
					loginContext(token, userData.name, userData.email, userData.image, userData.fullName);
				}

				Swal.fire({ icon: "success", title: "تم تسجيل الدخول بنجاح", timer: 1400, showConfirmButton: false });
				router.push("/");
			} else {
				const msg = data.message || "حدث خطأ أثناء تسجيل الدخول";
				setErrors((p) => ({ ...p, form: msg }));
				Swal.fire({ icon: "error", title: "خطأ", text: msg, confirmButtonText: "موافق" });
			}
		} catch {
			setErrors((p) => ({ ...p, form: "فشل الاتصال بالخادم" }));
			Swal.fire({ icon: "error", title: "خطأ", text: "فشل الاتصال بالخادم", confirmButtonText: "موافق" });
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
		"w-full rounded-2xl border bg-white px-4 py-3 text-[15px] font-semibold outline-none transition " +
		"placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200";

	const fieldOk = "border-slate-200 focus:border-pro focus:ring-pro/10";
	const fieldBad = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 flex items-center justify-center" dir="rtl">
			<div className='absolute  inset-0 opacity-15' style={{ backgroundImage: 'linear-gradient(rgba(79,70,229,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.12) 1px, transparent 1px)', backgroundSize: '12px 12px', backgroundPosition: '-1px -1px' }} />
			<Logo className=" absolute top-2 right-[30px] " />
			<motion.div
				initial={{ opacity: 0, y: 16, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.35, ease: "easeOut" }}
				className="w-full relative z-[10] max-w-xl"
			>
				{/* Card */}
				<div className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] overflow-hidden">
					{/* Header */}
					<div className="p-7 pb-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white">
						<h1 className="text-xl text-center md:text-2xl font-extrabold leading-snug">
							تسجيل الدخول
						</h1>
					</div>

					<div className="p-7">
						{/* form error */}
						{errors.form && (
							<div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
								{errors.form}
							</div>
						)}

						<form className="space-y-4" onSubmit={handleSubmit}>
							{/* Email / Phone */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">
									البريد الإلكتروني أو رقم الهاتف
								</label>

								<div className="relative">
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
										<FiMail />
									</span>

									<input
										type="text"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											if (errors.email) setErrors((p) => ({ ...p, email: "" }));
										}}
										placeholder="example@email.com  "
										className={[
											fieldBase,
											"pr-11",
											errors.email ? fieldBad : fieldOk,
										].join(" ")}
									/>
								</div>

								{errors.email && (
									<p className="mt-2 text-xs font-bold text-rose-600">{errors.email}</p>
								)}
							</div>

							{/* Password */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">
									كلمة المرور
								</label>

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
										className={[
											fieldBase,
											"pr-11 pl-12",
											errors.password ? fieldBad : fieldOk,
										].join(" ")}
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

								{errors.password && (
									<p className="mt-2 text-xs font-bold text-rose-600">{errors.password}</p>
								)}
							</div>

							{/* Links row */}
							<div className="flex items-center justify-between pt-1">
								<Link href="/login/forgetPassword" className="text-sm font-extrabold text-pro hover:opacity-80 transition">
									نسيت كلمة المرور؟
								</Link>

								<Link href="/signup" className="text-sm font-extrabold text-slate-700 hover:text-slate-900 transition">
									ليس لدي حساب
								</Link>
							</div>

							{/* Submit */}
							<div className="pt-2">
								<div className={`${pending ? "opacity-80 pointer-events-none" : ""}`}>
									<ButtonComponent
										type="submit"
										title={pending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
										onClick={handleSubmit as any}
									/>
								</div>

							</div>
						</form>

						{/* Divider */}
						<div className="my-6 flex items-center gap-3">
							<div className="h-px flex-1 bg-slate-200" />
							<span className="text-xs font-extrabold text-slate-500">أو</span>
							<div className="h-px flex-1 bg-slate-200" />
						</div>

						{/* Google */}
						<LoginWithGoogle />
					</div>
				</div>

				{/* Footer note */}
				<p className="text-center text-xs text-slate-500 font-semibold mt-4">
					بتسجيل الدخول أنت توافق على الشروط وسياسة الخصوصية.
				</p>
			</motion.div>
		</div>
	);
}
