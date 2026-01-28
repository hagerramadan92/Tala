"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Discount from "@/components/Discount";
import ProductCard from "@/components/ProductCard";
import ProductFilter from "@/components/ProductFilter";
import { FiFilter, FiGrid, FiList } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ProductI } from "@/Types/ProductsI";
import CategoryPageSkeleton from "@/components/skeletons/HomeSkeletons";
import { ChevronDown } from "lucide-react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { LayoutGrid, Grid2X2, Columns3, Columns4 } from "lucide-react"; // nice grid icons
import { FormControl, Select } from "@mui/material";
import { MenuItem } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";


interface CategoryChild {
	id: number;
	name: string;
	slug: string;
	image?: string;
}

interface CategoryData {
	id: number;
	name: string;
	slug: string;
	image?: string;
	sub_image?: string;
	is_parent: boolean;
	children: CategoryChild[];
	products: ProductI[];
	category_banners: { image: string }[];
}

interface Filters {
	available: boolean;
	brands: string[];
	materials: string[];
	colors: string[];
	categories: number[];
}

const fadeUp = {
	hidden: { opacity: 0, y: 10 },
	show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
};

export default function CategoryPage() {
	const API_URL = process.env.NEXT_PUBLIC_API_URL;
	const { id } = useParams();
	const categoryId = id as string;

	const [loading, setLoading] = useState(true);
	const [category, setCategory] = useState<CategoryData | null>(null);

	const [allProducts, setAllProducts] = useState<ProductI[]>([]);
	const [filteredProducts, setFilteredProducts] = useState<ProductI[]>([]);

	const [showFilter, setShowFilter] = useState(false);

	// UI state
	const [layout, setLayout] = useState<"grid" | "list">("grid");
	const [columns, setColumns] = useState<number>(4);
	const [page, setPage] = useState(1);
	const rowsPerPage = 12;

	const [priceOrder, setPriceOrder] = useState<"" | "asc" | "desc" | "rating">("");
	const [filterMaterials, setFilterMaterials] = useState<string[]>([]);
	const [filterColors, setFilterColors] = useState<string[]>([]);
	const [subCategories, setSubCategories] = useState<CategoryChild[]>([]);

	const extractFilters = (products: ProductI[]) => {
		const materials = [
			...new Set(
				products.flatMap((p) => p.materials?.map((m) => m.name) || []).filter(Boolean)
			),
		];
		const colors = [
			...new Set(products.flatMap((p) => p.colors?.map((c) => c.name) || []).filter(Boolean)),
		];

		setFilterMaterials(materials as string[]);
		setFilterColors(colors as string[]);
	};

	useEffect(() => {
		if (!categoryId) return;

		async function fetchCategoryAndProducts() {
			setLoading(true);
			try {
				const res = await fetch(`${API_URL}/categories/${categoryId}`);
				const result = await res.json();

				if (result.status && result.data) {
					const cat: CategoryData = result.data;
					setCategory(cat);
					setSubCategories(cat.children || []);

					// parent category => fetch children products too
					if (cat.is_parent && cat.children.length > 0) {
						const allProds: ProductI[] = [...(cat.products || [])];

						for (const child of cat.children) {
							try {
								const childRes = await fetch(`${API_URL}/categories/${child.id}`);
								const childData = await childRes.json();
								if (childData.status && childData.data?.products) {
									allProds.push(...childData.data.products);
								}
							} catch (err) {
								console.error(`Error fetching child ${child.id}:`, err);
							}
						}

						const uniqueProducts = Array.from(new Map(allProds.map((p) => [p.id, p])).values());

						setAllProducts(uniqueProducts);
						setFilteredProducts(uniqueProducts);
						extractFilters(uniqueProducts);
					} else {
						const prods = cat.products || [];
						setAllProducts(prods);
						setFilteredProducts(prods);
						extractFilters(prods);
					}
				} else {
					setCategory(null);
				}
			} catch (err) {
				console.error("Error fetching category:", err);
				setCategory(null);
			} finally {
				setLoading(false);
			}
		}

		fetchCategoryAndProducts();
	}, [categoryId, API_URL]);

	const handleFilterChange = (filters: Filters) => {
		let result = [...allProducts];

		if (filters.available) result = result.filter((p) => (p.stock ?? 0) > 0);

		if (filters.categories.length > 0) {
			result = result.filter((p) => filters.categories.includes(p.category?.id || 0));
		}

		if (filters.materials.length > 0) {
			result = result.filter((p) => p.materials?.some((m) => filters.materials.includes(m.name)));
		}

		if (filters.colors.length > 0) {
			result = result.filter((p) => p.colors?.some((c) => filters.colors.includes(c.name)));
		}

		setFilteredProducts(result);
		setPage(1);
	};

	const sortedProducts = useMemo(() => {
		if (!priceOrder) return filteredProducts;
		const sorted = [...filteredProducts];

		if (priceOrder === "asc" || priceOrder === "desc") {
			sorted.sort((a, b) => {
				const pa = Number(a.final_price ?? a.price ?? 0);
				const pb = Number(b.final_price ?? b.price ?? 0);
				return priceOrder === "asc" ? pa - pb : pb - pa;
			});
		} else if (priceOrder === "rating") {
			sorted.sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
		}

		return sorted;
	}, [filteredProducts, priceOrder]);

	const paginatedProducts = useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		return sortedProducts.slice(start, start + rowsPerPage);
	}, [sortedProducts, page]);

	const handleFavoriteChange = (productId: number, newValue: boolean) => {
		const update = (arr: ProductI[]) =>
			arr.map((p) => (p.id === productId ? { ...p, is_favorite: newValue } : p));

		setAllProducts(update);
		setFilteredProducts(update);
	};

	if (loading) return <CategoryPageSkeleton />;

	if (!category) {
		return (
			<div className="text-center py-20 text-xl text-gray-600" dir="rtl">
				القسم غير موجود
			</div>
		);
	}

	const gridClass =
		layout === "list"
			? "grid grid-cols-1  gap-2 md:gap-3  "
			: columns === 1
				? "grid grid-cols-1  gap-2 md:gap-3  "
				: columns === 2
					? "grid grid-cols-2 g gap-2 md:gap-3  "
					: columns === 3
						? "grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3  "
						: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-2 md:gap-3  ";

	const sortOptions: { label: string; value: "" | "rating" | "asc" | "desc" }[] = [
		{ label: "الخيارات المميزة", value: "" },
		{ label: "الأعلى تقييماً", value: "rating" },
		{ label: "من الأقل إلى الأكثر", value: "asc" },
		{ label: "من الأكثر إلى الأقل", value: "desc" },
	];


	function getPages(
		current: number,
		total: number,
		range: number = 1 // 👈 reduce this on mobile
	) {
		if (total <= 2 * range + 5) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		const pages: (number | "…")[] = [];
		const left = Math.max(2, current - range);
		const right = Math.min(total - 1, current + range);

		pages.push(1);

		if (left > 2) pages.push("…");

		for (let p = left; p <= right; p++) {
			pages.push(p);
		}

		if (right < total - 1) pages.push("…");

		pages.push(total);

		return pages;
	}


	const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);

	return (
		<section className="  " >
			<div className=" container pt-2 pb-6 md:py-12">
				{/* Header */}
				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
					<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
						<div>
							<h1 className="text-2xl md:text-3xl font-black text-slate-900">{category.name}</h1>
							<p className=" max-md:hidden text-sm text-slate-500 mt-1">
								عرض <span className="font-extrabold text-slate-900">{filteredProducts.length}</span>{" "}
								منتج
							</p>
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



							{/* Columns (grid only) */}
							<div className="hidden lg:flex items-center gap-1 rounded-xl bg-white border border-slate-200 p-1 shadow-sm">
								{[
									{ c: 4, Icon: Columns4, label: "٤ أعمدة" },
									{ c: 3, Icon: Columns3, label: "٣ أعمدة" },
									{ c: 2, Icon: Grid2X2, label: "عمودين" },
								].map(({ c, Icon, label }) => {
									const active = columns === c;
									return (
										<motion.button
											key={c}
											whileTap={{ scale: 0.95 }}
											whileHover={{ scale: 1.03 }}
											onClick={() => setColumns(c)}
											className={[
												"relative grid place-items-center w-9 h-7 rounded-lg transition",
												active
													? "bg-[#14213d] text-white shadow"
													: "text-slate-600 hover:bg-slate-50",
											].join(" ")}
											aria-label={label}
											title={label}
										>
											<Icon className="w-4 h-4" />

										</motion.button>
									);
								})}
							</div>

							{/* Sort (enhanced select) */}
							<FormControl size="small" sx={{ minWidth: 180 }}>
								<Select
									value={priceOrder}
									onChange={(e) => setPriceOrder(e.target.value as any)}
									displayEmpty
									IconComponent={KeyboardArrowDownRoundedIcon}
									renderValue={(selected) =>
										sortOptions.find((o) => o.value === selected)?.label ||
										"الترتيب الافتراضي"
									}
									sx={{
										direction: "rtl",
										borderRadius: "14px",
										backgroundColor: "#fff",
										fontWeight: 800,
										fontSize: "0.9rem",
										boxShadow: "0 1px 2px rgba(0,0,0,.06)",
										fontFamily: "Cairo, Cairo Fallback",
										// input padding (leave space for icon on LEFT)
										"& .MuiSelect-select": {
											padding: "10px 14px 10px 38px", // left space for arrow
										},

										// border
										"& fieldset": {
											borderColor: "#e2e8f0",
										},
										"&:hover fieldset": {
											borderColor: "#cbd5e1",
										},
										"&.Mui-focused fieldset": {
											borderColor: "#94a3b8",
											boxShadow: "0 0 0 3px rgba(148,163,184,.25)",
										},

										// 🔽 move arrow to LEFT
										"& .MuiSvgIcon-root": {
											left: 10,
											right: "auto",
											color: "#64748b",
										},
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
													fontWeight: 700,
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
										<MenuItem className="font-ar" key={o.value} value={o.value}>
											{o.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</div>
					</div>
				</motion.div>

				{/* Banner */}
				{category.category_banners?.[0]?.image && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
						<div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
							<Discount src={category.category_banners[0].image} href="#" />
						</div>
					</motion.div>
				)}

				<div className="  grid grid-cols-1 lg:grid-cols-12 gap-5">
					{/* Desktop Filters */}
					<div className="hidden lg:block lg:col-span-3">
						<ProductFilter
							materials={filterMaterials}
							colors={filterColors}
							categories={subCategories}
							onFilterChange={handleFilterChange}
						/>
					</div>

					{/* Content */}
					<div className="lg:col-span-9">
						{/* Sub categories row */}
						{subCategories.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-6"
							>
								<div className="flex gap-2 md:gap-3  overflow-x-auto pb-2">
									{subCategories.map((sub) => (
										<a
											href={`/category/${sub.slug ?? sub.id}`}
											key={sub.id}
											className="min-w-fit group"
										>
											<div className="flex flex-col items-center gap-2">
												<div className="relative w-[70px] h-[70px] rounded-full overflow-hidden bg-white border border-slate-200 shadow-sm group-hover:shadow transition">
													<Image
														src={sub.image || "/images/o1.jpg"}
														alt={sub.name}
														fill
														className="object-cover group-hover:scale-[1.06] transition duration-300"
													/>
												</div>
												<p className="text-xs font-extrabold text-slate-700 group-hover:text-pro transition line-clamp-1 w-[90px] text-center">
													{sub.name}
												</p>
											</div>
										</a>
									))}
								</div>
							</motion.div>
						)}

						{/* Products */}
						{paginatedProducts.length === 0 ? (
							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
								<p className="text-slate-700 font-extrabold text-lg">لا توجد منتجات مطابقة للفلاتر</p>
								<p className="text-slate-500 text-sm mt-2">
									جرّب إزالة بعض الفلاتر أو تغيير الترتيب
								</p>
							</motion.div>
						) : (
							<motion.div
								layout
								className={gridClass + " gap-2 md:gap-3  "}
							>
								<AnimatePresence mode="popLayout">
									{paginatedProducts.map((product, idx) => (
										<motion.div
											key={product.id}
											layout
											variants={fadeUp}
											initial="hidden"
											animate="show"
											exit={{ opacity: 0, scale: 0.98 }}
											custom={idx}
										>
											<ProductCard
												id={product.id}
												name={product.name}
												product={product}
												image={product.image || "/images/c1.png"}
												images={
													product.images?.length
														? product.images
														: [{ url: "/images/c1.png", alt: "default" }]
												}
												price={(product.price ?? 1).toString()}
												final_price={product.final_price}
												discount={
													product.discount
														? { value: product.discount.value.toString(), type: product.discount.type }
														: null
												}
												stock={product.stock || 0}
												average_rating={product.average_rating}
												reviews={product.reviews}
												is_favorite={product.is_favorite}
												onFavoriteChange={handleFavoriteChange}
												className2="hidden"
												Bottom="bottom-41.5"
											/>
										</motion.div>
									))}
								</AnimatePresence>
							</motion.div>
						)}

						{/* Pagination (simple + nice) */}

						{sortedProducts.length > rowsPerPage && (
							<div className="mt-10 flex items-center justify-center">
								<div
									className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white 
                 px-2 py-1.5 shadow-sm
                 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2"
								>
									{/* Prev */}
									<button
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
										className="inline-flex items-center gap-1 rounded-lg 
                   px-2 py-1.5 text-xs font-extrabold text-slate-700
                   hover:bg-slate-50 disabled:opacity-40 transition
                   sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
										aria-label="السابق"
									>
										<ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
									</button>

									<div className="h-5 w-px bg-slate-200 mx-0.5 sm:h-6 sm:mx-1" />

									{/* Page numbers */}
									<div className="flex items-center gap-0.5 sm:gap-1">
										{getPages(page, totalPages, 0).map((p, idx) =>
											p === "…" ? (
												<span
													key={`dots-${idx}`}
													className="px-1 text-xs font-extrabold text-slate-400 sm:px-2 sm:text-sm"
												>
													…
												</span>
											) : (
												<motion.button
													key={p}
													whileHover={{ scale: 1.03 }}
													whileTap={{ scale: 0.98 }}
													onClick={() => setPage(p)}
													className={[
														"min-w-[30px] h-[30px] rounded-lg px-1 text-xs font-black transition",
														"sm:min-w-[38px] sm:h-[38px] sm:rounded-xl sm:px-2 sm:text-sm",
														p === page
															? "bg-[#14213d] text-white shadow"
															: "text-slate-700 hover:bg-slate-50",
													].join(" ")}
													aria-current={p === page ? "page" : undefined}
													aria-label={`الصفحة ${p}`}
												>
													{p}
												</motion.button>
											)
										)}
									</div>

									<div className="h-5 w-px bg-slate-200 mx-0.5 sm:h-6 sm:mx-1" />

									{/* Next */}
									<button
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={page >= totalPages}
										className="inline-flex items-center gap-1 rounded-lg 
                   px-2 py-1.5 text-xs font-extrabold text-slate-700
                   hover:bg-slate-50 disabled:opacity-40 transition
                   sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
										aria-label="التالي"
									>
										<ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
							<div className="p-4 border-b flex items-center justify-between">
								<h3 className="font-black text-lg text-slate-900">تصفية</h3>
								<button
									onClick={() => setShowFilter(false)}
									className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-extrabold hover:bg-slate-50 transition"
								>
									إغلاق
								</button>
							</div>

							<div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
								<ProductFilter
									materials={filterMaterials}
									colors={filterColors}
									categories={subCategories}
									onFilterChange={handleFilterChange}
								/>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</section>
	);
}


