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
		<div className="w-full bg-slate-100 px-2 py-1.5">
			<div className="mx-auto max-w-7xl">
				<div className="flex h-9 items-center justify-center rounded-lg bg-[#1f2937] px-3">
					<div className="h-3.5 w-2/3 max-w-md animate-pulse rounded bg-white/20" />
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
		return <div aria-hidden="true" className="h-12 w-full bg-slate-100" />;
	}

	const activeAd = ads[activeIndex % ads.length];

	const goPrev = () => setActiveIndex((c) => (c - 1 + ads.length) % ads.length);
	const goNext = () => setActiveIndex((c) => (c + 1) % ads.length);

	// تمييز النسبة (30% / ٣٠٪) بالبرتقالي
	const highlightPercent = (text: string) =>
		String(text || "").replace(
			/([0-9\u0660-\u0669]+)\s*[%٪]/g,
			(match) => `<span class="text-orange-400 font-extrabold">${match}</span>`
		);

	return (
		<div dir="rtl" className="w-full bg-slate-100 px-2 py-1.5">
			<div className="mx-auto max-w-7xl">
				<div className="flex h-9 items-center justify-between gap-2 rounded-lg bg-[#1f2937] px-1.5 text-white shadow-sm">
					<button
						type="button"
						onClick={goPrev}
						aria-label="السابق"
						className="shrink-0 grid place-items-center w-7 h-7 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
						</svg>
					</button>

					<div className="flex min-w-0 items-center justify-center gap-2 text-center text-[12px] sm:text-[14px] font-bold">
						<span className="text-base text-orange-400">📢</span>
						<span
							className="truncate"
							dangerouslySetInnerHTML={{ __html: highlightPercent(activeAd.description) }}
						/>
					</div>

					<button
						type="button"
						onClick={goNext}
						aria-label="التالي"
						className="shrink-0 grid place-items-center w-7 h-7 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
