"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CategoryI } from "@/Types/CategoriesI";
import { fetchApi } from "@/lib/api";
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";

// ✅ Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import { usePathname } from "next/navigation";
import { useAppContext } from "../src/context/AppContext";

type Status = "idle" | "loading" | "success" | "error";

function cn(...c: (string | false | undefined | null)[]) {
	return c.filter(Boolean).join(" ");
}

export default function CateNavbar() {
	const { parentCategories, loadingCategories } = useAppContext();

	const items = useMemo(() => parentCategories ?? [], [parentCategories]);

	if (loadingCategories) return <CateNavbarSkeleton />;

	return (
		<div className="w-full hidden1">
			<div className="container !px-0 overflow-hidden border-b border-slate-200">
				<div className="flex items-center justify-between gap-3 py-2.5">
					<CategorySlider items={items} />
				</div>
			</div>
		</div>
	);
}

function CategorySlider({ items }: { items: CategoryI[] }) {
	return (
		<div className="relative w-full">
			{/* Edge fade */}
			<div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent z-10" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />

			{/* Pretty arrows */}
			<button
				type="button"
				className={cn(
					"cate-prev-1 absolute z-20 left-1 top-1/2 -translate-y-1/2",
					"h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-sm",
					"grid place-items-center transition hover:bg-slate-50"
				)}
				aria-label="Scroll left"
			>
				<FiChevronLeft />
			</button>

			<button
				type="button"
				className={cn(
					"cate-next-1 absolute z-20 right-1 top-1/2 -translate-y-1/2",
					"h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-sm",
					"grid place-items-center transition hover:bg-slate-50"
				)}
				aria-label="Scroll right"
			>
				<FiChevronRight />
			</button>

			<div className="px-12 cateogries">
				<Swiper
					modules={[Navigation, FreeMode]}
					navigation={{
						nextEl: ".cate-next-1",
						prevEl: ".cate-prev-1",
					}}
					dir="rtl"
					slidesPerView="auto"
					spaceBetween={6}
					freeMode={{ enabled: true, sticky: false, momentumBounce: true }}
					grabCursor
					className="!overflow-visible items-center"
				>
					{/* All products */}
					<SwiperSlide className="!w-auto">
						<Link
							href="/category"
							className={cn(
								"shrink-0 rounded-xl px-3 py-2 text-sm font-extrabold",
								"bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
							)}
						>
							كل التصنيفات
						</Link>
					</SwiperSlide>
					<SwiperSlide className="!w-auto">
						<Link
							href="/product"
							className={cn(
								"shrink-0 rounded-xl px-3 py-2 text-sm font-extrabold",
								"bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
							)}
						>
							كل المنتجات
						</Link>
					</SwiperSlide>

					{items.map((cat) => {
						const parentHref = `/category/${cat.id}`;

						return (
							<SwiperSlide key={cat.id} className="!w-auto">
								<div className="relative group">
									<Link
										href={parentHref}
										className={cn(
											"inline-flex items-center gap-1 rounded-xl px-3 py-2",
											"text-[0.98rem] font-extrabold text-slate-700",
											"hover:bg-slate-50 hover:text-pro transition"
										)}
									>
										<span className="whitespace-nowrap">{cat.name}</span>
									</Link>

								</div>
							</SwiperSlide>
						);
					})}
				</Swiper>
			</div>
		</div>
	);
}

/** ✅ Skeleton matches the real navbar look */
function CateNavbarSkeleton() {
	return (
		<div className="hidden1 border-b border-slate-200 bg-white">
			<div className="container overflow-hidden mx-auto px-4">
				<div className="flex items-center justify-between gap-3 py-2.5">
					<div className="flex-1 flex items-center justify-end gap-2 overflow-hidden">
						{Array.from({ length: 17 }).map((_, i) => (
							<div
								key={i}
								className="h-10 w-24 rounded-xl bg-slate-100 animate-pulse"
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
