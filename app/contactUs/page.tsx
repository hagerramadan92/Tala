"use client";

import React, { useCallback, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
	FiUser,
	FiPhone,
	FiMail,
	FiMessageSquare,
	FiBriefcase,
	FiCopy,
	FiArrowUpRight,
} from "react-icons/fi";

interface FormData {
	first_name: string;
	last_name: string;
	phone: string;
	email: string;
	message: string;
	company: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

function Field({
	label,
	error,
	children,
	hint,
}: {
	label: string;
	error?: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<label className="text-sm font-extrabold text-slate-900">{label}</label>
				{hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
			</div>
			{children}
			{error ? (
				<p className="text-red-600 text-xs font-semibold">{error}</p>
			) : null}
		</div>
	);
}

function ActionPill({
	label,
	onClick,
	icon,
}: {
	label: string;
	onClick: () => void;
	icon: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
		>
			{icon}
			{label}
		</button>
	);
}

function InfoCard({
	title,
	value,
	icon,
	actions,
}: {
	title: string;
	value: string;
	icon: React.ReactNode;
	actions?: React.ReactNode;
}) {
	return (
		<div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
			<div className="flex items-start gap-4">
				<div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-pro ring-1 ring-slate-200">
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="font-extrabold text-slate-900 text-base">{title}</h3>
					<p className="mt-1 break-words text-slate-700 font-semibold text-sm">
						{value}
					</p>

					{actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
				</div>
			</div>

			<div className="mt-5 h-px w-full bg-gradient-to-l from-slate-200 via-slate-100 to-transparent" />

			<p className="mt-4 text-xs text-slate-500 leading-relaxed">
				لو بتحب، ابعت لنا رسالة من النموذج — بنرد عادةً خلال وقت قصير.
			</p>
		</div>
	);
}

export default function ContactPageOne() {
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const [form, setForm] = useState<FormData>({
		first_name: "",
		last_name: "",
		phone: "",
		email: "",
		message: "",
		company: "",
	});

	const base_url = `${process.env.NEXT_PUBLIC_API_URL}/contact-us`;

	const validate = useCallback((data: FormData) => {
		const newErrors: Errors = {};

		if (!data.first_name.trim()) newErrors.first_name = "الإسم الأول مطلوب";
		if (!data.last_name.trim()) newErrors.last_name = "الإسم الأخير مطلوب";

		if (!data.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
		else if (!/^01[0-9]{9}$/.test(data.phone.trim()))
			newErrors.phone = "رقم الهاتف غير صحيح (مثال: 01012345678)";

		if (!data.email.trim()) newErrors.email = "البريد الإلكتروني مطلوب";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
			newErrors.email = "صيغة البريد الإلكتروني غير صحيحة";

		if (!data.company.trim()) newErrors.company = "اسم الشركة مطلوب";
		if (!data.message.trim()) newErrors.message = "الرسالة مطلوبة";

		return newErrors;
	}, []);

	const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

	const inputBase =
		"w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition";
	const withIcon = "ps-9"; // RTL + icon on left

	const inputClass = useCallback(
		(field: keyof FormData) =>
			[
				inputBase,
				withIcon,
				errors[field]
					? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
					: "border-slate-200 focus:border-pro focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200",
			].join(" "),
		[errors]
	);

	const textareaClass = useCallback(
		(field: keyof FormData) =>
			[
				inputBase,
				"ps-9",
				"min-h-[150px] resize-none",
				errors[field]
					? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
					: "border-slate-200 focus:border-pro focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200",
			].join(" "),
		[errors]
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const { name, value } = e.target;
			setForm((prev) => ({ ...prev, [name]: value }));
			setErrors((prev) => ({ ...prev, [name]: "" }));
		},
		[]
	);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (loading) return;

			const newErrors = validate(form);
			setErrors(newErrors);
			if (Object.keys(newErrors).length) return;

			setLoading(true);

			try {
				const res = await fetch(base_url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...form,
						phone: form.phone.trim(),
						email: form.email.trim(),
					}),
				});

				const data = await res.json().catch(() => null);

				if (res.ok && data?.status) {
					Swal.fire({
						icon: "success",
						title: "تم الإرسال بنجاح",
						text: data?.message || "سنتواصل معك قريبًا.",
						confirmButtonText: "موافق",
					});

					setForm({
						first_name: "",
						last_name: "",
						phone: "",
						email: "",
						message: "",
						company: "",
					});
					setErrors({});
					return;
				}

				Swal.fire({
					icon: "error",
					title: "خطأ",
					text: data?.message || "حدث خطأ أثناء الإرسال",
				});
			} catch {
				Swal.fire({
					icon: "error",
					title: "خطأ في الاتصال",
					text: "تعذر الاتصال بالسيرفر",
				});
			} finally {
				setLoading(false);
			}
		},
		[base_url, form, loading, validate]
	);

	// ===== Contact Data (edit freely) =====
	const hotline = "15829";
	const email = "hello@codexx.com";

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			Swal.fire({
				icon: "success",
				title: "تم النسخ",
				text: `تم نسخ ${label}`,
				timer: 1400,
				showConfirmButton: false,
			});
		} catch {
			Swal.fire({
				icon: "error",
				title: "تعذر النسخ",
				text: "الرجاء المحاولة مرة أخرى",
			});
		}
	};

	return (
		<section
			dir="rtl"
			className="relative overflow-hidden bg-white text-slate-800"
		>
			{/* Soft background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pro/10 blur-3xl" />
				<div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-slate-300/20 blur-3xl" />
			</div>

			<div className="relative  container pt-2 pb-8 md:py-8 ">
				{/* Hero */}
				<div className="mb-8 md:mb-10"> 
					<h1 className=" max-md:text-center mt-4 text-3xl md:text-4xl font-extrabold text-slate-950 leading-tight">
						اتصل بنا
					</h1>
					<p className="max-md:max-w-[320px] max-md:mx-auto max-md:text-center mt-3 max-w-2xl text-sm md:text-base text-slate-600 leading-relaxed">
						اختر وسيلة التواصل المناسبة أو اترك رسالة عبر النموذج، وسنعود لك في أقرب وقت.
					</p>
				</div>

				{/* Content */}
				<div className="grid lg:grid-cols-12 gap-0 md:gap-8">
					{/* Left: Info */}
					<div className="lg:col-span-5 space-y-6">
						<InfoCard
							title="الخط الساخن"
							value={hotline}
							icon={<FiPhone size={22} />}
							actions={
								<>
									<ActionPill
										label="اتصال"
										icon={<FiArrowUpRight />}
										onClick={() => (window.location.href = `tel:${hotline}`)}
									/>
									<ActionPill
										label="نسخ الرقم"
										icon={<FiCopy />}
										onClick={() => copyToClipboard(hotline, "الرقم")}
									/>
								</>
							}
						/>

						<InfoCard
							title="البريد الإلكتروني"
							value={email}
							icon={<FiMail size={22} />}
							actions={
								<>
									<ActionPill
										label="إرسال بريد"
										icon={<FiArrowUpRight />}
										onClick={() => (window.location.href = `mailto:${email}`)}
									/>
									<ActionPill
										label="نسخ البريد"
										icon={<FiCopy />}
										onClick={() => copyToClipboard(email, "البريد")}
									/>
								</>
							}
						/>

						<div className=" max-md:hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
							<h3 className="text-base font-extrabold text-slate-900">
								نصيحة سريعة
							</h3>
							<p className="mt-2 text-sm text-slate-600 leading-relaxed">
								لو عندك رقم طلب/فاتورة أو تفاصيل المشكلة، اكتبها داخل الرسالة عشان نقدر نساعدك أسرع.
							</p>
						</div>
					</div>

					{/* Right: Form */}
					<div className="lg:col-span-7">
						<div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
							{/* Header */}
							<div className="p-6 md:p-8 bg-gradient-to-l from-pro/12 via-transparent to-transparent">
								<h2 className="text-xl md:text-2xl font-extrabold text-slate-950">
									أرسل لنا رسالة
								</h2>
								<p className="mt-2 text-sm text-slate-600">
									املأ البيانات التالية وسنرد عليك في أقرب وقت.
								</p>
							</div>

							<form
								onSubmit={handleSubmit}
								className="p-6 md:p-8 grid md:grid-cols-2 gap-5"
							>
								<Field label="الإسم الأول" error={errors.first_name}>
									<div className="relative">
										<FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
										<input
											name="first_name"
											value={form.first_name}
											onChange={handleChange}
											className={inputClass("first_name")}
											placeholder="أدخل الاسم الأول"
											autoComplete="given-name"
										/>
									</div>
								</Field>

								<Field label="الإسم الأخير" error={errors.last_name}>
									<div className="relative">
										<FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
										<input
											name="last_name"
											value={form.last_name}
											onChange={handleChange}
											className={inputClass("last_name")}
											placeholder="أدخل الاسم الأخير"
											autoComplete="family-name"
										/>
									</div>
								</Field>

								<Field
									label="رقم الهاتف"
									error={errors.phone}
									hint="01xxxxxxxxx"
								>
									<div className="relative">
										<FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
										<input
											name="phone"
											value={form.phone}
											onChange={handleChange}
											className={inputClass("phone")}
											placeholder="مثال: 01012345678"
											inputMode="numeric"
										/>
									</div>
								</Field>

								<Field label="البريد الإلكتروني" error={errors.email}>
									<div className="relative">
										<FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
										<input
											name="email"
											type="text"
											value={form.email}
											onChange={handleChange}
											className={inputClass("email")}
											placeholder="example@email.com"
											autoComplete="email"
										/>
									</div>
								</Field>

								<div className="md:col-span-2">
									<Field label="الشركة" error={errors.company}>
										<div className="relative">
											<FiBriefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
											<input
												name="company"
												value={form.company}
												onChange={handleChange}
												className={inputClass("company")}
												placeholder="اسم الشركة"
												autoComplete="organization"
											/>
										</div>
									</Field>
								</div>

								<div className="md:col-span-2">
									<Field label="الرسالة" error={errors.message}>
										<div className="relative">
											<FiMessageSquare className="absolute right-4 top-4 text-slate-400" />
											<textarea
												name="message"
												value={form.message}
												onChange={handleChange}
												rows={6}
												className={textareaClass("message")}
												placeholder="فضلاً اكتب رسالتك بالتفصيل..."
											/>
										</div>
									</Field>
								</div>

								{/* Submit */}
								<div className="md:col-span-2 pt-1">
									<button
										type="submit"
										aria-label="submit form"
										disabled={loading}
										className={`
                      w-full rounded-2xl py-3.5 font-extrabold text-white transition
                      ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-pro hover:opacity-95 active:scale-[0.99]"}
                    `}
									>
										{loading ? (
											<span className="inline-flex items-center justify-center gap-2">
												<span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
												جاري الإرسال...
											</span>
										) : (
											"إرسال الرسالة"
										)}
									</button>

									{!loading && !isValid && Object.keys(errors).length ? (
										<p className="mt-3 text-xs text-slate-500">
											تأكد من إدخال البيانات بشكل صحيح قبل الإرسال.
										</p>
									) : null }
								</div>
							</form>
						</div>
 
					</div>
				</div>
			</div>
		</section>
	);
}
