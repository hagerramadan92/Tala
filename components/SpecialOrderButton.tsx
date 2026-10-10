"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { Wand2, X, Package, Phone, Layers, FileText, Send, CheckCircle2 } from "lucide-react";
import { useAppContext } from "../src/context/AppContext";
import { usePathname } from "next/navigation";

export default function SpecialOrderButton() {
	const { socialMedia } = useAppContext() as any;
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	// Form state
	const [productName, setProductName] = useState("");
	const [quantity, setQuantity] = useState("");
	const [phone, setPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	// Extract WhatsApp number with reliable fallback
	const whatsappNumber = useMemo(() => {
		if (Array.isArray(socialMedia)) {
			const whatsappItem = socialMedia.find(
				(s: any) => s.key === "whatsapp" && s.value
			);
			if (whatsappItem) {
				const value = String(whatsappItem.value).trim();
				const digits = value.replace(/[^\d]/g, "");
				if (digits) return digits;
			}
		}
		return "966573515463"; // Fallback to store number
	}, [socialMedia]);

	// Responsive bottom position (elevate on mobile product page to not clash with checkout bar)
	const isProductPage = useMemo(() => {
		return (
			/^\/product\/[^\/]+$/.test(pathname || "") ||
			/^\/products\/[^\/]+$/.test(pathname || "")
		);
	}, [pathname]);

	// Close modal on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		if (isOpen) {
			window.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
		}
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const newErrors: { [key: string]: string } = {};
		if (!productName.trim()) {
			newErrors.productName = "يرجى كتابة اسم المنتج أو فكرة الطلب";
		}
		if (!quantity.trim()) {
			newErrors.quantity = "يرجى تحديد الكمية التقريبية المطلوبة";
		}
		if (!phone.trim()) {
			newErrors.phone = "يرجى إدخال رقم الجوال للتواصل";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setErrors({});

		// Format WhatsApp Message
		const message =
			`🌟 *طلب خاص جديد من متجر تالا الجزيرة* 🌟\n\n` +
			`📦 *المنتج / فكرة الطلب:* ${productName.trim()}\n` +
			`🔢 *الكمية المطلوبة:* ${quantity.trim()}\n` +
			`📱 *رقم الجوال للتواصل:* ${phone.trim()}\n` +
			(notes.trim() ? `📝 *تفاصيل وملاحظات إضافية:*\n${notes.trim()}\n\n` : `\n`) +
			`----------------------------------\n` +
			`🌐 تم الإرسال عبر نافذة الطلبات الخاصة`;

		const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
			message
		)}`;

		setIsSubmitted(true);

		// Open WhatsApp
		window.open(waUrl, "_blank", "noopener,noreferrer");

		// Reset & Close after 1.5s
		setTimeout(() => {
			setIsSubmitted(false);
			setIsOpen(false);
			setProductName("");
			setQuantity("");
			setPhone("");
			setNotes("");
		}, 1500);
	};

	return (
		<>
			{/* Floating "طلبات خاصة" Button */}
			<motion.button
				onClick={() => setIsOpen(true)}
				aria-label="طلب خاص"
				initial={{ opacity: 0, scale: 0.8, x: -40 }}
				animate={{ opacity: 1, scale: 1, x: 0 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className={[
					"fixed left-4 md:left-6 z-[9998] flex items-center gap-2 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300",
					"bg-[#0C182A] border-2 border-[#F39200] text-white",
					// Responsive bottom: match WhatsApp button on product page
					"bottom-5",
					isProductPage ? "max-sm:bottom-[200px] !left-3" : "",
				].join(" ")}
			>
				{/* Magic Wand Icon in Orange Circle */}
				<div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#F39200] flex items-center justify-center shadow-md shrink-0">
					<Wand2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
				</div>

				{/* Label */}
				<span className="font-extrabold text-white text-[11px] md:text-xs tracking-wide pl-1 select-none">
					طلبات خاصة
				</span>
			</motion.button>

			{/* Modal Popup */}
			<AnimatePresence>
				{isOpen && (
					<div
						className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
						onClick={(e) => {
							if (e.target === e.currentTarget) setIsOpen(false);
						}}
						dir="rtl"
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							transition={{ duration: 0.2 }}
							className="relative w-full max-w-lg bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
						>
							{/* Modal Header */}
							<div className="relative bg-gradient-to-r from-[#0C182A] to-[#162744] p-5 md:p-6 text-white">
								{/* Close Button */}
								<button
									onClick={() => setIsOpen(false)}
									className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
									aria-label="إغلاق"
								>
									<X className="w-5 h-5" />
								</button>

								<div className="flex items-center gap-3">
									<div className="w-11 h-11 rounded-2xl bg-[#F39200] flex items-center justify-center shadow-lg shrink-0">
										<Wand2 className="w-6 h-6 text-white" />
									</div>
									<div>
										<h3 className="text-lg md:text-xl font-black text-white">
											طلب منتج بمواصفات خاصة
										</h3>
										<p className="text-xs md:text-sm text-slate-300 mt-0.5">
											أدخل تفاصيل طلبك وسنقوم بالرد عليك مباشرة وتأكيده عبر واتساب
										</p>
									</div>
								</div>
							</div>

							{/* Form Body */}
							{isSubmitted ? (
								<div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
									<div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4 animate-bounce">
										<CheckCircle2 className="w-10 h-10" />
									</div>
									<h4 className="text-xl font-bold text-slate-900 mb-2">
										جاري تحويلك إلى الواتساب...
									</h4>
									<p className="text-sm text-slate-500">
										شكراً لك! سيتم فتح محادثة الواتساب بالتفاصيل المكتوبة مباشرة.
									</p>
								</div>
							) : (
								<form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
									{/* Field: Product Name */}
									<div>
										<label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
											<Package className="w-4 h-4 text-[#F39200]" />
											اسم المنتج أو فكرة الطلب <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											value={productName}
											onChange={(e) => setProductName(e.target.value)}
											placeholder="مثال: بوكسات تغليف مقاس 25×15 بتصميم خاص"
											className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition ${
												errors.productName
													? "border-red-400 ring-2 ring-red-100"
													: "border-slate-200 focus:border-[#F39200] focus:ring-2 focus:ring-[#F39200]/10"
											}`}
										/>
										{errors.productName && (
											<p className="text-xs text-red-500 mt-1">{errors.productName}</p>
										)}
									</div>

									{/* Field: Quantity & Phone in 2 cols */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
										{/* Quantity */}
										<div>
											<label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
												<Layers className="w-4 h-4 text-[#F39200]" />
												الكمية المطلوبة <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												value={quantity}
												onChange={(e) => setQuantity(e.target.value)}
												placeholder="مثال: 500 حبة"
												className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition ${
													errors.quantity
														? "border-red-400 ring-2 ring-red-100"
														: "border-slate-200 focus:border-[#F39200] focus:ring-2 focus:ring-[#F39200]/10"
												}`}
											/>
											{errors.quantity && (
												<p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
											)}
										</div>

										{/* Phone */}
										<div>
											<label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
												<Phone className="w-4 h-4 text-[#F39200]" />
												رقم الجوال <span className="text-red-500">*</span>
											</label>
											<input
												type="tel"
												dir="ltr"
												value={phone}
												onChange={(e) => setPhone(e.target.value)}
												placeholder="05xxxxxxxx"
												className={`w-full px-3.5 py-2.5 text-sm rounded-xl border text-right bg-slate-50/50 focus:bg-white focus:outline-hidden transition ${
													errors.phone
														? "border-red-400 ring-2 ring-red-100"
														: "border-slate-200 focus:border-[#F39200] focus:ring-2 focus:ring-[#F39200]/10"
												}`}
											/>
											{errors.phone && (
												<p className="text-xs text-red-500 mt-1">{errors.phone}</p>
											)}
										</div>
									</div>

									{/* Field: Notes / Details */}
									<div>
										<label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
											<FileText className="w-4 h-4 text-[#F39200]" />
											ملاحظات أو مواصفات إضافية (اختياري)
										</label>
										<textarea
											rows={3}
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											placeholder="اكتب أي تفاصيل أخرى مثل: الألوان، نوع الخامة، خيارات الطباعة (لامع/مطفي)..."
											className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#F39200] focus:ring-2 focus:ring-[#F39200]/10 transition resize-none"
										/>
									</div>

									{/* Action Button */}
									<div className="pt-2">
										<button
											type="submit"
											className="w-full py-3 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white font-bold text-sm md:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-green-600/20 hover:shadow-xl transition-all cursor-pointer"
										>
											<FaWhatsapp className="w-5 h-5 text-white" />
											<span>إرسال الطلب عبر واتساب</span>
										</button>
										<p className="text-center text-[11px] text-slate-400 mt-2">
											سيتم فتح تطبيق الواتساب مباشرة مع كافة التفاصيل المدخلة للتواصل مع فريق المبيعات
										</p>
									</div>
								</form>
							)}
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
}

