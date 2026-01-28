"use client";

import React, { useState, useEffect } from "react";
import ChangePassword from "./ChangePassword";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
	HiOutlineShieldCheck,
	HiOutlineUserCircle,
	HiOutlineEnvelope,
	HiOutlineKey,
} from "react-icons/hi2";

export default function MangeAccount() {
	const [showChangePassword, setShowChangePassword] = useState(false);

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");

	const router = useRouter();

	const fetchUserData = async (token: string) => {
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			});

			const data = await res.json();

			if (!data.status) {
				Swal.fire({
					icon: "error",
					title: "خطأ",
					text: data.message || "حدث خطأ أثناء تحميل البيانات",
				});
				return;
			}

			const fullName = data?.data?.name || "";
			const nameParts = fullName.split(" ");

			setFirstName(nameParts[0] || "");
			setLastName(nameParts.slice(1).join(" ") || "");
			setEmail(data?.data?.email || "");
		} catch {
			Swal.fire({
				icon: "error",
				title: "خطأ في الاتصال",
				text: "تعذر الاتصال بالسيرفر",
			});
		}
	};

	useEffect(() => {
		const token = localStorage.getItem("auth_token");

		if (!token) {
			Swal.fire({
				icon: "warning",
				title: "يجب تسجيل الدخول",
				text: "فضلاً قم بتسجيل الدخول أولاً",
			});
			router.push("/login");
			return;
		}

		fetchUserData(token);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div dir="rtl" className="space-y-6">
			{/* Account Card */}
			<section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<div className="flex items-start gap-3 p-5 md:p-6 bg-gradient-to-b from-slate-50 to-white">
					<div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-pro/10 text-pro ring-1 ring-pro/15">
						<HiOutlineUserCircle size={22} />
					</div>

					<div className="flex-1">
						<h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
							حسابي
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							حدّث بياناتك الأساسية لتكون تجربة الشراء أسرع وأسهل.
						</p>
					</div>

					{/* Optional save (placeholder) */}
					<button
						type="button"
						className="hidden md:inline-flex items-center justify-center rounded-xl bg-pro px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95 active:opacity-90 transition"
						onClick={() => {
							Swal.fire({
								icon: "info",
								title: "قريبًا",
								text: "زر الحفظ جاهز—اربطه بـ API تحديث البيانات عندك.",
							});
						}}
					>
						حفظ التغييرات
					</button>
				</div>

				<div className="p-5 md:p-6">
					<form className="grid md:grid-cols-2 gap-4 md:gap-6">
						<Field
							label="الإسم الأول"
							placeholder="أدخل الاسم الأول"
							value={firstName}
							onChange={setFirstName}
						/>
						<Field
							label="الإسم الأخير"
							placeholder="أدخل الاسم الأخير"
							value={lastName}
							onChange={setLastName}
						/>
					</form>

					<div className="mt-4 md:hidden">
						<button
							type="button"
							className="w-full rounded-xl bg-pro px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:opacity-95 active:opacity-90 transition"
							onClick={() => {
								Swal.fire({
									icon: "info",
									title: "قريبًا",
									text: "زر الحفظ جاهز—اربطه بـ API تحديث البيانات عندك.",
								});
							}}
						>
							حفظ التغييرات
						</button>
					</div>
				</div>
			</section>

			{/* Security Card */}
			<section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<div className="flex items-start gap-3 p-5 md:p-6 bg-gradient-to-b from-slate-50 to-white">
					<div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15">
						<HiOutlineShieldCheck size={22} />
					</div>

					<div className="flex-1">
						<h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
							الحماية
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							تحكم في بيانات الدخول ووسائل الأمان لحسابك.
						</p>
					</div>
				</div>

				<div className="p-5 md:p-6 space-y-3">
					{/* Password expandable row */}
					<div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
						<div className="flex items-center justify-between gap-4 p-4">
							<div className="flex items-start gap-3 min-w-0">
								<div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
									<HiOutlineKey size={20} />
								</div>

								<div className="min-w-0">
									<div className="text-sm md:text-base font-extrabold text-slate-900">
										كلمة المرور
									</div>
									<div className="mt-1 text-xs md:text-sm text-slate-500">
										ننصح بتغيير كلمة المرور بشكل دوري.
									</div>
								</div>
							</div>

							<button
								type="button"
								onClick={() => setShowChangePassword((v) => !v)}
								className="rounded-xl bg-pro/10 px-3 py-2 text-sm font-extrabold text-pro ring-1 ring-pro/15 hover:bg-pro/15 transition"
							>
								{showChangePassword ? "إلغاء" : "تغيير"}
							</button>
						</div>

						<AnimatePresence initial={false}>
							{showChangePassword && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.35, ease: "easeInOut" }}
									className="overflow-hidden border-t border-slate-200 bg-slate-50"
								>
									<div className="p-4 md:p-6">
										<ChangePassword />
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Email row */}
					<SettingRow
						icon={<HiOutlineEnvelope size={20} />}
						title="البريد الإلكتروني"
						description="مُستخدم لتأكيد الطلبات والإشعارات."
						
						right={
							<div className="max-w-[240px] md:max-w-[360px] truncate rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
								{email || "—"}
							</div>
						}
					/>
				</div>
			</section>
		</div>
	);
}

/* ---------------- Small UI helpers ---------------- */

function Field({
	label,
	placeholder,
	value,
	onChange,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div className="space-y-2">
			<label className="text-sm font-extrabold text-slate-800">{label}</label>
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900
                   placeholder:text-slate-400 outline-none transition
                   focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
			/>
		</div>
	);
}

function SettingRow({
	icon,
	title,
	description,
	right,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	right: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-start gap-3 min-w-0">
				<div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
					{icon}
				</div>
				<div className="min-w-0">
					<div className="text-sm md:text-base font-extrabold text-slate-900">
						{title}
					</div>
					<div className="mt-1 text-xs md:text-sm text-slate-500">
						{description}
					</div>
				</div>
			</div>

			<div className="shrink-0">{right}</div>
		</div>
	);
}
