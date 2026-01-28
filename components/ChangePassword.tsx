"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function ChangePassword() {
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [showOld, setShowOld] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!oldPassword || !newPassword || !confirmPassword) {
			toast.error("جميع الحقول مطلوبة");
			return;
		}

		if (newPassword.length < 8) {
			toast.error("كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("كلمة السر الجديدة وتأكيدها غير متطابقين");
			return;
		}

		if (oldPassword === newPassword) {
			toast.error("كلمة السر الجديدة يجب أن تكون مختلفة عن القديمة");
			return;
		}

		setLoading(true);

		try {
			const token = localStorage.getItem("auth_token");
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						old_password: oldPassword,
						new_password: newPassword,
						new_password_confirmation: confirmPassword,
					}),
				}
			);

			const data = await res.json().catch(() => null);

			if (res.ok && data?.status) {
				toast.success(data?.message || "تم تغيير كلمة السر بنجاح");
				setOldPassword("");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				toast.error(data?.message || "فشل تغيير كلمة السر");
			}
		} catch (err) {
			console.error(err);
			toast.error("خطأ في الاتصال، حاول مرة أخرى");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div dir="rtl" className="space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h4 className="text-base md:text-lg font-extrabold text-slate-900">
						تغيير كلمة السر
					</h4>
					<p className="mt-1 text-sm text-slate-500">
						يفضّل أن تكون كلمة السر قوية (8 أحرف على الأقل).
					</p>
				</div>

				<span className="hidden md:inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
					أمان الحساب
				</span>
			</div>

			<form onSubmit={handleSubmit} className="grid gap-4">
				{/* Old password */}
				<PasswordField
					label="كلمة السر القديمة"
					placeholder="أدخل كلمة السر الحالية"
					value={oldPassword}
					onChange={setOldPassword}
					show={showOld}
					onToggle={() => setShowOld((v) => !v)}
				/>

				{/* New password */}
				<PasswordField
					label="كلمة السر الجديدة"
					placeholder="أدخل كلمة سر جديدة (8 أحرف على الأقل)"
					value={newPassword}
					onChange={setNewPassword}
					show={showNew}
					onToggle={() => setShowNew((v) => !v)}
				/>

				{/* Confirm */}
				<PasswordField
					label="تأكيد كلمة السر الجديدة"
					placeholder="أعد كتابة كلمة السر الجديدة"
					value={confirmPassword}
					onChange={setConfirmPassword}
					show={showConfirm}
					onToggle={() => setShowConfirm((v) => !v)}
				/>

				{/* actions */}
				<div className="flex flex-col md:flex-row md:items-center gap-3 pt-2">
					<button
						type="submit"
						disabled={loading}
						className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition
              ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-pro hover:opacity-95 active:scale-[0.99]"}
            `}
					>
						{loading ? (
							<>
								<span className="inline-block h-5 w-5 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
								جاري التغيير...
							</>
						) : (
							"تغيير كلمة السر"
						)}
					</button>

					<p className="text-xs text-slate-500">
						* يجب أن تحتوي كلمة السر الجديدة على 8 أحرف على الأقل.
					</p>
				</div>
			</form>
		</div>
	);
}

function PasswordField({
	label,
	placeholder,
	value,
	onChange,
	show,
	onToggle,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	show: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="space-y-2">
			<label className="text-sm font-extrabold text-slate-800">{label}</label>

			<div className="relative">
				<input
					type={show ? "text" : "password"}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900
                     placeholder:text-slate-400 outline-none transition
                     focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
				/>

				<button
					type="button"
					onClick={onToggle}
					aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
				>
					{show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
				</button>
			</div>
		</div>
	);
}
