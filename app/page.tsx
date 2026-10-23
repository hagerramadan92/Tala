import HomePageClient from "./HomePageClient";
import { fetchApi } from "@/lib/api";
import { BannerI } from "@/Types/BannerI";

export const revalidate = 60;

export default async function Home() {
	let initialMainSlider: BannerI[] = [];
	let initialCategories: any[] = [];
	let initialPagination: any = null;

	try {
		const [sliderData, homeData] = await Promise.all([
			fetchApi("banners?type=main_slider").catch(() => []),
			fetchApi("home?categories_limit=4&products_limit=4").catch(() => null),
		]);

		initialMainSlider = Array.isArray(sliderData) ? sliderData : [];
		initialCategories =
			homeData?.data?.sub_categories ?? homeData?.sub_categories ?? [];
		initialPagination =
			homeData?.data?.sub_categories_pagination ??
			homeData?.sub_categories_pagination ??
			null;
	} catch (error) {
		console.error("Error fetching home data on server:", error);
	}

	const firstSlide = initialMainSlider?.[0]?.items?.[0];
	const firstSlideDesktop = firstSlide?.desktop_image || firstSlide?.image || firstSlide?.mobile_image;
	const firstSlideMobile = firstSlide?.mobile_image || firstSlideDesktop;

	return (
		<>
			{firstSlideMobile && (
				<link
					rel="preload"
					as="image"
					href={firstSlideMobile}
					media="(max-width: 767px)"
					fetchPriority="high"
				/>
			)}
			{firstSlideDesktop && (
				<link
					rel="preload"
					as="image"
					href={firstSlideDesktop}
					media="(min-width: 768px)"
					fetchPriority="high"
				/>
			)}
			<HomePageClient
				initialMainSlider={initialMainSlider}
				initialCategories={initialCategories}
				initialPagination={initialPagination}
			/>
		</>
	);
}
