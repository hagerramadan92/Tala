"use client";

function Sk({ className = "" }: { className?: string }) {
	return (
		<div
			className={[
				"relative overflow-hidden rounded-xl bg-gray-200 ring-1 ring-black/5",
				"sk-shimmer",
				className,
			].join(" ")}
		/>
	);
}

function FavoriteCardSkeleton() {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
			{/* image */}
			<Sk className="h-44 w-full rounded-xl" />

			{/* content */}
			<div className="mt-3 space-y-2">
				<Sk className="h-4 w-3/4 rounded-lg" />
				<Sk className="h-4 w-1/2 rounded-lg" />

				{/* price + button row */}
				<div className="mt-3 flex items-center justify-between gap-3">
					<Sk className="h-6 w-24 rounded-lg" />
					<Sk className="h-10 w-28 rounded-xl" />
				</div>
			</div>
		</div>
	);
}

export default function FavoriteSkeleton({ count = 8 }: { count?: number }) {
	return (
		<div className="p-4">
			{/* header skeleton */}
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="space-y-2">
					<Sk className="h-7 w-44 rounded-xl" />
					<Sk className="h-4 w-64 rounded-xl" />
				</div>
				<Sk className="h-10 w-28 rounded-xl" />
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
				{Array.from({ length: count }).map((_, i) => (
					<FavoriteCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
