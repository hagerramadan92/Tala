"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type FaqItem = {
	id: number;
	question: string;
	answer: string;
};

export default function WhyAndFaqs() {
	const whyChooseUs = useMemo(
		() => [
			{
				title: "جودة مضمونة",
				desc: "منتجات مختارة بعناية ومعايير فحص قبل الشحن.",
			},
			{
				title: "شحن سريع",
				desc: "تجهيز سريع للطلبات وتوصيل موثوق.",
			},
			{
				title: "دفع آمن",
				desc: "بوابات دفع موثوقة مع حماية بياناتك.",
			},
			{
				title: "دعم مميز",
				desc: "فريق خدمة عملاء جاهز لمساعدتك دائمًا.",
			},
		],
		[]
	);

	// ✅ FAQs from API
	const [faqs, setFaqs] = useState<FaqItem[]>([]);
	const [faqsLoading, setFaqsLoading] = useState(true);
	const [faqsError, setFaqsError] = useState<string | null>(null);

	// ✅ Accordion state
	const [openFaq, setOpenFaq] = useState<number | null>(0);

	useEffect(() => {
		let mounted = true;

		const loadFaqs = async () => {
			setFaqsLoading(true);
			setFaqsError(null);

			try {
				const base = process.env.NEXT_PUBLIC_API_URL;
				if (!base) {
					throw new Error("NEXT_PUBLIC_API_URL is not defined");
				}

				const res = await fetch(`${base}/faqs`, {
					method: "GET",
					headers: { Accept: "application/json" },
					cache: "no-store",
				});

				if (!res.ok) {
					throw new Error(`Failed to fetch faqs (${res.status})`);
				}

				const json = await res.json();

				const list: FaqItem[] = Array.isArray(json?.data) ? json.data : [];
				if (!mounted) return;

				setFaqs(list);
				setOpenFaq(list.length > 0 ? 0 : null);
			} catch (e: any) {
				if (!mounted) return;
				setFaqs([]);
				setOpenFaq(null);
				setFaqsError(e?.message || "Failed to load FAQs");
			} finally {
				if (!mounted) return;
				setFaqsLoading(false);
			}
		};

		loadFaqs();

		return () => {
			mounted = false;
		};
	}, []);

	// ✅ Testimonials (static for now)
	const testimonials = useMemo(
		() => [
			{
				name: "سارة",
				city: "الرياض",
				rating: 5,
				text: "المنتجات ممتازة والتوصيل كان سريع جدًا. تجربة شراء سهلة وسلسة.",
			},
			{
				name: "محمد",
				city: "جدة",
				rating: 5,
				text: "جودة عالية وسعر مناسب. وخدمة العملاء ردّت بسرعة وساعدتني.",
			},
			{
				name: "نورة",
				city: "الدمام",
				rating: 4,
				text: "التغليف مرتب والطلب وصل بدون أي مشاكل. أكيد هأعيد الطلب مرة ثانية.",
			},
		],
		[]
	);

	// ✅ Why Tala (highlights)
	const whyTala = useMemo(
		() => [
			{
				title: "اختيار ذكي",
				desc: "منتجات مختارة بعناية تناسب احتياجك اليومي.",
			},
			{
				title: "ثقة وشفافية",
				desc: "معلومات واضحة وسياسات سهلة ومباشرة.",
			},
			{
				title: "تجربة سلسة",
				desc: "من التصفح للدفع للتوصيل… كل شيء مصمم لراحتك.",
			},
		],
		[]
	);

	const Stars = ({ value }: { value: number }) => {
		const full = Math.max(0, Math.min(5, value));
		return (
			<div className="flex items-center gap-1">
				{Array.from({ length: 5 }).map((_, i) => (
					<span key={i} className={`text-sm ${i < full ? "text-amber-500" : "text-slate-200"}`}>
						★
					</span>
				))}
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-10">
			{/* ✅ Why Tala */}
			<section className="rounded-3xl border border-slate-100 bg-[#14213d] text-white shadow-sm overflow-hidden">
				<div className="p-6 md:p-10">
					<div className="flex items-end justify-between gap-6 flex-wrap">
						<div>
							<h2 className="text-xl md:text-3xl font-extrabold">
								لماذا تالا؟
							</h2>
							<p className="mt-2 text-white/80 text-sm md:text-base max-w-2xl">
								لأننا نهتم بالتفاصيل… ونخلي تجربة الشراء أسهل وأجمل.
							</p>
						</div>

						<div className="flex gap-3">
							<Link
								href="/category"
								className="inline-flex items-center justify-center rounded-2xl px-4 py-3 font-extrabold bg-white text-[#14213d] hover:bg-white/90 transition"
							>
								ابدأ التسوق
							</Link>
							<Link
								href="/contact"
								className="inline-flex items-center justify-center rounded-2xl px-4 py-3 font-extrabold border border-white/20 bg-white/10 hover:bg-white/15 transition"
							>
								تواصل معنا
							</Link>
						</div>
					</div>

					<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
						{whyTala.map((x, idx) => (
							<div
								key={idx}
								className="rounded-2xl border border-white/10 bg-white/5 p-6"
							>
								<div className="text-sm font-extrabold text-white/70">
									0{idx + 1}
								</div>
								<h3 className="mt-2 text-lg font-extrabold">{x.title}</h3>
								<p className="mt-2 text-sm text-white/75 leading-relaxed">
									{x.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ✅ FAQS (Only Questions & Answers) */}
			<section className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
				<div className="p-6 md:p-10">
					<div className="flex items-end justify-between gap-6 flex-wrap">
						<div>
							<h2 className="text-xl md:text-3xl font-extrabold text-[#14213d]">
								الأسئلة الشائعة
							</h2>
							<p className="mt-2 text-slate-600 text-sm md:text-base max-w-2xl">
								إجابات سريعة لأكثر الأسئلة تكرارًا.
							</p>
						</div>
					</div>

					{/* Loading / Error / Empty */}
					{faqsLoading ? (
						<div className="mt-8">
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 animate-pulse h-16" />
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 animate-pulse h-16 mt-3" />
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 animate-pulse h-16 mt-3" />
						</div>
					) : faqsError ? (
						<div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5">
							<p className="font-extrabold text-rose-700">تعذّر تحميل الأسئلة الشائعة</p>
							<p className="mt-1 text-sm text-rose-700/80">{faqsError}</p>
						</div>
					) : faqs.length === 0 ? (
						<div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
							<p className="font-bold text-slate-600">لا توجد أسئلة شائعة حالياً.</p>
						</div>
					) : (
						<div className="mt-8 flex flex-col gap-3">
							{faqs.map((item, idx) => {
								const isOpen = openFaq === idx;

								return (
									<div
										key={item.id}
										className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
									>
										<button
											type="button"
											onClick={() => setOpenFaq(isOpen ? null : idx)}
											className="w-full flex items-center justify-between gap-4 p-5 text-left"
										>
											<span className="font-extrabold text-[#14213d]">{item.question}</span>

											<span
												className={`shrink-0 w-9 h-9 rounded-2xl border border-slate-200 flex items-center justify-center transition ${
													isOpen ? "bg-[#14213d] text-white" : "bg-white text-slate-700"
												}`}
											>
												<ChevronDown
													size={18}
													className={`transition ${isOpen ? "rotate-180" : ""}`}
												/>
											</span>
										</button>

										<div
											className={`grid transition-all duration-300 ease-out ${
												isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
											}`}
										>
											<div className="overflow-hidden">
												<p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
													{item.answer}
												</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</section>

			{/* ✅ Testimonials (Ar'a2 Al-3omala2) */}
			<section className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
				<div className="p-6 md:p-10 relative">
					<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50" />
					<div className="relative">
						<h2 className="text-xl md:text-3xl font-extrabold text-[#14213d]">
							آراء العملاء
						</h2>
						<p className="mt-2 text-slate-600 text-sm md:text-base max-w-2xl">
							بعض من تقييمات عملائنا اللي نفخر بيها 💛
						</p>

						<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
							{testimonials.map((t, idx) => (
								<div
									key={idx}
									className="rounded-2xl border border-slate-100 bg-white/80 backdrop-blur p-6 shadow-sm hover:shadow-md transition"
								>
									<Stars value={t.rating} />
									<p className="mt-3 text-sm text-slate-700 leading-relaxed">
										“{t.text}”
									</p>

									<div className="mt-5 flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-2xl bg-[#14213d] text-white flex items-center justify-center font-extrabold">
												{t.name.slice(0, 1)}
											</div>
											<div>
												<p className="font-extrabold text-[#14213d]">{t.name}</p>
												<p className="text-xs text-slate-500">{t.city}</p>
											</div>
										</div> 
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			
		</div>
	);
}
