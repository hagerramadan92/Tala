"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

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
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				setLoading(true);
				const data = await fetchApi("ads");

				if (!cancelled && Array.isArray(data)) {
					setAds(data);
				}
			} catch {
				if (!cancelled) setAds([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (ads.length <= 1) return;
		const timer = window.setInterval(() => {
			setActiveIndex((current) => (current + 1) % ads.length);
		}, 3200);
		return () => window.clearInterval(timer);
	}, [ads.length]);

	/* ---------- Skeleton ---------- */
	if (loading) {
		return <HeaderAdsSkeleton />;
	}

	if (!ads.length) {
		return <div aria-hidden="true" className="h-10 w-full border-b border-gray-200 bg-gray-100" />;
	}

	const activeAd = ads[activeIndex % ads.length];

	return (
		<div
			dir="rtl"
			className="w-full border-b border-gray-200 bg-gray-100 text-gray-900 "
		>
			<div className="mx-auto max-w-7xl px-2 sm:px-4">
				<div className="flex h-10 items-center">
					<div className="mx-auto flex w-full items-center justify-center gap-2 px-2 text-center text-sm sm:text-[15px]">
						<span className="text-base">{faToEmoji(activeAd.icon)}</span>
						<span className="truncate">{activeAd.description}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
