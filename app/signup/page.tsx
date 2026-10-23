"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import Logo from "@/components/Logo";
import PhoneOtpAuthForm from "@/components/PhoneOtpAuthForm";

export default function SignupPage() {
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
						<div className="flex items-center justify-center gap-2 mb-1">
							<FaWhatsapp className="w-5 h-5 text-emerald-400" />
							<h1 className="text-xl text-center md:text-2xl font-extrabold leading-snug">إنشاء حساب جديد</h1>
						</div>
						<p className="text-center text-xs text-slate-300 font-semibold mt-1">
							سجّل برقم جوالك وأكّد رمز واتساب — بدون كلمة مرور
						</p>
					</div>

					<div className="p-7">
						<PhoneOtpAuthForm mode="signup" />
					</div>
				</div>

				<p className="text-center text-xs text-slate-500 font-semibold mt-4">
					بإنشاء حساب أنت توافق على الشروط وسياسة الخصوصية.
				</p>
			</motion.div>
		</div>
	);
}
