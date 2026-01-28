"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CgSearch } from "react-icons/cg";
import { AiOutlineClose } from "react-icons/ai";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
	className?: string;
}

export default function SearchComponent({ className = "", setMenuOpen }: any) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);

	const router = useRouter();
	const wrapRef = useRef<HTMLDivElement | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const trimmed = useMemo(() => query.trim(), [query]);

	// ✅ close on outside click
	useEffect(() => {
		const onDown = (e: MouseEvent) => {
			if (!wrapRef.current) return;
			if (!wrapRef.current.contains(e.target as Node)) {
				setOpen(false);
				setActiveIndex(-1);
			}
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, []);

	// ✅ debounce + abort previous request
	useEffect(() => {
		const t = setTimeout(() => {
			if (trimmed.length > 0) {
				fetchProducts(trimmed);
			} else {
				setResults([]);
				setOpen(false);
				setActiveIndex(-1);
			}
		}, 350);

		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [trimmed]);

	const fetchProducts = async (q: string) => {
		try {
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			setLoading(true);
			setOpen(true);

			const res = await fetch(`${API_URL}/products?search=${encodeURIComponent(q)}`, {
				signal: controller.signal,
			});

			const data = await res.json();
			const items = data?.data || [];

			setResults(items);
			setActiveIndex(items.length ? 0 : -1);
		} catch (err: any) {
			if (err?.name === "AbortError") return;
 			setResults([]);
			setActiveIndex(-1);
		} finally {
			setLoading(false);
		}
	};

	const goToSearchPage = () => {
		if (!trimmed) return;
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
		setOpen(false);
		setResults([]);
		setActiveIndex(-1);
	};

	const clear = () => {
		setQuery("");
		setResults([]);
		setOpen(false);
		setActiveIndex(-1);
	};

	// ✅ Keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			setOpen(false);
			setActiveIndex(-1);
			return;
		}

		if (e.key === "Enter") {
			// if dropdown open and item selected -> go to product
			if (open && activeIndex >= 0 && results[activeIndex]) {
				router.push(`/product/${results[activeIndex].id}`);
				clear();
				return;
			}
			// else go to search page
			if (trimmed) goToSearchPage();
			return;
		}

		if (!open || results.length === 0) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((p) => Math.min(results.length - 1, p + 1));
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((p) => Math.max(0, p - 1));
		}
	};

	return (
		<div ref={wrapRef} className={`relative w-full ${className}`}>
			{/* Input */}
			<div className="relative">
				<input
					type="text"
					placeholder="ابحث عن منتج..."
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => {
						if (trimmed.length > 0) setOpen(true);
					}}
					onKeyDown={handleKeyDown}
					className={[
						"w-full",
						"rounded-xl",
						"border border-slate-200",
						"bg-white/90 backdrop-blur",
						"px-4 py-2",
						"pe-4",
						"text-[0.98rem] text-gray-900",
						"outline-none",
						"transition-all duration-200",
						"focus:border-blue-200 focus:ring-4 focus:ring-blue-100",
					].join(" ")}
				/>

				{/* Search icon */}
				<CgSearch
					size={20}
					className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
				/>

				{/* Clear button */}
				{query.length > 0 && (
					<button
						type="button"
						onClick={clear}
						aria-label="Clear search"
						className="absolute end-11 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition grid place-items-center"
					>
						<AiOutlineClose className="text-gray-600" />
					</button>
				)}
			</div>

			{/* Dropdown */}
			<AnimateDropdown show={open && trimmed.length > 0}>
				<div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
					{/* Loading */}
					{loading && (
						<div className="p-3">
							<div className="space-y-2">
								{Array.from({ length: 5 }).map((_, i) => (
									<div key={i} className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
										<div className="flex-1 space-y-2">
											<div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
											<div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
										</div>
									</div>
								))}
							</div>
							<p className="text-center text-xs text-gray-500 mt-3">جارٍ البحث...</p>
						</div>
					)}

					{/* Empty */}
					{!loading && results.length === 0 && (
						<div className="p-4 text-center">
							<p className="text-gray-600 font-bold">لا توجد نتائج</p>
							<p className="text-xs text-gray-500 mt-1">جرّب كلمات مختلفة أو اكتب اسم المنتج</p>

							{trimmed && (
								<button
									type="button"
									onClick={goToSearchPage}
									className="mt-3 inline-flex items-center justify-center rounded-xl bg-pro text-white px-4 py-2 text-sm font-extrabold hover:opacity-95 transition"
								>
									بحث عن “{trimmed}”
								</button>
							)}
						</div>
					)}

					{/* Results */}
					{!loading && results.length > 0 && (
						<>
							<div className="max-h-96 overflow-y-auto">
								{results.map((item: any, idx: number) => {
									const isActive = idx === activeIndex;

									return (
										<Link
											href={`/product/${item.id}`}
											key={item.id}
											onClick={() => { clear(); setMenuOpen(false) }}
											className={[
												"block",
												"px-4 py-3",
												"border-b border-slate-200 last:border-b-0",
												"transition",
												isActive ? "bg-blue-50" : "hover:bg-gray-50",
											].join(" ")}
											onMouseEnter={() => setActiveIndex(idx)}
										>
											<div className="flex items-center justify-between gap-3">
												<div className="min-w-0">
													<p className="font-extrabold text-gray-900 truncate">{item.name}</p>
													{item.price && (
														<p className="text-sm text-gray-500 mt-0.5">
															{item.price} ريال
														</p>
													)}
												</div>

												<span className="text-xs font-bold text-gray-500 shrink-0">
													عرض
												</span>
											</div>
										</Link>
									);
								})}
							</div>

							{/* Footer action */}
							<div className="p-3 bg-gray-50 border-t border-slate-200 flex items-center justify-between gap-2">
								<p className="text-xs text-gray-500">
									Enter لفتح المنتج • Esc للإغلاق
								</p>
								<button
									type="button"
									onClick={goToSearchPage}
									className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-gray-900 border hover:bg-gray-100 transition"
								>
									كل النتائج
								</button>
							</div>
						</>
					)}
				</div>
			</AnimateDropdown>
		</div>
	);
}

/** ✅ Small animation without importing framer here */
function AnimateDropdown({ show, children }: { show: boolean; children: React.ReactNode }) {
	// lightweight CSS animation
	return show ? (
		<div className="absolute top-full left-0 right-0 z-50 animate-[fadeInUp_.18s_ease-out]">
			{children}
			<style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
		</div>
	) : null;
}
