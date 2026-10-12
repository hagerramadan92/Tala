import {
	CategoriesSliderSkeleton,
	CategorySectionSkeleton,
	HeroSliderSkeleton,
} from "@/components/skeletons/HomeSkeletons";

export default function HomeLoading() {
	return (
		<div className="min-h-[2600px] bg-[#FBFCFA] py-3 md:min-h-[3000px] md:py-6">
			<div className="container flex flex-col gap-5 md:gap-8">
				<HeroSliderSkeleton />
				<CategoriesSliderSkeleton />
				<div className="h-40 rounded-2xl bg-slate-200 sk-shimmer" />
				<div className="flex flex-col gap-5 md:gap-8">
					<CategorySectionSkeleton />
					<CategorySectionSkeleton />
					<CategorySectionSkeleton />
				</div>
			</div>
		</div>
	);
}
