"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { BiSolidHide, BiSolidShow } from "react-icons/bi";
import Link from "next/link";
import LoginWithGoogle from "@/components/loginWithGoogle"; // ✅ use your new component name
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiUser, FiPhone } from "react-icons/fi";
import ButtonComponent from "../../components/ButtonComponent";

export default function SignupPage() {
	const router = useRouter();
	const { login } = useAuth();
	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [errors, setErrors] = useState<{
		firstName?: string;
		lastName?: string;
		email?: string;
		phone?: string;
		password?: string;
		confirmPassword?: string;
		form?: string;
	}>({});

	const [pending, setPending] = useState(false);

	const canSubmit = useMemo(() => {
		return (
			firstName.trim() &&
			lastName.trim() &&
			email.trim() &&
			phone.trim() &&
			password.trim() &&
			confirmPassword.trim() &&
			!pending
		);
	}, [firstName, lastName, email, phone, password, confirmPassword, pending]);

	const validate = () => {
		const newErrors: typeof errors = {};

		if (!firstName.trim()) newErrors.firstName = "الاسم الأول مطلوب";
		if (!lastName.trim()) newErrors.lastName = "الاسم الأخير مطلوب";

		if (!email.trim()) newErrors.email = "البريد الإلكتروني مطلوب";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			newErrors.email = "البريد الإلكتروني غير صحيح";

		if (!phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
		else if (!/^\d+$/.test(phone)) newErrors.phone = "رقم الهاتف يجب أن يحتوي على أرقام فقط";
		else if (phone.length !== 11) newErrors.phone = "رقم الهاتف يجب أن يكون 11 رقم";

		if (!password.trim()) newErrors.password = "كلمة المرور مطلوبة";
		else if (password.length < 8) newErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";

		if (!confirmPassword.trim()) newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
		else if (confirmPassword !== password) newErrors.confirmPassword = "كلمة المرور غير متطابقة";

		return newErrors;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!API_URL) {
			Swal.fire({ icon: "error", title: "خطأ", text: "NEXT_PUBLIC_API_URL غير موجود", confirmButtonText: "موافق" });
			return;
		}

		setErrors({});
		const newErrors = validate();

		if (Object.keys(newErrors).length) {
			setErrors(newErrors);
			Swal.fire({ icon: "error", title: "خطأ", text: "من فضلك راجع البيانات", confirmButtonText: "حسناً" });
			return;
		}

		try {
			setPending(true);

			const res = await fetch(`${API_URL}/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({
					name: `${firstName} ${lastName}`,
					email,
					phone,
					password,
					password_confirmation: confirmPassword,
				}),
			});

			const data = await res.json();

			if (res.ok && data.status !== false) {
				const token = data.data?.token;

				if (token) {
					login(
						token,
						firstName,
						email,
						data?.data?.user?.image || "",
						`${firstName} ${lastName}`
					);
				}

				Swal.fire({ icon: "success", title: "تم إنشاء الحساب بنجاح", timer: 1400, showConfirmButton: false });
				router.push("/");
			} else {
				const msg = data.message || "حدث خطأ أثناء التسجيل";
				setErrors((p) => ({ ...p, form: msg }));

				// map backend errors if exists
				if (data.errors) {
					const apiErrors: any = {};
					Object.keys(data.errors).forEach((k) => (apiErrors[k] = data.errors[k][0]));
					setErrors((p) => ({ ...p, ...apiErrors }));
				}

				Swal.fire({ icon: "error", title: "خطأ", text: msg, confirmButtonText: "موافق" });
			}
		} catch (err) {
			setErrors((p) => ({ ...p, form: "فشل الاتصال بالخادم" }));
			Swal.fire({ icon: "error", title: "خطأ", text: "فشل الاتصال بالخادم", confirmButtonText: "موافق" });
		} finally {
			setPending(false);
		}
	};

	// ✅ same input style like login page
	const fieldBase =
		"w-full rounded-2xl border bg-white px-4 py-3 text-[15px] font-semibold outline-none transition " +
		"placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200";

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

			<motion.div
				initial={{ opacity: 0, y: 16, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.35, ease: "easeOut" }}
				className="w-full relative z-[10] max-w-xl"
			>
				<div className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] overflow-hidden">
					{/* Header */}
					<div className="p-7 pb-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white">
						<h1 className="text-xl text-center md:text-2xl font-extrabold leading-snug">إنشاء حساب جديد</h1>

					</div>

					<div className="p-7">
						{/* form error */}
						{errors.form && (
							<div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
								{errors.form}
							</div>
						)}

						<form className="space-y-4" >
							{/* First + Last */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">الاسم الأول</label>
									<div className="relative">
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
											<FiUser />
										</span>
										<input
											value={firstName}
											onChange={(e) => {
												setFirstName(e.target.value);
												if (errors.firstName) setErrors((p) => ({ ...p, firstName: "" }));
											}}
											placeholder="محمد"
											className={[fieldBase, "pr-11", errors.firstName ? fieldBad : fieldOk].join(" ")}
										/>
									</div>
									{errors.firstName && <p className="mt-2 text-xs font-bold text-rose-600">{errors.firstName}</p>}
								</div>

								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">الاسم الأخير</label>
									<div className="relative">
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
											<FiUser />
										</span>
										<input
											value={lastName}
											onChange={(e) => {
												setLastName(e.target.value);
												if (errors.lastName) setErrors((p) => ({ ...p, lastName: "" }));
											}}
											placeholder="أحمد"
											className={[fieldBase, "pr-11", errors.lastName ? fieldBad : fieldOk].join(" ")}
										/>
									</div>
									{errors.lastName && <p className="mt-2 text-xs font-bold text-rose-600">{errors.lastName}</p>}
								</div>
							</div>

							{/* Email */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">البريد الإلكتروني</label>
								<div className="relative">
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
										<FiMail />
									</span>
									<input
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											if (errors.email) setErrors((p) => ({ ...p, email: "" }));
										}}
										placeholder="example@email.com"
										className={[fieldBase, "pr-11", errors.email ? fieldBad : fieldOk].join(" ")}
									/>
								</div>
								{errors.email && <p className="mt-2 text-xs font-bold text-rose-600">{errors.email}</p>}
							</div>

							{/* Phone */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">رقم الهاتف</label>
								<div className="relative">
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
										<FiPhone />
									</span>
									<input
										value={phone}
										onChange={(e) => {
											setPhone(e.target.value);
											if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
										}}
										placeholder="01xxxxxxxxx"
										className={[fieldBase, "pr-11", errors.phone ? fieldBad : fieldOk].join(" ")}
									/>
								</div>
								{errors.phone && <p className="mt-2 text-xs font-bold text-rose-600">{errors.phone}</p>}
							</div>

							{/* Password */}
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
								{errors.password && <p className="mt-2 text-xs font-bold text-rose-600">{errors.password}</p>}
							</div>

							{/* Confirm */}
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

							{/* Submit */}

							<div className="pt-2">
								<div className={`${pending ? "opacity-80 pointer-events-none" : ""}`}>
									<ButtonComponent
										title={pending ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
										onClick={handleSubmit as any}
									/>
								</div>
							</div>

							{/* Login link */}
							<div className="text-center pt-2">
								<span className="text-sm font-semibold text-slate-600">لدي حساب بالفعل؟ </span>
								<Link href="/login" className="text-sm font-extrabold text-pro hover:opacity-80 transition">
									تسجيل الدخول
								</Link>
							</div>
						</form>
 
 
					</div>
				</div>

				<p className="text-center text-xs text-slate-500 font-semibold mt-4">
					بإنشاء حساب أنت توافق على الشروط وسياسة الخصوصية.
				</p>
			</motion.div>
		</div>
	);
}
