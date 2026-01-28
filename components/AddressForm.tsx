"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IoCloseSharp } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { AddressI } from "@/Types/AddressI";

interface AddressFormProps {
	open: boolean;
	onClose: () => void;
	initialData?: AddressI;
	onSuccess?: (newAddress: AddressI) => void;
}

interface AddressFormInputs {
	id?: number;
	firstName: string;
	lastName: string;
	details: string;
	phone: string;
	city: string;
	area: string;
	addressType: string;
}

// ✅ Saudi phone: 05XXXXXXXX OR +9665XXXXXXXX OR 9665XXXXXXXX
const SA_PHONE_REGEX = /^(?:05\d{8}|(?:\+?966)5\d{8})$/;

const schema = yup.object().shape({
	firstName: yup.string().required("الإسم الأول مطلوب"),
	lastName: yup.string().required("الإسم الأخير مطلوب"),
	details: yup.string().required("تفاصيل العنوان مطلوبة"),
	phone: yup
		.string()
		.matches(SA_PHONE_REGEX, "رقم الجوال السعودي غير صحيح")
		.required("رقم الجوال مطلوب"),
	city: yup.string().required("المدينة مطلوبة"),
	area: yup.string().required("المنطقة مطلوبة"),
	addressType: yup.string().required("نوع العنوان مطلوب"),
});

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
				<label className="text-sm font-extrabold text-slate-800">{label}</label>
				{hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
			</div>
			{children}
			{error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
		</div>
	);
}

export default function AddressForm({
	open,
	onClose,
	initialData,
	onSuccess,
}: AddressFormProps) {
	const base_url = process.env.NEXT_PUBLIC_API_URL;
	const [loading, setLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const {
		register,
		handleSubmit,
		setValue,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<AddressFormInputs>({
		resolver: yupResolver(schema),
		mode: "onTouched",
		defaultValues: {
			addressType: "home",
		},
	});

	const selectedType = watch("addressType");
	const isEdit = Boolean(initialData?.id);

	const title = useMemo(
		() => (isEdit ? "تعديل العنوان" : "إضافة عنوان جديد"),
		[isEdit]
	);

	useEffect(() => {
		if (initialData) {
			const parts = (initialData.full_name || "").split(" ");
			setValue("firstName", parts[0] || "");
			setValue("lastName", parts.slice(1).join(" ") || "");
			setValue("details", initialData.details || "");
			setValue("phone", initialData.phone || "");
			setValue("city", initialData.city || "");
			setValue("area", initialData.area || "");
			setValue("addressType", initialData.type || "home");
		} else {
			reset({ addressType: "home" });
		}
	}, [initialData, reset, setValue]);

	const normalizeSaudiPhone = (raw: string) => {
		const v = (raw || "").trim().replace(/\s+/g, "");
		// optional: convert +9665XXXXXXXX -> 05XXXXXXXX
		if (v.startsWith("+9665") && v.length === 13) return "0" + v.slice(4);
		if (v.startsWith("9665") && v.length === 12) return "0" + v.slice(3);
		return v;
	};

	const handleAddAddress = async (data: AddressFormInputs) => {
		try {
			setLoading(true);
			const token = localStorage.getItem("auth_token");

			const normalizedPhone = normalizeSaudiPhone(data.phone);

			const payload = {
				first_name: data.firstName,
				last_name: data.lastName,
				phone: normalizedPhone,
				city: data.city,
				area: data.area,
				address_details: data.details,
				// ✅ no nickname in form; label fallback to full name
				label: `${data.firstName} ${data.lastName}`,
				type: data.addressType,
			};

			let url = `${base_url}/addresses`;
			let method: "POST" | "PUT" = "POST";

			if (initialData?.id) {
				url = `${base_url}/addresses/${initialData.id}`;
				method = "PUT";
			}

			const res = await fetch(url, {
				method,
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			const result = await res.json().catch(() => null);

			if (!res.ok || !result?.status) {
				throw new Error(result?.message || "حدث خطأ");
			}

			toast.success(isEdit ? "تم تعديل العنوان بنجاح" : "تم إضافة العنوان بنجاح", {
				duration: 1200,
			});

			onSuccess?.(result.data);
			reset({ addressType: "home" });

			setTimeout(() => onClose(), 150);
		} catch (err: any) {
			toast.error(err?.message || "حدث خطأ أثناء حفظ العنوان");
		} finally {
			setLoading(false);
		}
	};

	if (!open || !mounted) return null;

	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					dir="rtl"
					className="fixed inset-0 z-[1000000000] grid place-items-center p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
				>
					<motion.div
						className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					/>

					<motion.div
						onClick={(e) => e.stopPropagation()}
						initial={{ y: 18, scale: 0.98, opacity: 0 }}
						animate={{ y: 0, scale: 1, opacity: 1 }}
						exit={{ y: 18, scale: 0.98, opacity: 0 }}
						transition={{ type: "spring", stiffness: 420, damping: 30 }}
						className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
					>
						<div className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 md:p-5">
							<div className="flex items-start justify-between gap-4">
								<div>
									<h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
										{title}
									</h2>
									<p className="mt-1 text-sm text-slate-500">
										املأ البيانات بدقة لتسهيل التوصيل.
									</p>
								</div>

								<button
									onClick={onClose}
									aria-label="close"
									className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 transition"
								>
									<IoCloseSharp size={22} />
								</button>
							</div>
						</div>

						<form onSubmit={handleSubmit(handleAddAddress)}>
							<div className="max-h-[70vh] overflow-y-auto p-4 md:p-6 space-y-6">
								{/* Section: Personal */}
								<div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-base md:text-lg font-extrabold text-slate-900">
											بيانات المستلم
										</h3>
										<span className="text-xs font-bold text-slate-500">(مطلوب)</span>
									</div>

									<div className="grid md:grid-cols-2 gap-4 md:gap-5">
										<Field label="الإسم الأول" error={errors.firstName?.message}>
											<input
												{...register("firstName")}
												className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
														errors.firstName
															? "border-rose-300 focus:ring-4 focus:ring-rose-100"
															: "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
													}`}
												placeholder="مثال: أحمد"
											/>
										</Field>

										<Field label="الإسم الأخير" error={errors.lastName?.message}>
											<input
												{...register("lastName")}
												className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
														errors.lastName
															? "border-rose-300 focus:ring-4 focus:ring-rose-100"
															: "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
													}`}
												placeholder="مثال: محمد"
											/>
										</Field>
									</div>

									<div className="mt-4">
										<Field
											label="رقم الجوال"
											error={errors.phone?.message}
											hint="مثال: 05xxxxxxxx أو +9665xxxxxxxx"
										>
											<input
												{...register("phone")}
												inputMode="numeric"
												className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
														errors.phone
															? "border-rose-300 focus:ring-4 focus:ring-rose-100"
															: "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
													}`}
												placeholder="05xxxxxxxx"
											/>
										</Field>
									</div>
								</div>

								{/* ✅ Section: Location FIRST */}
								<div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
									<h3 className="text-base md:text-lg font-extrabold text-slate-900 mb-4">
										المدينة والمنطقة
									</h3>

									<div className="grid md:grid-cols-2 gap-4 md:gap-5">
										<Field label="المدينة" error={errors.city?.message}>
											<select
												{...register("city")}
												className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition bg-white
                          ${
														errors.city
															? "border-rose-300 focus:ring-4 focus:ring-rose-100"
															: "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
													}`}
											>
												<option value="">اختر المدينة</option>
												{/* بدّل القيم دي بمدن السعودية */}
												<option value="الرياض">الرياض</option>
												<option value="جدة">جدة</option>
												<option value="الدمام">الدمام</option>
											</select>
										</Field>

										<Field label="المنطقة" error={errors.area?.message}>
											<select
												{...register("area")}
												className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition bg-white
                          ${
														errors.area
															? "border-rose-300 focus:ring-4 focus:ring-rose-100"
															: "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
													}`}
											>
												<option value="">اختر المنطقة</option>
												{/* بدّل القيم دي بمناطق/أحياء السعودية */}
												<option value="حي العليا">حي العليا</option>
												<option value="حي النزهة">حي النزهة</option>
												<option value="حي الملقا">حي الملقا</option>
											</select>
										</Field>
									</div>

									<div className="mt-5">
										<Field label="نوع العنوان" error={errors.addressType?.message}>
											<div className="flex gap-3">
												{[
													{ value: "home", label: "منزل" },
													{ value: "work", label: "عمل" },
												].map((btn) => (
													<button
														key={btn.value}
														type="button"
														onClick={() =>
															setValue("addressType", btn.value, {
																shouldValidate: true,
															})
														}
														className={`px-5 py-2.5 rounded-xl font-extrabold border transition
                              ${
																selectedType === btn.value
																	? "bg-pro text-white border-pro shadow-sm"
																	: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
															}`}
													>
														{btn.label}
													</button>
												))}
											</div>
										</Field>
									</div>
								</div>

								{/* ✅ Section: Address details AFTER city/area */}
								<div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
									<h3 className="text-base md:text-lg font-extrabold text-slate-900 mb-4">
										تفاصيل العنوان
									</h3>

									<Field label="تفاصيل العنوان" error={errors.details?.message}>
										<textarea
											{...register("details")}
											rows={3}
											className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition resize-none
                        ${
													errors.details
														? "border-rose-300 focus:ring-4 focus:ring-rose-100"
														: "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
												}`}
											placeholder="اسم الشارع، رقم المبنى، رقم الشقة، أقرب معلم..."
										/>
									</Field>
								</div>
							</div>

							<div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/90 backdrop-blur p-4 md:p-5 flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={onClose}
									className="rounded-xl px-5 py-3 text-sm font-extrabold text-slate-700 bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100 transition"
								>
									إلغاء
								</button>

								<button
									type="submit"
									disabled={loading || isSubmitting}
									className={`rounded-xl px-7 py-3 text-sm font-extrabold text-white transition
                    ${
											loading || isSubmitting
												? "bg-slate-400 cursor-not-allowed"
												: "bg-pro hover:opacity-95 active:scale-[0.99]"
										}
                  `}
								>
									{loading || isSubmitting ? (
										<span className="inline-flex items-center gap-2">
											<span className="h-5 w-5 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
											جارٍ الحفظ...
										</span>
									) : (
										"حفظ العنوان"
									)}
								</button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body
	);
}
