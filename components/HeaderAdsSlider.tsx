"use client";

import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

type Ad = {
	id: number;
	description: string;
	icon: string;
};

type ApiResponse = {
	status: boolean;
	message: string;
	data: Ad[];
};

function faToEmoji(icon: string) {
	const map: Record<string, string> = {
		"fa-truck-fast": "🚚",
		"fa-percent": "％",
		"fa-gift": "🎁",
		"fa-fire": "🔥",
		"fa-rocket": "🚀",
		"fa-boxes-stacked": "📦",
		"fa-star": "⭐",
		"fa-user-plus": "👤",
		"fa-bolt": "⚡",
		"fa-calendar-week": "🗓️",
		"fa-truck": "🚛",
	};
	return map[icon] ?? "ℹ️";
}

/* ---------------- Skeleton ---------------- */
function HeaderAdsSkeleton() {
	return (
		<div className="w-full border-b bg-gray-100 ">
			<div className="mx-auto flex h-10 max-w-7xl items-center justify-center px-4">
				<div className="flex w-full max-w-md items-center gap-2">
					<div className="h-4 w-4 animate-pulse rounded bg-gray-300  " />
					<div className="h-4 w-full animate-pulse rounded bg-gray-300  " />
				</div>
			</div>
		</div>
	);
}

export default function HeaderAdsSlider() {
	const [ads, setAds] = useState<Ad[]>([]);
	const [loading, setLoading] = useState(true);

	const apiBase = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				setLoading(true);
				const res = await fetch(`${apiBase}/ads`, { cache: "no-store" });
				const json = (await res.json()) as ApiResponse;

				if (!cancelled && json?.status && Array.isArray(json.data)) {
					setAds(json.data);
				}
			} catch {
				if (!cancelled) setAds([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		if (apiBase) load();
		else setLoading(false);

		return () => {
			cancelled = true;
		};
	}, [apiBase]);

	const slides = useMemo(() => {
		if (ads.length <= 1) return ads;
		return [...ads, ...ads];
	}, [ads]);

	/* ---------- Skeleton ---------- */
	if (loading) {
		return <HeaderAdsSkeleton />;
	}

	if (!slides.length) return null;

	return (
		<div
			dir="rtl"
			className="w-full border-b border-gray-200 bg-gray-100 text-gray-900 "
		>
			<div className="mx-auto max-w-7xl px-2 sm:px-4">
				<Swiper
					modules={[Autoplay]}
					loop
					slidesPerView={1}
					speed={700}
					autoplay={{
						delay: 2500,
						disableOnInteraction: false,
						pauseOnMouseEnter: true,
					}}
					className="h-10"
				>
					{slides.map((ad, idx) => (
						<SwiperSlide
							key={`${ad.id}-${idx}`}
							className="!flex items-center"
						>
							<div className="mx-auto flex w-full items-center justify-center gap-2 px-2 text-center text-sm sm:text-[15px]">
								<span className="text-base">
									{faToEmoji(ad.icon)}
								</span>
								<span className="truncate">{ad.description}</span>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	);
}
