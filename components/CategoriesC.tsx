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
	inSlide ?: any;
	  onCategoryClick?: () => void; 
}

function cn(...c: (string | false | undefined | null)[]) {
	return c.filter(Boolean).join(" ");
}

export default function CategoriesSlider({
	categories,
	inSlide,
	title = "الأقسام",
	subtitle = "اختر القسم اللي يناسبك",
	 onCategoryClick
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
		<section className="relative w-full py-1 md:py-2">
			{/* Header */}
			<div className="mb-2 md:mb-3 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<span className="w-1.5 md:w-2 h-5 md:h-6 rounded-full bg-[#006C35]" />
					<h2 className="text-base md:text-xl font-extrabold text-[#003B24]">
						{title}
					</h2>
				</div>

				{/* Desktop arrows */}
				<div className="flex items-center gap-1.5">
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
				<Swiper
					modules={[Navigation, Pagination, FreeMode, A11y]}
					dir="rtl"
					spaceBetween={12}
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
						0: { slidesPerView: 4.2, spaceBetween: 8 },
						480: { slidesPerView: 5.2, spaceBetween: 10 },
						640: { slidesPerView: 7, spaceBetween: 12 },
						992: { slidesPerView: 9, spaceBetween: 14 },
						1424: { slidesPerView: 11, spaceBetween: 16 },
					}}
					className="!py-1"
				>
					{items.map((cat) => (
						<SwiperSlide key={cat.id} className="!h-auto">
							<Link
								href={`/category/${cat.slug || cat.id}`}
								onClick={onCategoryClick}
								aria-label={`Go to ${cat.name}`}
								className="block h-full"
							>
								<div className="group flex flex-col items-center gap-1.5 py-1">
									{/* Category circle image */}
									<div className="relative w-14 h-14 md:w-[84px] md:h-[84px] rounded-full overflow-hidden bg-[#EAF5EF] ring-2 ring-[#006C35]/15 transition duration-300 group-hover:ring-[#006C35] group-hover:scale-[1.05] shadow-xs">
										<Image
											src={cat.image || "/images/cat1.png"}
											alt={cat.name}
											fill
											sizes="(max-width: 768px) 56px, 84px"
											className="object-cover"
										/>
									</div>

									<p className="text-[10.5px] md:text-[13px] font-extrabold text-[#003B24] text-center leading-tight group-hover:text-[#006C35] transition truncate max-w-[75px] md:max-w-[105px]">
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
		"max-md:h-9 max-md:w-9 h-10 w-10 md:rounded-2xl rounded-lg border shadow-sm grid place-items-center transition",
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
