"use client";

import { useEffect, useMemo, useState, useCallback, useDeferredValue } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Stack from "@mui/material/Stack";
import Pagination from "@mui/material/Pagination";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import { FiSearch } from "react-icons/fi";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { ProductI } from "@/Types/ProductsI";

/* ---------------- Skeleton (Shimmer) ---------------- */
function Sk({ className = "" }: { className?: string }) {
	return (
		<div
			className={[
				"relative overflow-hidden rounded-xl bg-slate-200/70 ring-1 ring-black/5",
				"sk-shimmer",
				className,
			].join(" ")}
		/>
	);
}
function useDebounce<T>(value: T, delay = 1000) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);

	return debounced;
}

function ProductCardSkeleton() {
	return (
		<div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
			<div className="relative h-[150px] md:h-[240px] bg-slate-50">
				<Sk className="absolute inset-0 rounded-none" />
			</div>
			<div className="p-4 space-y-3">
				<Sk className="h-5 w-10/12" />
				<Sk className="h-4 w-7/12" />
				<div className="flex items-center gap-2">
					<Sk className="h-4 w-20" />
					<Sk className="h-4 w-12" />
				</div>
				<Sk className="h-px w-full rounded-none" />
				<div className="flex items-center justify-between">
					<Sk className="h-9 w-24 rounded-full" />
					<Sk className="h-9 w-9 rounded-full" />
				</div>
			</div>
		</div>
	);
}

export default function SearchPage() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const query = searchParams.get("q")?.trim() || "";
	const [localQ, setLocalQ] = useState(query);

	useEffect(() => setLocalQ(query), [query]);

	const debouncedQ = useDebounce(localQ.trim(), 1000);


	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const [loading, setLoading] = useState(true);
	const [products, setProducts] = useState<ProductI[]>([]);
	const [page, setPage] = useState<number>(1);
	const rowsPerPage = 12;

	const [priceOrder, setPriceOrder] = useState<"" | "asc" | "desc" | "rating">("");
	const [density, setDensity] = useState<"normal" | "compact">("normal");
 

	// fetch products
	useEffect(() => {
  if (!debouncedQ) {
    setProducts([]);
    setLoading(false);
    return;
  }

  const controller = new AbortController();

  async function fetchSearchResults() {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/products?search=${encodeURIComponent(debouncedQ)}`,
        { cache: "no-store", signal: controller.signal }
      );

      const data = await res.json();
      const list: ProductI[] = data?.data || [];
      setProducts(list);
      setPage(1);
    } catch (err: any) {
      // تجاهل AbortError
      if (err?.name !== "AbortError") {
        console.error("Error searching products:", err);
        setProducts([]);
      }
    } finally {
      // مهم: ما تعملش setLoading(false) لو اتعمل abort
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  fetchSearchResults();

  return () => controller.abort();
}, [API_URL, debouncedQ]);


	// sorting
	const sortedProducts = useMemo(() => {
		if (!priceOrder) return products;

		const sorted = [...products];

		if (priceOrder === "asc" || priceOrder === "desc") {
			sorted.sort((a, b) => {
				const priceA = Number(a.final_price ?? a.price ?? 0);
				const priceB = Number(b.final_price ?? b.price ?? 0);
				return priceOrder === "asc" ? priceA - priceB : priceB - priceA;
			});
		} else if (priceOrder === "rating") {
			sorted.sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
		}

		return sorted;
	}, [products, priceOrder]);

	// pagination slice
	const paginatedProducts = useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		return sortedProducts.slice(start, start + rowsPerPage);
	}, [sortedProducts, page]);

	const handleFavoriteChange = useCallback((productId: number, newValue: boolean) => {
		setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, is_favorite: newValue } : p)));
	}, []);

	const totalPages = useMemo(() => Math.ceil(sortedProducts.length / rowsPerPage), [sortedProducts.length]);

	const onChangePage = useCallback((_e: any, value: number) => {
		setPage(value);
		// UX: ارجع لفوق بهدوء
		if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	const submitLocalSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const v = localQ.trim();
			if (!v) return;
			router.push(`/search?q=${encodeURIComponent(v)}`);
		},
		[localQ, router]
	);

	// Empty query
	if (!query) {
		return (
			<section className="container py-12 text-center" dir="rtl">
				<div className="rounded-3xl border border-slate-200 bg-white p-8">
					<h1 className="text-3xl font-extrabold text-slate-900 mb-2">ابحث عن منتج</h1>
					<p className="text-slate-600">اكتب كلمة في شريط البحث أولاً</p>

					<form onSubmit={submitLocalSearch} className="mt-6 max-w-xl mx-auto relative">
						<FiSearch className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400" />
						<input
							value={localQ}
							onChange={(e) => setLocalQ(e.target.value)}
							placeholder="مثال: بوكس - استيكر - رول..."
							className="w-full h-12 rounded-2xl border border-slate-200 bg-white pr-11 pl-4 outline-none focus:ring-2 focus:ring-pro/30"
						/>
					</form>
				</div>
			</section>
		);
	}

	return (
		<section className="container py-10" dir="rtl">
			{/* Hero */}
			<div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
				<div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div>
							<h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
								نتائج البحث عن: <span className="text-pro">{query}</span>
							</h1>
							<p className="text-slate-600 mt-2">
								{loading ? "جاري البحث..." : `تم العثور على ${sortedProducts.length} منتج`}
							</p>
						</div>

						{/* Inline Search */}
						<form onSubmit={submitLocalSearch} className="w-full lg:w-[420px] relative">
							<FiSearch className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400" />
							<input
								value={localQ}
								onChange={(e) => setLocalQ(e.target.value)}
								placeholder="غيّر كلمة البحث بسرعة..."
								className="w-full h-12 rounded-2xl border border-slate-200 bg-white pr-11 pl-4 outline-none focus:ring-2 focus:ring-pro/30"
							/>
						</form>
					</div>

				</div>

				{/* Body */}
				<div className="p-6 md:p-8">
					{/* Loading Skeleton */}
					{loading ? (
						<div
							className={`grid gap-6 ${density === "compact"
									? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
									: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
								}`}
						>
							{Array.from({ length: rowsPerPage }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : paginatedProducts.length === 0 ? (
						<div className="text-center py-16 rounded-3xl border border-slate-200 bg-white">
							<p className="text-2xl font-extrabold text-slate-900 mb-2">
								لا توجد منتجات مطابقة
							</p>
							<p className="text-slate-600">{`جرّب كلمات مفتاحية أخرى بدل "${query}"`}</p>
						</div>
					) : (
						<>
							<div
								className={`grid gap-6 ${density === "compact"
										? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
										: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
									}`}
							>
								{paginatedProducts.map((product) => (
									<ProductCard
									product={product}
										key={product.id}
										{...product}
										image={product.image || "/images/c1.png"}
										images={
											product.images?.length
												? product.images
												: [{ url: "/images/c1.png", alt: "default" } as any]
										}
										price={(product.price ?? 0).toString()}
										className2="hidden"
										Bottom="bottom-41.5"
										onFavoriteChange={handleFavoriteChange}
									/>
								))}
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="mt-10 flex justify-center">
									<Stack spacing={2}>
										<Pagination
											count={totalPages}
											page={page}
											onChange={onChangePage}
											color="primary"
											size="large"
											sx={{
												"& .MuiPaginationItem-icon": { transform: "scaleX(-1)" },
											}}
										/>
									</Stack>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</section>
	);
}
