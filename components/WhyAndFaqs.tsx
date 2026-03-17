"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
// استيراد مكتبة Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

// استيراد أنماط Swiper
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

type FaqItem = {
	id: number;
	question: string;
	answer: string;
};

// ✅ إضافة نوع بيانات الشهادة (Testimonial)
type TestimonialItem = {
	id: number;
	name: string;
	city: string;
	rating: number;
	review: string;
	avatar: string | null;
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

	// ✅ Testimonials from API
	const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
	const [testimonialsLoading, setTestimonialsLoading] = useState(true);
	const [testimonialsError, setTestimonialsError] = useState<string | null>(null);

	// ✅ Accordion state
	const [openFaq, setOpenFaq] = useState<number | null>(0);

	// ✅ جلب البيانات عند تحميل المكون
	useEffect(() => {
		let mounted = true;

		const loadData = async () => {
			// جلب الأسئلة الشائعة
			await loadFaqs(mounted);
			// جلب آراء العملاء
			await loadTestimonials(mounted);
		};

		loadData();

		return () => {
			mounted = false;
		};
	}, []);

	// ✅ دالة جلب الأسئلة الشائعة
	const loadFaqs = async (mounted: boolean) => {
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

	// ✅ دالة جلب آراء العملاء من الرابط الجديد
	const loadTestimonials = async (mounted: boolean) => {
		setTestimonialsLoading(true);
		setTestimonialsError(null);

		try {
			// استخدام الرابط المباشر للـ API
			const res = await fetch("https://dashboard.talaaljazeera.com/api/v1/testimonials", {
				method: "GET",
				headers: { Accept: "application/json" },
				cache: "no-store",
			});

			if (!res.ok) {
				throw new Error(`Failed to fetch testimonials (${res.status})`);
			}

			const json = await res.json();

			// التحقق من بنية الاستجابة (status, data)
			if (json.status === true && Array.isArray(json.data)) {
				if (!mounted) return;
				setTestimonials(json.data);
			} else {
				throw new Error("Invalid response format");
			}
		} catch (e: any) {
			if (!mounted) return;
			setTestimonials([]);
			setTestimonialsError(e?.message || "Failed to load testimonials");
		} finally {
			if (!mounted) return;
			setTestimonialsLoading(false);
		}
	};

	// ✅ Why Tala (highlights)
	const whyTala = useMemo(
		() => [
			{
				title: "إرث مهني",
				desc: "منذ انطالقتنا، تراكمت خبراتنا لتصبح الركيزة الأساسية التي نعتمد عليها في فهم احتياجاتكم فنحن لا نقدم مجرد خدمات بل نضع بين ايديكم حصيلة خبرتنا و المعرفة العميقه بمتطلبات السوق .",
			},
			{
				title: "جودة راسخة",
				desc: " نؤمن بأن الجودة ليست مجرد شعار، بل هي التزام يبدأ من انتقاء افضل المواد وصولا الي ادق تفاصيل التنفيذ  و نحرص علي تقديم معايير استثنائية تضمن لكم القيمة المستدامة التي تليق بكم .",
			},
			{
				title: "رعاية دائمة",
				desc: "ألنكم أولوية لنا، صممنا منظومة خدمة متكاملة تهدف إلى جعل رحلتكم معنا ميسرة ز ممتعة حيث نرافقكم بأهتمام بالغ في كل خطوة لنضمن لكم تجربة شراء سلسةو تواصلا فعالا يلبي تطلعاتكم .",
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

	// ✅ دالة لاستخراج الحرف الأول من الاسم (للأفاتار)
	const getInitial = (name: string) => {
		return name.charAt(0);
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
							بخبرة ممتدة لعقدان من التميز جعلتنا نعتني بأدق التفاصيل اللتي تهمكم و نبتكر لكم تجربة شراء استثنائية تليق بكم.
							</p>
						</div>

						<div className="flex gap-3">
							<Link
								href="/category"
								className="inline-flex items-center justify-center rounded-lg md:md:rounded-2xl rounded-lg md:px-4 md:py-3 p-2 font-extrabold bg-white text-[#14213d] hover:bg-white/90 transition"
							>
								ابدأ التسوق
							</Link>
							<Link
								href="/contactUs"
								className="inline-flex items-center justify-center rounded-lg md:md:rounded-2xl rounded-lg md:px-4 md:py-3 p-2  font-extrabold border border-white/20 bg-white/10 hover:bg-white/15 transition"
							>
								تواصل معنا
							</Link>
						</div>
					</div>

					<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
						{whyTala.map((x, idx) => (
							<div
								key={idx}
								className="md:rounded-2xl rounded-lg border border-white/10 bg-white/5 p-6"
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
							<div className="md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-5 animate-pulse h-16" />
							<div className="md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-5 animate-pulse h-16 mt-3" />
							<div className="md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-5 animate-pulse h-16 mt-3" />
						</div>
					) : faqsError ? (
						<div className="mt-8 md:rounded-2xl rounded-lg border border-rose-200 bg-rose-50 p-5">
							<p className="font-extrabold text-rose-700">تعذّر تحميل الأسئلة الشائعة</p>
							<p className="mt-1 text-sm text-rose-700/80">{faqsError}</p>
						</div>
					) : faqs.length === 0 ? (
						<div className="mt-8 md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-5">
							<p className="font-bold text-slate-600">لا توجد أسئلة شائعة حالياً.</p>
						</div>
					) : (
						<div className="mt-8 flex flex-col gap-3">
							{faqs.map((item, idx) => {
								const isOpen = openFaq === idx;

								return (
									<div
										key={item.id}
										className="md:rounded-2xl rounded-lg border border-slate-200 bg-white overflow-hidden"
									>
										<button
											type="button"
											onClick={() => setOpenFaq(isOpen ? null : idx)}
											className="w-full flex items-center justify-between gap-4 p-5 text-start"
										>
											<span className="font-extrabold text-[#14213d]">{item.question}</span>

											<span
												className={`shrink-0 w-9 h-9 md:rounded-2xl rounded-lg border border-slate-200 flex items-center justify-center transition ${
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

			{/* ✅ Testimonials (Ar'a2 Al-3omala2) - Slider مع بيانات من API */}
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

						{/* حالات التحميل والخطأ والبيانات الفارغة */}
						{testimonialsLoading ? (
							<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
								{[1, 2, 3].map((i) => (
									<div key={i} className="md:rounded-2xl rounded-lg border border-slate-100 bg-white/80 p-6 animate-pulse">
										<div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
										<div className="h-16 bg-slate-200 rounded mb-4"></div>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-lg bg-slate-200"></div>
											<div>
												<div className="h-4 bg-slate-200 rounded w-16 mb-1"></div>
												<div className="h-3 bg-slate-200 rounded w-12"></div>
											</div>
										</div>
									</div>
								))}
							</div>
						) : testimonialsError ? (
							<div className="mt-8 md:rounded-2xl rounded-lg border border-rose-200 bg-rose-50 p-5">
								<p className="font-extrabold text-rose-700">تعذّر تحميل آراء العملاء</p>
								<p className="mt-1 text-sm text-rose-700/80">{testimonialsError}</p>
							</div>
						) : testimonials.length === 0 ? (
							<div className="mt-8 md:rounded-2xl rounded-lg border border-slate-200 bg-slate-50 p-5">
								<p className="font-bold text-slate-600">لا توجد آراء عملاء حالياً.</p>
							</div>
						) : (
							/* ✅ Slider باستخدام Swiper مع البيانات الحقيقية */
							<div className="mt-8 -mx-2 px-2">
								<Swiper
									modules={[Autoplay, Pagination, Navigation]}
									spaceBetween={16}
									slidesPerView={1}
									breakpoints={{
										640: {
											slidesPerView: 2,
											spaceBetween: 16,
										},
										1024: {
											slidesPerView: 3,
											spaceBetween: 20,
										},
									}}
									autoplay={{
										delay: 5000,
										disableOnInteraction: false,
										pauseOnMouseEnter: true,
									}}
									pagination={{
										clickable: true,
										dynamicBullets: true,
									}}
									navigation={true}
									loop={testimonials.length >= 3} // التشغيل التكراري فقط إذا كان هناك 3 عناصر أو أكثر
									className="testimonials-swiper !pb-12"
									dir="ltr" // للحفاظ على اتجاه السلايدر
								>
									{testimonials.map((t) => (
										<SwiperSlide key={t.id} dir="rtl">
											<div className="h-full" dir="rtl">
												<div className="md:rounded-2xl rounded-lg border border-slate-100 bg-white/80 backdrop-blur p-6 shadow-sm hover:shadow-md transition h-full flex flex-col">
													<Stars value={t.rating} />
													<p className="mt-3 text-sm text-slate-700 leading-relaxed flex-grow">
														“{t.review}”
													</p>

													<div className="mt-5 flex items-center justify-between">
														<div className="flex items-center gap-3">
															{/* عرض الصورة الرمزية إذا وجدت، وإلا عرض الحرف الأول */}
															{t.avatar ? (
																<img 
																	src={t.avatar} 
																	alt={t.name}
																	className="w-10 h-10 md:rounded-2xl rounded-lg object-cover"
																/>
															) : (
																<div className="w-10 h-10 md:rounded-2xl rounded-lg bg-[#14213d] text-white flex items-center justify-center font-extrabold">
																	{getInitial(t.name)}
																</div>
															)}
															<div>
																<p className="font-extrabold text-[#14213d]">{t.name}</p>
																<p className="text-xs text-slate-500">{t.city}</p>
															</div>
														</div>
													</div>
												</div>
											</div>
										</SwiperSlide>
									))}
								</Swiper>
							</div>
						)}

						{/* إضافة بعض التنسيقات المخصصة للـ Swiper */}
						<style jsx>{`
							:global(.testimonials-swiper .swiper-pagination-bullet) {
								background: #14213d;
								opacity: 0.3;
							}
							:global(.testimonials-swiper .swiper-pagination-bullet-active) {
								opacity: 1;
								background: #14213d;
							}
							:global(.testimonials-swiper .swiper-button-prev),
							:global(.testimonials-swiper .swiper-button-next) {
								color: #14213d;
								background: white;
								width: 40px;
								height: 40px;
								border-radius: 12px;
								box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
								border: 1px solid #e2e8f0;
							}
							:global(.testimonials-swiper .swiper-button-prev:after),
							:global(.testimonials-swiper .swiper-button-next:after) {
								font-size: 18px;
							}
							:global(.testimonials-swiper .swiper-button-prev:hover),
							:global(.testimonials-swiper .swiper-button-next:hover) {
								background: #f8fafc;
							}
							@media (max-width: 640px) {
								:global(.testimonials-swiper .swiper-button-prev),
								:global(.testimonials-swiper .swiper-button-next) {
									display: none;
								}
							}
						`}</style>
					</div>
				</div>
			</section>
		</div>
	);
}