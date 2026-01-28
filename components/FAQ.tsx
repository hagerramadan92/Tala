"use client";

import { useEffect, useMemo, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

interface FAQItem {
	id: number;
	question: string;
	answer: string;
}

/* ---------------- Skeleton ---------------- */

function Sk({ className = "" }: { className?: string }) {
	return (
		<div
			className={[
				"relative overflow-hidden rounded-xl bg-gray-200 ring-1 ring-black/5",
				"animate-pulse",
				className,
			].join(" ")}
		/>
	);
}

function FAQSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div dir="rtl" className="container py-6 space-y-5">
			<div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
				<Sk className="h-7 w-40" />
				<Sk className="mt-3 h-11 w-full rounded-2xl" />
			</div>

			<div className="space-y-4">
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={i}
						className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
					>
						<div className="flex items-center justify-between gap-3">
							<Sk className="h-5 w-3/4" />
							<Sk className="h-9 w-9 rounded-xl" />
						</div>
						<Sk className="mt-3 h-4 w-11/12" />
						<Sk className="mt-2 h-4 w-9/12" />
					</div>
				))}
			</div>
		</div>
	);
}

/* ---------------- Page ---------------- */

export default function FAQPage() {
	const [faqs, setFaqs] = useState<FAQItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [openId, setOpenId] = useState<number | null>(null);
	const [q, setQ] = useState("");

	const base_url = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		const fetchFAQs = async () => {
			try {
				const res = await fetch(`${base_url}/faqs`, { cache: "no-store" });
				const data = await res.json();
				if (data?.status) {
					setFaqs(data.data || []);
					// افتح أول سؤال بشكل لطيف (اختياري)
					if (Array.isArray(data.data) && data.data.length) {
						setOpenId(data.data[0].id);
					}
				} else {
					setFaqs([]);
				}
			} catch (err) {
				console.error(err);
				setFaqs([]);
			} finally {
				setLoading(false);
			}
		};

		fetchFAQs();
	}, [base_url]);

	const filteredFaqs = useMemo(() => {
		const s = q.trim();
		if (!s) return faqs;

		return faqs.filter(
			(f) => f.question.includes(s) || f.answer.includes(s)
		);
	}, [faqs, q]);

	if (loading) return <FAQSkeleton count={6} />;

	return (
		<div dir="rtl" className="container py-6 space-y-5">
			{/* Header */}
			<div className="md:rounded-3xl md:border md:border-slate-200 md:bg-white md:shadow-sm md:overflow-hidden">
				<div className="  md:p-7 md:bg-gradient-to-l md:from-pro/10 md:via-transparent md:to-transparent">
					<h1 className=" max-md:text-center text-2xl md:text-3xl font-extrabold text-slate-900">
						الأسئلة الشائعة
					</h1>
					<p className=" max-md:text-center mt-2 text-sm md:text-base text-slate-600">
						ابحث عن إجابتك بسرعة أو افتح السؤال لمعرفة التفاصيل.
					</p>

					{/* Search */}
					<div className=" hidden md:flex mt-4 flex-col md:flex-row md:items-center gap-3">
						<div className="relative flex-1">
							<FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
							<input
								value={q}
								onChange={(e) => setQ(e.target.value)}
								placeholder="ابحث: استرجاع، شحن، ضمان..."
								className="
                  w-full rounded-2xl border border-slate-200 bg-white
                  pl-10 pr-4 py-3 text-sm font-semibold text-slate-900
                  placeholder:text-slate-400 outline-none transition
                  focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200
                "
							/>
						</div>

						<div className="inline-flex items-center justify-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200">
							{filteredFaqs.length} نتيجة
						</div>
					</div>
				</div>
			</div>

			{/* Empty */}
			{filteredFaqs.length === 0 ? (
				<div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-7 text-center">
					<p className="text-slate-900 font-extrabold text-lg">
						لا توجد أسئلة مطابقة للبحث
					</p>
					<p className="mt-2 text-sm text-slate-600">
						جرّب كلمات أخرى مثل: استرجاع، شحن، ضمان.
					</p>

					<button
						onClick={() => setQ("")}
						className="mt-4 rounded-2xl bg-pro px-6 py-3 text-sm font-extrabold text-white hover:opacity-95 transition"
					>
						مسح البحث
					</button>
				</div>
			) : (
				<div className="space-y-4">
					{filteredFaqs.map((faq) => {
						const isOpen = openId === faq.id;

						return (
							<div
								key={faq.id}
								className="
                  rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden
                  hover:border-slate-200 transition
                "
							>
								{/* Title */}
								<button
									aria-label="toggle faq"
									onClick={() => setOpenId(isOpen ? null : faq.id)}
									className="
                    w-full flex items-center justify-between gap-3
                    p-4 md:p-5 text-right cursor-pointer
                    bg-white hover:bg-slate-50 transition
                  "
								>
									<div className="min-w-0">
										<p className="text-slate-900 font-extrabold text-base md:text-lg">
											{faq.question}
										</p>
										<p className="mt-1 text-xs md:text-sm text-slate-500 line-clamp-1">
											اضغط لعرض الإجابة
										</p>
									</div>

									<motion.span
										animate={{ rotate: isOpen ? 180 : 0 }}
										transition={{ type: "spring", stiffness: 260, damping: 20 }}
										className="
                      grid place-items-center h-10 w-10 rounded-xl
                      bg-slate-50 text-slate-700 ring-1 ring-slate-200
                      shrink-0
                    "
									>
										<IoIosArrowDown />
									</motion.span>
								</button>

								{/* Answer (framer height auto) */}
								<AnimatePresence initial={false}>
									{isOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.25, ease: "easeInOut" }}
											className="overflow-hidden"
										>
											<div className="px-4 md:px-5 py-3 ">
												<div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
													<p className="text-slate-700 text-sm md:text-base leading-7 whitespace-pre-line">
														{faq.answer}
													</p>
												</div>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
