"use client";

import CategoriesSlider from "@/components/CategoriesC";
import InStockSlider from "@/components/InStockSlider";
import ProductCard from "@/components/ProductCard";
import SliderComponent from "@/components/SliderComponent";
import { fetchApi, fetchApi2 } from "@/lib/api";
import { useAppContext } from "@/src/context/AppContext";
import { BannerI } from "@/Types/BannerI";
import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

// ✅ Skeletons
import {
	CategoriesSliderSkeleton,
	HeroSliderSkeleton,
	CategorySectionSkeleton,
} from "@/components/skeletons/HomeSkeletons";
import WhyAndFaqs from "../components/WhyAndFaqs";

export default function Home() {
	const { parentCategories, loadingCategories } = useAppContext();

	// ✅ local state for categories from /home?categories_limit=12
	const [categories2, setCategories2] = useState<any[]>([]);
	const [paginationState, setPaginationState] = useState<any>(null);

	// ✅ load-more UI state
	const [loadingMore, setLoadingMore] = useState(false);
	const [loadingHome, setLoadingHome] = useState(true);

	// ------------------ fetch /home with params ------------------
	useEffect(() => {
		let mounted = true;
		const getHomeData = async () => {
			setLoadingHome(true);
			try {
				const res = await fetchApi("home?categories_limit=7");
				// ✅ get sub_categories and pagination from response
				const sub_categories =
					res?.data?.sub_categories ?? res?.sub_categories ?? [];
				const pagination =
					res?.data?.sub_categories_pagination ??
					res?.sub_categories_pagination ??
					null;

				if (!mounted) return;

				setCategories2(sub_categories);
				setPaginationState(pagination);
			} catch (e) {
				if (!mounted) return;
				setCategories2([]);
				setPaginationState(null);
			} finally {
				if (!mounted) return;
				setLoadingHome(false);
			}
		};

		getHomeData();
		return () => {
			mounted = false;
		};
	}, []);

	// ------------------ load more ------------------
	const loadMore = useCallback(async () => {
		if (!paginationState?.next_page) return;
		if (loadingMore) return;

		setLoadingMore(true);
		try {
			const nextUrl = String(paginationState.next_page);
			const res = await fetchApi2(nextUrl);

			const newCats = res?.data?.sub_categories ?? res?.sub_categories ?? [];
			const newPagination =
				res?.data?.sub_categories_pagination ??
				res?.sub_categories_pagination ??
				res?.pagination ??
				null;

			// append + de-dup by id
			setCategories2((prev) => {
				const merged = [...prev, ...(Array.isArray(newCats) ? newCats : [])];
				const map = new Map(merged.map((c: any) => [c.id, c]));
				return Array.from(map.values());
			});

			setPaginationState(newPagination);
		} catch (e) {
			// optionally toast/error UI
		} finally {
			setLoadingMore(false);
		}
	}, [paginationState?.next_page, loadingMore]);

	const hasNext = Boolean(paginationState?.next_page);

	// ------------------ slider (existing code) ------------------
	const [mainSlider, setMainSlider] = useState<BannerI[]>([]);
	const [isMainSliderLoading, setIsMainSliderLoading] = useState(true);

	useEffect(() => {
		let mounted = true;

		const getMainSlider = async () => {
			setIsMainSliderLoading(true);
			try {
				const data = await fetchApi("banners?type=main_slider");
				if (!mounted) return;
				setMainSlider(Array.isArray(data) ? data : []);
			} catch (e) {
				if (!mounted) return;
				setMainSlider([]);
			} finally {
				if (!mounted) return;
				setIsMainSliderLoading(false);
			}
		};

		getMainSlider();
		return () => {
			mounted = false;
		};
	}, []);

	const sliderSrc = useMemo(
		() => (mainSlider?.[0]?.items || []).map((i) => i.image),
		[mainSlider]
	);

	// ------------------ render ------------------
	return (
		<div className="container !mt-8 !mb-8">
			<div className="flex flex-col gap-8">
				<div className="rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-sm">
					{isMainSliderLoading ? (
						<HeroSliderSkeleton />
					) : sliderSrc.length > 0 ? (
						<SliderComponent src={mainSlider?.[0]} />
					) : (
						<div className="h-[200px] md:h-[420px] flex items-center justify-center text-gray-400">
							لا توجد بنرات حالياً
						</div>
					)}
				</div>

				<div className="max-md:overflow-hidden w-full pb-12 pt-8">
					{loadingCategories ? (
						<CategoriesSliderSkeleton />
					) : (
						<CategoriesSlider categories={parentCategories} />
					)}
				</div>

				{/* ✅ SECTIONS */}
				<div className="flex flex-col gap-10">
					{loadingHome ? (
						<>
							<CategorySectionSkeleton />
							<CategorySectionSkeleton />
							<CategorySectionSkeleton />
						</>
					) : (
						categories2.map((category) => {
							const hasProducts =
								Array.isArray(category.products) && category.products.length > 0;
							if (!hasProducts) return null;

							
								// const banner = category.category_banners?.[0]?.image ?? "/images/d4.png";
															 const banners = category.category_banners || [];
              const hasBanners = banners.length > 0;
							return (
								<section
									key={category.id}
									className="rounded-[10px_10px_0_0] md:rounded-3xl md:border md:border-gray-100 !bg-gray-50/50 overflow-hidden"
								>
									{/* <div className="relative w-full h-[120px] md:h-[160px]"> */}
										{/* <Image
											src={banner}
											alt={category.name}
											fill
											className="object-cover"
											priority={false}
										/> */}
										{/* <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" /> */}
										{/* <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
											<h2 className="text-white text-lg md:text-2xl font-extrabold drop-shadow">
												{category.name}
											</h2>

											<Link
												href={`/category/${category.slug || category.id}`}
												className="text-white/95 text-sm md:text-base font-semibold px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition"
											>
												الكل
											</Link>
										</div> */}
									{/* </div> */}
											<div className="flex items-end justify-between mb-2">
																<h2 className="text-md md:text-2xl ms-1 md:ms-2 drop-shadow whitespace-nowrap">
																{category.name}
																</h2>
											<Link
											href={`/category/${category.id}`}
											className="text-pro-max z-7 text-sm md:text-base font-semibold whitespace-nowrap rounded-full bg-white/15 hover:bg-white/25 transition"
											>
											الكل
											</Link>
										</div>

                  <div className="relative w-full p-3 px-0">
                    {hasBanners ? (
                      <div dir="rtl" className={`grid gap-3 ${banners.length === 1 ? 'grid-cols-1' : 'grid-cols-1'} sm:grid-cols-1 md:grid-cols-${Math.min(banners.length, 4)}`}>
                        {banners.map((banner: any, index: number) => (
                          <div
                            key={banner.id}
                            className={`relative h-15 md:h-29 overflow-hidden ${
                              index === 0 ? "rounded-tr-2xl rounded-tl-2xl md:rounded-tl-none" :
                              index === banners.length - 1 ? "rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none" : ""
                            }`}
                          >
                            <Image
                              src={banner.image || "/images/cover2.png"}
                              alt={banner.alt || category.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              className="object-center"
                              priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative h-29 rounded-[10px_10px_0_0] md:rounded-t-3xl overflow-hidden">
                        <Image
                          src="/images/cover2.png"
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 1200px"
                          className="object-cover"
                          priority={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                      </div>
                    )}
                  </div>
									{/* Products */}
									<div className="md:p-6">
										<InStockSlider
											inStock={category.products}
											isLoading={false}
											title=""
											hiddenArrow={false}
											CardComponent={(product: any) => (
												<ProductCard
													{...product}
													product={product}
													key={product.id}
													id={product.id}
													name={product.name}
													image={product.image || "/images/not.jpg"}
													stock={product.stock}
													average_rating={product.average_rating}
													reviews={product.reviews}
													className="hidden"
													className2="hidden"
													classNameHome=""
													Bottom="bottom-3"
												/>
											)}
										/>
									</div>
								</section>
							);
						})
					)}
				</div>

				{/* ✅ Load More Button */}
				{hasNext && !loadingHome && (
					<div className="mt-2 flex items-center justify-center">
						<button
							type="button"
							onClick={loadMore}
							disabled={loadingMore}
							className="rounded-2xl px-6 py-3 font-extrabold shadow-sm border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{loadingMore ? "جاري تحميل المزيد..." : "تحميل المزيد"}
						</button>
					</div>
				)}

				<WhyAndFaqs />
			</div>
		</div>
	);
}
