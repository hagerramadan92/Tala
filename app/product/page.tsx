"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { ProductI } from "@/Types/ProductsI";

import ProductFilterApi, { ProductsApiFilters } from "@/components/ProductFilterApi";

import { AnimatePresence, motion } from "framer-motion";
import { FiFilter } from "react-icons/fi";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { FormControl, Select, MenuItem, Button } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Meta = {
	current_page: number;
	per_page: number;
	total: number;
	last_page: number;
};

type ApiResponse = {
	status: boolean;
	message: string;
	data: ProductI[];
	meta: Meta;
};

type SortBy = "price" | "rating";
type SortDirection = "asc" | "desc";
type Option = { id: number; name: string };

function uniqOptions(list: Option[]) {
	const map = new Map<number, Option>();
	list.forEach((x) => {
		if (!x?.id || !x?.name) return;
		map.set(x.id, x);
	});
	return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

/* ---------------- Skeletons (real per-part) ---------------- */
function Sk({ className = "" }: { className?: string }) {
	return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

function ProductCardSkeleton() {
	return (
		<div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
			<div className="relative h-[150px] md:h-[240px] bg-slate-50">
				<Sk className="absolute inset-0 !rounded-none" />
			</div>
			<div className="p-4 space-y-3">
				<Sk className="h-5 w-10/12" />
				<Sk className="h-4 w-8/12" />
				<div className="flex items-center gap-2">
					<Sk className="h-4 w-20" />
					<Sk className="h-4 w-12" />
				</div>
				<div className="h-px w-full bg-slate-200" />
				<div className="flex items-center justify-between">
					<Sk className="h-9 w-24 rounded-full" />
					<Sk className="h-9 w-9 rounded-full" />
				</div>
			</div>
		</div>
	);
}

function FilterSkeleton() {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
			<div className="flex items-center justify-between">
				<Sk className="h-5 w-24" />
				<Sk className="h-9 w-20 rounded-xl" />
			</div>
			<Sk className="h-10 w-full rounded-2xl" />
			<Sk className="h-10 w-full rounded-2xl" />
			<Sk className="h-10 w-full rounded-2xl" />
			<div className="grid grid-cols-2 gap-3">
				<Sk className="h-10 w-full rounded-2xl" />
				<Sk className="h-10 w-full rounded-2xl" />
			</div>
			<Sk className="h-10 w-full rounded-2xl" />
			<Sk className="h-10 w-full rounded-2xl" />
		</div>
	);
}

/* ---------------- Pagination helpers ---------------- */
type PageToken = number | "…";

function getPages(current: number, total: number): PageToken[] {
	// compact pagination: 1 … (c-1,c,c+1) … total
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

	const pages = new Set<number>([1, total, current]);
	if (current - 1 >= 1) pages.add(current - 1);
	if (current + 1 <= total) pages.add(current + 1);

	const sorted = Array.from(pages).sort((a, b) => a - b);

	const out: PageToken[] = [];
	for (let i = 0; i < sorted.length; i++) {
		const p = sorted[i];
		const prev = sorted[i - 1];
		if (i > 0 && p - prev > 1) out.push("…");
		out.push(p);
	}

	return out;
}

export default function AllProductsPage() {
	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	// ✅ server data
	const [products, setProducts] = useState<ProductI[]>([]);
	const [meta, setMeta] = useState<Meta>({
		current_page: 1,
		per_page: 15,
		total: 0,
		last_page: 1,
	});

	// ✅ loading split (important)
	const [initialLoading, setInitialLoading] = useState(true); // first time only
	const [isFetching, setIsFetching] = useState(false); // later searches/filters/pagination

	// ✅ UI
	const [showFilter, setShowFilter] = useState(false);

	// ✅ endpoint params
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(15);

	const [filters, setFilters] = useState<ProductsApiFilters>({
		search: "",
		category_id: "",
		material_id: "",
		color_id: "",
		price_from: "",
		price_to: "",
	});

	const [sortBy, setSortBy] = useState<SortBy>("price");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// keep previous products while fetching to avoid "hide all"
	const prevProductsRef = useRef<ProductI[]>([]);
	useEffect(() => {
		prevProductsRef.current = products;
	}, [products]);

	// ✅ Options (IDs) extracted from results
	const categoriesOptions = useMemo<Option[]>(() => {
		return uniqOptions(
			products
				.map((p) => (p as any).category)
				.filter(Boolean)
				.map((c: any) => ({ id: c.id, name: c.name }))
		);
	}, [products]);

	const materialsOptions = useMemo<Option[]>(() => {
		return uniqOptions(
			products.flatMap((p) => ((p as any).materials || []).map((m: any) => ({ id: m.id, name: m.name })))
		);
	}, [products]);

	const colorsOptions = useMemo<Option[]>(() => {
		return uniqOptions(
			products.flatMap((p) => ((p as any).colors || []).map((c: any) => ({ id: c.id, name: c.name })))
		);
	}, [products]);

	const sortOptions = useMemo(
		() => [
			{ label: "السعر: من الأقل إلى الأكثر", value: "price|asc" },
			{ label: "السعر: من الأكثر إلى الأقل", value: "price|desc" },
			{ label: "الأعلى تقييماً", value: "rating|desc" },
		],
		[]
	);

	const sortValue = `${sortBy}|${sortDirection}`;
	const totalPages = meta.last_page || 1;

	// =========================
	// Fetch (SERVER FILTERS)
	// =========================
	useEffect(() => {
		if (!API_URL) return;

		const controller = new AbortController();

		async function fetchProducts() {
			if (initialLoading) setInitialLoading(true);
			setIsFetching(true);

			try {
				const params = new URLSearchParams();
				params.set("page", String(page));
				params.set("per_page", String(perPage));

				if (filters.category_id) params.set("category_id", String(filters.category_id));
				if (filters.color_id) params.set("color_id", String(filters.color_id));
				if (filters.material_id) params.set("material_id", String(filters.material_id));
				if (filters.price_from) params.set("price_from", String(filters.price_from));
				if (filters.price_to) params.set("price_to", String(filters.price_to));
				if (filters.search.trim()) params.set("search", filters.search.trim());

				params.set("sort_by", sortBy);
				params.set("sort_direction", sortDirection);

				const res = await fetch(`${API_URL}/products?${params.toString()}`, {
					signal: controller.signal,
					cache: "no-store",
				});

				const json: ApiResponse = await res.json();

				setProducts(Array.isArray(json.data) ? json.data : []);
				if (json.meta) setMeta(json.meta);
			} catch (err: any) {
				if (err?.name !== "AbortError") console.error("Error fetching products:", err);
				// ✅ keep previous products (don’t clear)
				setProducts((p) => (p.length ? p : prevProductsRef.current));
			} finally {
				setIsFetching(false);
				setInitialLoading(false);
			}
		}

		fetchProducts();
		return () => controller.abort();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [API_URL, page, perPage, filters, sortBy, sortDirection]);

	const onFilterChange = (next: ProductsApiFilters) => {
		setFilters(next);
		setPage(1);
	};

	const handleFavoriteChange = (productId: number, newValue: boolean) => {
		setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, is_favorite: newValue } : p)));
	};

	const gridSkeletonCount = useMemo(() => {
		// show same density as perPage but capped for UX
		const n = Math.min(perPage, 16);
		return Array.from({ length: n });
	}, [perPage]);

	return (
		<section dir="rtl">
			<div className="container pt-2 pb-6 md:py-12">
				{/* Header */}
				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
					<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
						<div>
							<h1 className="text-2xl md:text-3xl font-black text-slate-900">جميع المنتجات</h1>

							{/* ✅ Only skeleton for this line */}
							<div className="mt-1">
								{initialLoading ? (
									<Sk className="h-4 w-44" />
								) : (
									<p className="max-md:hidden text-sm text-slate-500">
										عرض <span className="font-extrabold text-slate-900">{meta.total}</span> منتج
										{isFetching ? <span className="mx-2 text-slate-400">• جاري التحديث…</span> : null}
									</p>
								)}
							</div>
						</div>

						{/* actions */}
						<div className="flex flex-wrap items-center gap-2">
							{/* Mobile filter */}
							<button
								onClick={() => setShowFilter(true)}
								className="lg:hidden inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm font-extrabold shadow-sm hover:shadow transition"
							>
								<FiFilter /> تصفية
							</button>

							{/* per_page */}
							<FormControl className="max-md:!hidden" size="small" sx={{ minWidth: 130 }}>
								<Select
									value={perPage}
									onChange={(e) => {
										setPerPage(Number(e.target.value));
										setPage(1);
									}}
									IconComponent={KeyboardArrowDownRoundedIcon}
									sx={{
										direction: "rtl",
										borderRadius: "14px",
										backgroundColor: "#fff",
										fontWeight: 900,
										fontSize: "0.9rem",
										boxShadow: "0 1px 2px rgba(0,0,0,.06)",
										fontFamily: "Cairo, Cairo Fallback",
										"& .MuiSelect-select": { padding: "10px 14px 10px 38px" },
										"& fieldset": { borderColor: "#e2e8f0" },
										"&:hover fieldset": { borderColor: "#cbd5e1" },
										"& .MuiSvgIcon-root": { left: 10, right: "auto", color: "#64748b" },
									}}
									MenuProps={{
										PaperProps: {
											sx: {
												mt: 1,
												borderRadius: "14px",
												boxShadow: "0 12px 30px rgba(0,0,0,.12)",
												direction: "rtl",
												fontFamily: "Cairo, Cairo Fallback",
											},
										},
									}}
								>
									{[10, 15, 20, 30].map((n) => (
										<MenuItem key={n} value={n}>
											{n} / صفحة
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* sort */}
							<FormControl size="small" sx={{ minWidth: 250 }}>
								<Select
									value={sortValue}
									onChange={(e) => {
										const [sb, sd] = String(e.target.value).split("|") as [SortBy, SortDirection];
										setSortBy(sb);
										setSortDirection(sd);
										setPage(1);
									}}
									displayEmpty
									IconComponent={KeyboardArrowDownRoundedIcon}
									renderValue={(selected) => sortOptions.find((o) => o.value === selected)?.label || "الترتيب"}
									sx={{
										direction: "rtl",
										borderRadius: "14px",
										backgroundColor: "#fff",
										fontWeight: 900,
										fontSize: "0.9rem",
										boxShadow: "0 1px 2px rgba(0,0,0,.06)",
										fontFamily: "Cairo, Cairo Fallback",
										"& .MuiSelect-select": { padding: "10px 14px 10px 38px" },
										"& fieldset": { borderColor: "#e2e8f0" },
										"&:hover fieldset": { borderColor: "#cbd5e1" },
										"&.Mui-focused fieldset": {
											borderColor: "#94a3b8",
											boxShadow: "0 0 0 3px rgba(148,163,184,.25)",
										},
										"& .MuiSvgIcon-root": { left: 10, right: "auto", color: "#64748b" },
									}}
									MenuProps={{
										PaperProps: {
											sx: {
												mt: 1,
												borderRadius: "14px",
												boxShadow: "0 12px 30px rgba(0,0,0,.12)",
												direction: "rtl",
												fontFamily: "Cairo, Cairo Fallback",
												"& .MuiMenuItem-root": {
													fontWeight: 800,
													fontSize: "0.9rem",
													borderRadius: "10px",
													mx: 1,
													my: 0.5,
												},
												"& .Mui-selected": {
													backgroundColor: "#0f172a !important",
													color: "#fff",
												},
											},
										},
									}}
								>
									{sortOptions.map((o) => (
										<MenuItem key={o.value} value={o.value}>
											{o.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>


						</div>
					</div>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
					{/* Desktop Filters */}
					<div className="hidden lg:block lg:col-span-3 sticky top-[160px] self-start">
						{initialLoading ? (
							<FilterSkeleton />
						) : (
							<ProductFilterApi
								value={filters}
								onChange={onFilterChange}
								categories={categoriesOptions}
								materials={materialsOptions}
								colors={colorsOptions}
							/>
						)}
					</div>

					{/* Content */}
					<div className="lg:col-span-9">
						<div className="relative">
							{initialLoading || isFetching ? (
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
									{gridSkeletonCount.map((_, i) => (
										<ProductCardSkeleton key={`init-sk-${i}`} />
									))}
								</div>
							) : products.length === 0 ? (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="bg-white border border-slate-200 rounded-2xl p-10 text-center"
								>
									<p className="text-slate-700 font-extrabold text-lg">لا توجد منتجات مطابقة للفلاتر</p>
									<p className="text-slate-500 text-sm mt-2">جرّب إزالة بعض الفلاتر أو تغيير البحث</p>
								</motion.div>
							) : (
								<div className="grid  grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
									{products.map((product) => (
										<ProductCard
										product={product}
											key={product.id}
											id={product.id}
											name={product.name}
											image={product.image || "/images/c1.png"}
											images={
												product.images?.length
													? product.images
													: [{ url: "/images/c1.png", alt: "default image" }]
											}
											price={(product.price ?? 1).toString()}
											final_price={product.final_price}
											discount={
												product.discount
													? {
														value: product.discount.value.toString(),
														type: product.discount.type.toString(),
													}
													: null
											}
											stock={product.stock || 0}
											average_rating={product.average_rating}
											reviews={product.reviews}
											className2="hidden"
											is_favorite={product.is_favorite}
											onFavoriteChange={handleFavoriteChange}
											Bottom="bottom-41.5"
										/>
									))}
								</div>
							)}


						</div>

						{/* ✅ Custom Pagination (your design) */}
						{totalPages > 1 && (
							<div className="mt-10 flex items-center justify-center">
								<div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
									<button
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700
                      hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
										aria-label="السابق"
									>
										<ChevronRight className="w-4 h-4" />
									</button>

									<div className="h-6 w-px bg-slate-200 mx-1" />

									<div className="flex items-center gap-1">
										{getPages(page, totalPages).map((p, idx) =>
											p === "…" ? (
												<span key={`dots-${idx}`} className="px-2 text-slate-400 font-extrabold">
													…
												</span>
											) : (
												<motion.button
													key={p}
													whileHover={{ scale: 1.03 }}
													whileTap={{ scale: 0.98 }}
													onClick={() => setPage(p)}
													className={[
														"min-w-[38px] h-[38px] rounded-xl px-2 text-sm font-black transition",
														p === page ? "bg-[#14213d] text-white shadow" : "text-slate-700 hover:bg-slate-50",
													].join(" ")}
													aria-current={p === page ? "page" : undefined}
													aria-label={`الصفحة ${p}`}
												>
													{p}
												</motion.button>
											)
										)}
									</div>

									<div className="h-6 w-px bg-slate-200 mx-1" />

									<button
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={page >= totalPages}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700
                      hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
										aria-label="التالي"
									>
										<ChevronLeft className="w-4 h-4" />
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Mobile Filter Drawer (Framer Motion) */}
			<AnimatePresence>
				{showFilter && (
					<>
						<motion.div
							className="fixed inset-0 bg-black/40 z-40"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setShowFilter(false)}
						/>

						<motion.div
							className="fixed top-0 right-0 h-full w-[86%] max-w-[360px] bg-white z-50 shadow-2xl"
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "spring", stiffness: 320, damping: 30 }}
						>
							<div className="p-4 border-b border-slate-200 flex items-center justify-between">
								<h3 className="font-black text-lg text-slate-900">تصفية</h3>
								<button
									onClick={() => setShowFilter(false)}
									className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-extrabold hover:bg-slate-50 transition"
								>
									إغلاق
								</button>
							</div>

							<div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
								{initialLoading ? (
									<FilterSkeleton />
								) : (
									<ProductFilterApi
										value={filters}
										onChange={onFilterChange}
										categories={categoriesOptions}
										materials={materialsOptions}
										colors={colorsOptions}
									/>
								)}
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</section>
	);
}






