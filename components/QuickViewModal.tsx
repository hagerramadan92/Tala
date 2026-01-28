"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BsCart3 } from "react-icons/bs";
import { GoX } from "react-icons/go";
import DOMPurify from "dompurify";

type Product = {
	id: number;
	name: string;
	image: string | null;
	price?: string;
	final_price?: string;
	lowest_price?: number;
	average_rating?: number;
	total_reviews?: number;
	description?: string;
	stock?: number;
	category?: { name?: string; slug?: string };
	features?: { name: string; value: string }[];
	images?: { id: number; path: string; alt?: string; is_active?: boolean }[];
	meta?: { in_stock?: boolean; stock_status?: string };
};

type Props = {
	open: boolean;
	onClose: () => void;
	product: Product;

	onAddToCart: () => void;
	isAdding: boolean;
};

export default function QuickViewModal({
	open,
	onClose,
	product,
	onAddToCart,
	isAdding,
}: Props) {
	const [mounted, setMounted] = useState(false);
	const [activeImg, setActiveImg] = useState<string>("");

	const inStock =
		product?.meta?.in_stock ??
		((product?.stock ?? 0) > 0);

	// mount
	useEffect(() => setMounted(true), []);

	// reset image when product changes / open
	useEffect(() => {
		if (!product) return;
		const gallery = (product.images || []).filter((i) => i?.is_active !== false);
		setActiveImg(gallery?.[0]?.path || product.image || "/images/c1.png");
	}, [product?.id, open]);

	// lock scroll
	useEffect(() => {
		if (!mounted || !open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open, mounted]);

	// esc close
	useEffect(() => {
		if (!mounted || !open) return;
		const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, mounted, onClose]);

	const price = Number(product?.price || 0);
	const finalPrice = Number(product?.final_price || 0);
	const hasRealPrice = finalPrice > 0 || price > 0;
	const showLowest = !hasRealPrice && (product?.lowest_price ?? 0) > 0;
	const hasDiscount = price > 0 && finalPrice > 0 && price !== finalPrice;

	const safeDescription = useMemo(() => {
		const html = product?.description || "";
		return DOMPurify.sanitize(html, {
			USE_PROFILES: { html: true },
		});
	}, [product?.description]);

	const gallery = (product?.images || []).filter((i) => i?.is_active !== false);

	const content = (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						className="fixed inset-0 z-[80000] bg-black/60"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					/>

					{/* Wrapper */}
					<motion.div
						className="fixed inset-0 z-[90000] flex items-center justify-center p-3 md:p-6"
						initial={{ opacity: 0, y: 12, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 12, scale: 0.98 }}
						onClick={onClose}
					>
						<div
							className="w-full max-w-[980px] max-h-[90vh] overflow-auto rounded-2xl md:rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
							role="dialog"
							aria-modal="true"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b">
								<div className="min-w-0">
									<div className="text-[13px] text-gray-500 line-clamp-1">
										{product?.category?.name || "منتج"}
									</div>
									<div className="text-sm md:text-base font-extrabold text-gray-900 line-clamp-1">
										{product?.name}
									</div>
								</div>

								<button
									onClick={onClose}
									className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
									aria-label="Close"
								>
									<GoX size={18} />
								</button>
							</div>

							{/* Body */}
							<div className="grid grid-cols-1 md:grid-cols-2">
								{/* Left: Image */}
								<div className="bg-gray-50 p-3 md:p-5">
									<div className="relative w-full aspect-[4/3] md:aspect-[1/1] rounded-2xl bg-white overflow-hidden ring-1 ring-black/5">
										<img
											src={activeImg || product?.image || "/images/c1.png"}
											alt={product?.name}
											className="absolute inset-0 w-full h-full object-contain"
										/>
										{/* Stock badge */}
										<div className="absolute top-3 left-3">
											<span
												className={`px-3 py-1 text-[11px] font-extrabold rounded-full ring-1 ring-black/5 ${inStock ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
													}`}
											>
												{product?.meta?.stock_status || (inStock ? "متوفر" : "غير متوفر")}
											</span>
										</div>
									</div>

									{/* Thumbnails */}
									{gallery.length > 0 && (
										<div className="mt-3 flex gap-2 overflow-x-auto p-1">
											{[product?.image, ...gallery.map((g) => g.path)]
												.filter(Boolean)
												.slice(0, 8)
												.map((src, idx) => (
													<button
														key={`${src}-${idx}`}
														onClick={() => setActiveImg(String(src))}
														className={`h-16 w-16 flex-none rounded-xl overflow-hidden ring-2 transition ${String(src) === activeImg ? "ring-pro" : "ring-black/5 hover:ring-black/10"
															}`}
														aria-label="thumbnail"
													>
														<img
															src={String(src)}
															alt={product?.name}
															className="w-full h-full object-cover"
														/>
													</button>
												))}
										</div>
									)}
								</div>

								{/* Right: Info */}
								<div className="p-4 md:p-6 space-y-4">
									{/* Rating + Reviews */}
									<div className="flex items-center justify-between gap-2">
										<div className="text-xs text-gray-500">
											التقييم: {Number(product?.average_rating || 0).toFixed(1)} / 5
											{typeof product?.total_reviews === "number" && (
												<span className="ms-2 text-gray-400">({product.total_reviews} مراجعة)</span>
											)}
										</div>

										{/* little id chip */}
										<span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
											#{product?.id}
										</span>
									</div>

									{/* Price */}
									<div className="rounded-2xl ring-1 ring-black/5 p-4 bg-white">
										<div className="flex items-baseline gap-2">
											{hasRealPrice ? (
												<>
													<span className="text-xl font-extrabold text-pro">
														{finalPrice > 0 ? finalPrice : price} ر.س
													</span>
													{hasDiscount && (
														<span className="text-sm text-gray-400 line-through">
															{price} ر.س
														</span>
													)}
												</>
											) : showLowest ? (
												<>
													<span className="text-xl font-extrabold text-pro">
														يبدأ من {product.lowest_price} ر.س
													</span>
													<span className="text-xs text-gray-500">
														(السعر يحدد حسب الخيارات)
													</span>
												</>
											) : (
												<span className="text-sm font-bold text-gray-500">
													السعر يُحدد حسب الخيارات
												</span>
											)}
										</div>
									</div>

									{/* Features chips */}
									{product?.features?.length ? (
										<div className="flex flex-wrap gap-2">
											{product.features.slice(0, 8).map((f, i) => (
												<span
													key={`${f.name}-${i}`}
													className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-gray-100 text-gray-700 ring-1 ring-black/5"
												>
													{f.name}: {f.value}
												</span>
											))}
										</div>
									) : null}

									{/* Description */}
									{product?.description ? (
										<div className="rounded-2xl ring-1 ring-black/5 p-4 bg-gray-50">
											<div className="text-sm font-extrabold text-gray-900 mb-2">وصف سريع</div>
											<div
												className="prose prose-sm max-w-none prose-ul:my-2 prose-li:my-1 prose-h2:my-2 prose-h3:my-2"
												dangerouslySetInnerHTML={{ __html: safeDescription }}
											/>
										</div>
									) : null}

									{/* Actions */}
									<div className="flex flex-wrap items-center gap-2 pt-1">
										<button
											onClick={onAddToCart}
											disabled={!inStock || isAdding}
											className={`px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 ${inStock ? "bg-pro text-white hover:opacity-90" : "bg-gray-200 text-gray-400"
												}`}
										>
											{isAdding ? (
												<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
											) : (
												<BsCart3 />
											)}
											أضف للسلة
										</button>

										<Link
											href={`/product/${product?.id}`}
											className="px-4 py-2 rounded-xl font-extrabold bg-gray-100 hover:bg-gray-200 transition"
											onClick={onClose}
										>
											صفحة المنتج
										</Link>

										<button
											onClick={onClose}
											className="px-4 py-2 rounded-xl font-extrabold bg-white ring-1 ring-black/10 hover:bg-gray-50 transition"
										>
											إغلاق
										</button>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);

	if (!mounted) return null;
	return createPortal(content, document.body);
}
