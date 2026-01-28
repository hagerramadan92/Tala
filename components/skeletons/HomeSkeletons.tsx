"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useRef } from "react";

function Sk({ className = "" }: { className?: string }) {
	return (
		<div
			className={[
				"relative overflow-hidden rounded-xl bg-gray-200 ring-1 ring-black/5",
				"sk-shimmer", // ✅ this is the key
				className,
			].join(" ")}
		/>
	);
}

export function HeroSliderSkeleton() {
	return (
		<div className="relative  w-full h-[200px] md:h-[420px] overflow-hidden">
			<Sk className="absolute w-full h-full inset-0 rounded-none" />

			<div className="absolute top-1/2 -translate-y-1/2  right-[30px] items-center justify-between w-[calc(100%-60px)] flex gap-2">
				<Sk className="h-12 w-12 rounded-full bg-white/30 ring-white/10" />
				<Sk className="h-12 w-12 rounded-full bg-white/30 !mr-[100px] ring-white/10" />
			</div>
		</div>
	);
}


export function CategoriesSliderSkeleton() {
	const paginationRef = useRef<HTMLDivElement | null>(null);

	return (
		<div className="relative w-full !pb-6 py-4 md:py-6">
			<div className="relative">


				{/* Slider skeleton */}
				<div className="flex items-center gap-12 overflow-hidden" >
					{Array.from({ length: 15 }).map((_, i) => (
						<div key={i} className="group flex flex-col items-center gap-2 py-2">
							{/* circle image skeleton */}
							<div className="relative w-14 h-14 md:w-[92px] md:h-[92px] rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200">
								<Sk className="absolute inset-0 !rounded-full" />
							</div>

							{/* title skeleton */}
							<Sk className="h-3.5 w-16 md:w-20 rounded-md" />
						</div>
					))}
				</div>

			</div>
		</div>
	);
}

export function ProductCardSkeleton() {
	return (
		<div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
			<Sk className="h-[160px] md:h-[190px] rounded-none" />

			<div className="p-3 space-y-3">
				<Sk className="h-4 w-5/6" />
				<Sk className="h-4 w-3/5" />

				<div className="flex gap-2 items-center">
					<Sk className="h-6 w-20 rounded-full" />
					<Sk className="h-6 w-16 rounded-full" />
				</div>

				<Sk className="h-9 w-full rounded-xl" />
			</div>
		</div>
	);
}

export function CategorySectionSkeleton() {
	return (
		<section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
			<div className="relative w-full h-[120px] md:h-[160px]">
				<Sk className=" h-full w-full rounded-none" />
			</div>

			<div className="p-4 md:p-6">
				<div className="flex items-center justify-between mb-4">
					<Sk className="h-6 w-48" />
					<Sk className="h-9 w-24 rounded-full" />
				</div>

				<div className=" grid grid-cols-4 max-lg:h-[340px] overflow-hidden max-lg:grid-cols-2  gap-6 overflow-hidden w-full">
					{Array.from({ length: 4 }).map((_, i) => (
						<SwiperSlide key={i}>
							<ProductCardSkeleton />
						</SwiperSlide>
					))}
				</div>
			</div>
		</section>
	);
}


export function ProductPageSkeleton() {
	return (
		<section className="container pt-8 pb-24" dir="rtl">
			{/* Breadcrumb */}
			<Sk className="h-4 w-64 mb-6" />

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Info */}
				<div className="lg:col-span-5 space-y-5">
					<Sk className="h-8 w-3/4" />
					<Sk className="h-5 w-1/2" />

					<div className="flex gap-3">
						<Sk className="h-10 w-10 rounded-full" />
						<Sk className="h-10 w-10 rounded-full" />
					</div>

					{/* Specs Card */}
					<div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
						<Sk className="h-6 w-40" />
						<Sk className="h-4 w-full" />
						<Sk className="h-4 w-11/12" />
						<Sk className="h-4 w-10/12" />
						<Sk className="h-12 w-full mt-3" />
					</div>

					{/* Tabs */}
					<div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-4">
						<div className="flex gap-2">
							<Sk className="h-10 flex-1" />
							<Sk className="h-10 flex-1" />
						</div>

						{/* Options */}
						<div className="space-y-3">
							<Sk className="h-12 w-full" />
							<Sk className="h-12 w-full" />
							<Sk className="h-12 w-full" />
						</div>
					</div>
				</div>

				{/* Gallery */}
				<div className="lg:col-span-7">
					<GallerySkeleton />
				</div>
			</div>

			<BottomBarSkeleton />
		</section>
	);
}

function GallerySkeleton() {
	return (
		<div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
			<div className="animate-pulse bg-slate-200 h-[320px] sm:h-[420px] lg:h-[560px]" />

			<div className="p-3 flex gap-3">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="animate-pulse bg-slate-200 h-16 w-16 rounded-2xl"
					/>
				))}
			</div>
		</div>
	);
}
function BottomBarSkeleton() {
	return (
		<div className="fixed bottom-0 start-0 end-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur">
			<div className="container py-3 flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="animate-pulse bg-slate-200 w-14 h-14 rounded-2xl" />
					<div className="space-y-2">
						<div className="animate-pulse bg-slate-200 h-3 w-32" />
						<div className="animate-pulse bg-slate-200 h-4 w-48" />
					</div>
				</div>

				<div className="animate-pulse bg-slate-200 h-12 w-40 rounded-2xl" />
			</div>
		</div>
	);
}


export function StickerFormSkeleton() {
	return (
		<div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
			{/* Field 1 */}
			<div className="flex items-center gap-4">
				<Sk className="h-11 flex-1 rounded-xl" />  {/* select */}
			</div>

			{/* Field 2 */}
			<div className="flex items-center gap-4">
				<Sk className="h-11 flex-1 rounded-xl" />
			</div>

			{/* Field 3 */}
			<div className="flex items-center gap-4">
				<Sk className="h-11 flex-1 rounded-xl" />
			</div>

			{/* Optional feature field */}
			<div className="flex items-center gap-4">
				<Sk className="h-11 flex-1 rounded-xl" />
			</div>

			{/* Info / note */}
			<Sk className="h-12 w-full rounded-2xl" />
		</div>
	);
}


export default function CategoryPageSkeleton() {
	return (
		<section className=" container" dir="rtl">
			<div className="  py-6">
				{/* header */}
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
					<div className="space-y-2">
						<Sk className="h-8 w-56" />
						<Sk className="h-4 w-40" />
					</div>
					<div className="flex gap-2">
						<Sk className="h-10 w-24" />
						<Sk className="h-10 w-24" />
						<Sk className="h-10 w-44" />
					</div>
				</div>

				{/* banner */}
				<Sk className="h-[160px] md:h-[220px] w-full rounded-2xl mb-6" />

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
					{/* filters */}
					<div className="hidden lg:block lg:col-span-3">
						<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 sticky top-4">
							<Sk className="h-5 w-24" />
							<Sk className="h-10 w-full" />
							<Sk className="h-10 w-full" />
							<Sk className="h-10 w-full" />
							<Sk className="h-10 w-full" />
						</div>
					</div>

					{/* products */}
					<div className="lg:col-span-9">
						<div className="flex gap-4 overflow-x-auto pb-2 mb-6">
							{Array.from({ length: 7 }).map((_, i) => (
								<div key={i} className="min-w-fit flex flex-col items-center gap-2">
									<Sk className="w-[70px] h-[70px] rounded-full" />
									<Sk className="h-4 w-20" />
								</div>
							))}
						</div>

						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{Array.from({ length: 12 }).map((_, i) => (
								<div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
									<Sk className="h-[180px] w-full rounded-none" />
									<div className="p-3 space-y-2">
										<Sk className="h-5 w-4/5" />
										<Sk className="h-4 w-2/3" />
										<Sk className="h-4 w-1/2" />
									</div>
								</div>
							))}
						</div>

						<div className="mt-10 flex justify-center gap-2">
							<Sk className="h-10 w-24" />
							<Sk className="h-10 w-20" />
							<Sk className="h-10 w-24" />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}