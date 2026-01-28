"use client";

import { useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, FreeMode, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Image from "next/image";
import Link from "next/link";
import { CategoryI } from "@/Types/CategoriesI";

// ✅ Better icons (lucide-react)
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface CategoriesSliderProps {
	categories: CategoryI[];
	title?: string;
	subtitle?: string;
	inSlide ?: any
}

function cn(...c: (string | false | undefined | null)[]) {
	return c.filter(Boolean).join(" ");
}

export default function CategoriesSlider({
	categories,
	inSlide,
	title = "الأقسام",
	subtitle = "اختر القسم اللي يناسبك",
}: CategoriesSliderProps) {
	const prevRef = useRef<HTMLButtonElement | null>(null);
	const nextRef = useRef<HTMLButtonElement | null>(null);
	const paginationRef = useRef<HTMLDivElement | null>(null);

	const [isBeginning, setIsBeginning] = useState(true);
	const [isEnd, setIsEnd] = useState(false);

	const items = useMemo(() => categories ?? [], [categories]);
	const hasSlides = items.length > 0;
	if (!hasSlides) return null;

	return (
		<section className="relative w-full py-4 md:py-6">
			{/* Header */}
			<div className="mb-3 md:mb-4 flex items-end justify-between gap-3">
				<div className="flex items-start gap-2">
					<span
						className={cn(
							"mt-0.5 grid h-9 w-9 place-items-center rounded-2xl",
							"bg-slate-50 border border-slate-200 text-slate-700"
						)}
						aria-hidden="true"
					>
						<Sparkles className="h-5 w-5" />
					</span>

					<div>
						<h2 className="text-base md:text-lg font-extrabold text-slate-900">
							{title}
						</h2>
						<p className="text-xs md:text-sm text-slate-500 mt-0.5">{subtitle}</p>
					</div>
				</div>

				{/* Desktop arrows */}
				<div className="  flex items-center gap-2">
					<ArrowButton
						refEl={prevRef}
						dir="prev"
						disabled={isBeginning}
						ariaLabel="السابق"
					/>
					<ArrowButton
						refEl={nextRef}
						dir="next"
						disabled={isEnd}
						ariaLabel="التالي"
					/>
				</div>
			</div>

			<div className="relative">

				{/* Soft fades */}
				<div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent z-10" />
				<div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />

				<Swiper
					modules={[Navigation, Pagination, FreeMode, A11y]}
					dir="rtl"
					spaceBetween={5}
					slidesPerGroup={1}
					watchOverflow
					grabCursor
					freeMode={{ enabled: true, sticky: false, momentumBounce: true }}
					navigation={{
						prevEl: ".cate-prev",
						nextEl: ".cate-next",
						disabledClass: "swiper-nav-disabled",
					}}
					pagination={{
						clickable: true,
						el: paginationRef.current,
					}}
					onInit={(swiper) => {
						// attach refs
						// @ts-ignore
						swiper.params.navigation.prevEl = prevRef.current;
						// @ts-ignore
						swiper.params.navigation.nextEl = nextRef.current;
						// @ts-ignore
						swiper.params.pagination.el = paginationRef.current;

						swiper.navigation?.init();
						swiper.navigation?.update();
						swiper.pagination?.init();
						swiper.pagination?.render();
						swiper.pagination?.update();

						setIsBeginning(swiper.isBeginning);
						setIsEnd(swiper.isEnd);
					}}
					onSlideChange={(swiper) => {
						setIsBeginning(swiper.isBeginning);
						setIsEnd(swiper.isEnd);
					}}
					breakpoints={{
						0: { slidesPerView: 3  },
						480: { slidesPerView: 3  },
						640: { slidesPerView: 6  },
						992: { slidesPerView: 8  },
						1424: { slidesPerView: 10  },
					}}
					className="!px-2 md:!px-0"
				>
					{items.map((cat) => (
						<SwiperSlide key={cat.id} className=" !h-auto">
							<Link
								href={`/category/${cat.id}`}
								aria-label={`Go to ${cat.name}`}
								className="block"
							>
								<div className="group flex flex-col items-center gap-2 py-2">
									{/* Card */}
									<div
										className={cn(
											"relative grid place-items-center",
											"w-16 h-16 md:w-[92px] md:h-[92px]",
											"rounded-3xl overflow-hidden",
											"bg-slate-100 ring-1 ring-slate-200",
											"transition",
											"group-hover:ring-slate-300"
										)}
									>
										{/* image */}
										<Image
											src={cat.image || "/images/cat1.png"}
											alt={cat.name}
											fill
											sizes="(max-width: 768px) 64px, 92px"
											className="object-cover transition duration-300 group-hover:scale-[1.06]"
										/>

										{/* overlay gradient */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
									</div>

									<p className="text-[12.5px] md:text-[14px] font-extrabold text-slate-700 text-center leading-tight line-clamp-1 group-hover:text-pro transition">
										{cat.name}
									</p>
								</div>
							</Link>
						</SwiperSlide>
					))}
				</Swiper>


			</div>
		</section>
	);
}

/* --------------------------- Buttons (Reusable) -------------------------- */

function baseArrowClass(disabled?: boolean) {
	return cn(
		"max-md:h-9 max-md:w-9 h-10 w-10 rounded-2xl border shadow-sm grid place-items-center transition",
		"bg-white border-slate-200 text-slate-700",
		disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
	);
}

function ArrowIcon({ dir }: { dir: "prev" | "next" }) {
	// With RTL Swiper, "prev" visually points right (go back), "next" points left.
	// We keep icons intuitive for RTL UI:
	return dir === "prev" ? (
		<ChevronRight className="h-5 w-5" />
	) : (
		<ChevronLeft className="h-5 w-5" />
	);
}

function ArrowButton({
	refEl,
	dir,
	disabled,
	ariaLabel,
}: {
	refEl: React.RefObject<HTMLButtonElement | null>;
	dir: "prev" | "next";
	disabled: boolean;
	ariaLabel: string;
}) {
	return (
		<button
			ref={refEl}
			type="button"
			aria-label={ariaLabel}
			disabled={disabled}
			className={cn(
				baseArrowClass(disabled),
				dir === "prev" ? "cate-prev" : "cate-next"
			)}
		>
			<ArrowIcon dir={dir} />
		</button>
	);
}

function ArrowOverlay({
	refEl,
	dir,
	disabled,
	ariaLabel,
}: {
	refEl: React.RefObject<HTMLButtonElement | null>;
	dir: "prev" | "next";
	disabled: boolean;
	ariaLabel: string;
}) {
	return (
		<button
			ref={refEl}
			type="button"
			aria-label={ariaLabel}
			disabled={disabled}
			className={cn(
				"md:hidden absolute z-20 top-1/2 -translate-y-1/2",
				dir === "prev" ? "left-1 cate-prev" : "right-1 cate-next",
				baseArrowClass(disabled)
			)}
		>
			<ArrowIcon dir={dir} />
		</button>
	);
}
