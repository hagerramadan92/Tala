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

const DEFAULT_HOME_BANNER = "/images/saudi_nd_banner_1.png";
const DEFAULT_CATEGORY_BANNER = "/images/category-default-banner.webp";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getApiOrigin() {
	return API_URL.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");
}

function getImageCandidate(value: any): string {
	if (!value) return "";
	if (typeof value === "string") return value;

	return (
		value.image ||
		value.desktop_image ||
		value.mobile_image ||
		value.cover ||
		value.cover_image ||
		value.url ||
		value.path ||
		""
	);
}

function normalizeCategoryImage(src: any) {
	const raw = getImageCandidate(src).trim();
	if (!raw) return "";
	if (raw.startsWith("//")) return `https:${raw}`;
	if (
		raw.startsWith("http://") ||
		raw.startsWith("https://") ||
		raw.startsWith("data:") ||
		raw.startsWith("blob:")
	) {
		return raw;
	}
	if (raw.startsWith("/") && !raw.startsWith("/storage/")) return raw;

	const origin = getApiOrigin();
	if (!origin) return "";

	const path = raw.startsWith("/storage/")
		? raw
		: `/storage/${raw.replace(/^\/+/, "")}`;

	return `${origin}${path}`;
}

function getCategoryBanner(category: any): { desktop: string; mobile: string } {
	const banner = Array.isArray(category?.category_banners)
		? category.category_banners.find(
				(item: any) =>
					item?.is_active !== false && item?.is_active !== 0 && (item?.image || item?.mobile_image || getImageCandidate(item))
		  )
		: null;

	const desktop =
		normalizeCategoryImage(banner?.image || banner) ||
		normalizeCategoryImage(category?.banner) ||
		DEFAULT_CATEGORY_BANNER;

	const mobile =
		normalizeCategoryImage(banner?.mobile_image) ||
		desktop;

	return { desktop, mobile };
}

function CategoryBannerImage({
	desktopSrc,
	mobileSrc,
	alt,
	priority,
}: {
	desktopSrc: string;
	mobileSrc?: string;
	alt: string;
	priority?: boolean;
}) {
	const [desktopImg, setDesktopImg] = useState(desktopSrc || DEFAULT_CATEGORY_BANNER);
	const [mobileImg, setMobileImg] = useState(mobileSrc || desktopSrc || DEFAULT_CATEGORY_BANNER);

	useEffect(() => {
		setDesktopImg(desktopSrc || DEFAULT_CATEGORY_BANNER);
		setMobileImg(mobileSrc || desktopSrc || DEFAULT_CATEGORY_BANNER);
	}, [desktopSrc, mobileSrc]);

	return (
		<>
			{/* Mobile Banner (2:1 aspect ratio) */}
			<div className="block md:hidden relative w-full h-full">
				<Image
					src={mobileImg}
					alt={alt}
					fill
					sizes="100vw"
					className="object-cover object-center"
					priority={priority}
					loading={priority ? "eager" : "lazy"}
					onError={() => {
						if (mobileImg !== DEFAULT_CATEGORY_BANNER) {
							setMobileImg(DEFAULT_CATEGORY_BANNER);
						}
					}}
				/>
			</div>

			{/* Desktop Banner (3:1 aspect ratio) */}
			<div className="hidden md:block relative w-full h-full">
				<Image
					src={desktopImg}
					alt={alt}
					fill
					sizes="(max-width: 1200px) 100vw, 1200px"
					className="object-cover object-center"
					priority={priority}
					loading={priority ? "eager" : "lazy"}
					onError={() => {
						if (desktopImg !== DEFAULT_CATEGORY_BANNER) {
							setDesktopImg(DEFAULT_CATEGORY_BANNER);
						}
					}}
				/>
			</div>
		</>
	);
}

interface HomePageClientProps {
	initialMainSlider?: BannerI[];
	initialCategories?: any[];
	initialPagination?: any;
}

export default function HomePageClient({
	initialMainSlider = [],
	initialCategories = [],
	initialPagination = null,
}: HomePageClientProps) {
	const { parentCategories, loadingCategories } = useAppContext();

	// Lightweight home categories; more sections are loaded only on demand.
	const [categories2, setCategories2] = useState<any[]>(initialCategories);
	const [paginationState, setPaginationState] = useState<any>(initialPagination);

	// ✅ load-more UI state
	const [loadingMore, setLoadingMore] = useState(false);
	const [loadingHome, setLoadingHome] = useState(initialCategories.length === 0);

	// ------------------ fetch /home with params (fallback if not provided from server) ------------------
	useEffect(() => {
		if (initialCategories.length > 0) return;

		let mounted = true;
		const getHomeData = async () => {
			setLoadingHome(true);
			try {
				const res = await fetchApi("home?categories_limit=4&products_limit=6");
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
	}, [initialCategories.length]);

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

	// ------------------ slider ------------------
	const [mainSlider, setMainSlider] = useState<BannerI[]>(initialMainSlider);
	const [isMainSliderLoading, setIsMainSliderLoading] = useState(
		initialMainSlider.length === 0
	);

	useEffect(() => {
		if (initialMainSlider.length > 0) return;

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
	}, [initialMainSlider.length]);

	const sliderSrc = useMemo(
		() => (mainSlider?.[0]?.items || []).map((i) => i.image),
		[mainSlider]
	);

	// ------------------ render ------------------
	return (
		<div className="saudi-national-home bg-[#FBFCFA] min-h-screen py-3 md:py-6">
			<div className="container flex flex-col gap-5 md:gap-8">
				{/* Hero Slider */}
				<div className="w-full">
					{isMainSliderLoading ? (
						<HeroSliderSkeleton />
					) : sliderSrc.length > 0 ? (
						<SliderComponent src={mainSlider?.[0]} />
					) : (
						<div className="relative h-[216px] sm:h-[306px] md:h-[450px] lg:h-[486px] rounded-2xl border border-[#006C35]/15 bg-white overflow-hidden shadow-sm">
							<Image
								src={DEFAULT_HOME_BANNER}
								alt="بنر اليوم الوطني السعودي"
								fill
								sizes="100vw"
								className="object-cover"
								priority
							/>
						</div>
					)}
				</div>

				{/* Categories Slider */}
				<div className="w-full">
					{loadingCategories ? (
						<CategoriesSliderSkeleton />
					) : (
						<CategoriesSlider categories={parentCategories} />
					)}
				</div>

				{/* Category Sections */}
				<div className="flex flex-col gap-5 md:gap-8">
					{loadingHome ? (
						<>
							<CategorySectionSkeleton />
							<CategorySectionSkeleton />
							<CategorySectionSkeleton />
						</>
					) : (
						categories2.map((category, index) => {
							const hasProducts =
								Array.isArray(category.products) && category.products.length > 0;
							if (!hasProducts) return null;

							const categoryBanner = getCategoryBanner(category);
							// Limit products in home slider to 16 for DOM performance
							const displayProducts = category.products.slice(0, 16);

							return (
								<section
									key={category.id}
									className="rounded-[10px] md:rounded-2xl border border-[#006C35]/15 bg-white p-3 md:p-5 shadow-xs overflow-hidden"
								>
									{/* Compact Category Header */}
									<div className="flex items-center justify-between mb-2 md:mb-3 px-1">
										<div className="flex items-center gap-2">
											<span className="w-1.5 md:w-2 h-4 md:h-5 rounded-full bg-[#C9A54C]" />
											<h2 className="text-base md:text-xl font-extrabold text-[#003B24]">
												{category.name}
											</h2>
										</div>

										<Link
											href={`/category/${category.slug || category.id}`}
											className="text-xs md:text-sm font-bold text-[#006C35] hover:text-[#C9A54C] transition flex items-center gap-1"
										>
											الكل <span>←</span>
										</Link>
									</div>

									{/* Category Banner */}
									<Link
										href={`/category/${category.slug || category.id}`}
										className="block relative w-full aspect-[200/63] md:aspect-[100/21] mb-3 rounded-lg md:rounded-xl overflow-hidden border border-[#006C35]/10 bg-[#F2F6F3] group cursor-pointer"
									>
										<CategoryBannerImage
											desktopSrc={categoryBanner.desktop}
											mobileSrc={categoryBanner.mobile}
											alt={`${category.name} banner`}
											priority={index === 0}
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent group-hover:opacity-75 transition-opacity" />
									</Link>

									{/* Products Slider */}
									<div>
										<InStockSlider
											inStock={displayProducts}
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

				{/* Load More Button */}
				{hasNext && !loadingHome && (
					<div className="my-2 flex items-center justify-center">
						<button
							type="button"
							onClick={loadMore}
							disabled={loadingMore}
							className="rounded-xl px-6 py-2.5 text-sm md:text-base font-extrabold border border-[#006C35] bg-white text-[#006C35] hover:bg-[#006C35] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
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
