"use client";

import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ProductI } from "@/Types/ProductsI";
import { ProductCardSkeleton } from "@/components/skeletons/HomeSkeletons";

interface InStockSliderProps {
	inStock: ProductI[];
	CardComponent: any
	title?: string;
	hiddenArrow?: boolean;
	// ✅ new
	isLoading?: boolean;
	skeletonCount?: number;
}

export default function InStockSlider({
	inStock,
	CardComponent,
	title = "",
	isLoading = false,
	skeletonCount = 8,
	hiddenArrow = true
}: InStockSliderProps) {
	const prevRef = useRef<HTMLButtonElement>(null);
	const nextRef = useRef<HTMLButtonElement>(null);

	return (
		<div className="relative w-full">
			{/* Header optional */}
			{title ? (
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg md:text-xl font-extrabold text-gray-900">
						{title}
					</h2>

					{hiddenArrow && <div className="flex items-center gap-2">
						<button
							ref={nextRef}
							className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition"
							aria-label="التالي"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</button>
						<button
							ref={prevRef}
							className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition"
							aria-label="السابق"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>


					</div>}
				</div>
			) : (
				hiddenArrow &&  <div className="flex justify-end gap-2 mb-3">
					<button
						ref={prevRef}
						className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition"
						aria-label="السابق"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button
						ref={nextRef}
						className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition"
						aria-label="التالي"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			)}

			<Swiper
			className={`${hiddenArrow == false && "mt-3"}`}
				modules={[Navigation]}
				navigation={{
					prevEl: prevRef.current,
					nextEl: nextRef.current,
				}}
				onBeforeInit={(swiper) => {
					// @ts-ignore
					swiper.params.navigation.prevEl = prevRef.current;
					// @ts-ignore
					swiper.params.navigation.nextEl = nextRef.current;
				}}
				spaceBetween={14}
				slidesPerView={2}
				slidesPerGroup={2}
				breakpoints={{
					640: { slidesPerView: 2, slidesPerGroup: 2 },
					768: { slidesPerView: 3, slidesPerGroup: 3 },
					1024: { slidesPerView: 4, slidesPerGroup: 4 },
					1280: { slidesPerView: 5, slidesPerGroup: 5 },
				}}
			>
				{isLoading
					? Array.from({ length: skeletonCount }).map((_, i) => (
						<SwiperSlide key={`sk-${i}`}>
							<ProductCardSkeleton />
						</SwiperSlide>
					))
					: inStock.map((product) => (
						<SwiperSlide key={product.id}>
							{typeof CardComponent === "function" ? (
								// if passed as render function
								// @ts-ignore
								<CardComponent {...product} />
							) : (
								<CardComponent {...product} />
							)}
						</SwiperSlide>
					))}
			</Swiper>
		</div>
	);
}
