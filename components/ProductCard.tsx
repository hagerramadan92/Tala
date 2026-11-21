'use client';

import { useMemo, useState } from 'react';
import HearComponent from './HearComponent';
import PriceComponent from './PriceComponent';
import ImageComponent from './ImageComponent';
import Link from 'next/link';
import { BsCart3 } from 'react-icons/bs';
import { useCart } from '@/src/context/CartContext';
import BottomSlider from './BottomSlider';
import { ProductI } from '@/Types/ProductsI';
import ShowImage from './ShowImage';
import RatingStars from './RatingStars';
import toast from 'react-hot-toast';
import { useAuth } from '@/src/context/AuthContext';
import { GoEye } from 'react-icons/go';
import { FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import QuickViewModal from './QuickViewModal';
import { Tooltip } from '@mui/material';

export default function ProductCard({
	product,
	id,
    slug,
	image,
	name,
	price,
	final_price,
	discount,
	stock,
	classNameHome = '',
	classNameCate = '',
	average_rating,
	reviews,
	total_reviews,
	is_favorite,
	selectedSizeId,
	selectedColorId,
	selectedPrintingMethodId,
	selectedPrintLocations = [],
	selectedEmbroiderLocations = [],
	selectedOptions = [],
	selectedDesignServiceId,
	isSample = false,
}: any) {
	const [showImage, setShowImage] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [quickViewOpen, setQuickViewOpen] = useState(false);
	const [quickViewProduct, setQuickViewProduct] = useState(product);
	const [loadingQuickView, setLoadingQuickView] = useState(false);

	const { authToken: token, favoriteIdsSet, setFavoriteProducts } = useAuth();

	const computedIsFavorite = useMemo(() => {
		if (favoriteIdsSet?.has(id)) return true;
		if (is_favorite) return true;

		try {
			const saved = JSON.parse(localStorage.getItem('favorites') || '[]') as number[];
			return saved.includes(id);
		} catch {
			return false;
		}
	}, [favoriteIdsSet, id, is_favorite]);

	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const openQuickView = async () => {
		if (loadingQuickView) return;

		if (product?.is_summary && API_URL) {
			setLoadingQuickView(true);
			try {
				const res = await fetch(`${API_URL}/products/${slug || id}`, {
					headers: { Accept: 'application/json' },
				});
				const json = await res.json();
				if (res.ok && json?.status && json?.data) setQuickViewProduct(json.data);
			} catch { }
			finally {
				setLoadingQuickView(false);
			}
		}

		setQuickViewOpen(true);
	};

	const inStock = (stock ?? 0) > 0;

	const toggleFavorite = async (productId: number) => {
		if (!token) {
			toast.error('يجب تسجيل الدخول أولاً');
			return;
		}

		const next = !computedIsFavorite;

		// ✅ Optimistic: حدّث الكونتكست
		setFavoriteProducts((prev: ProductI[]) => {
			if (next) {
				if (prev.some((p) => p.id === productId)) return prev;
				return [...prev, { id: productId } as ProductI];
			} else {
				return prev.filter((p) => p.id !== productId);
			}
		});

		// localStorage (اختياري)
		try {
			const raw = localStorage.getItem('favorites');
			const arr = raw ? (JSON.parse(raw) as number[]) : [];
			const set = new Set(arr);
			next ? set.add(productId) : set.delete(productId);
			localStorage.setItem('favorites', JSON.stringify([...set]));
		} catch { }

		try {
			const res = await fetch(`${API_URL}/favorites/toggle`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ product_id: productId }),
			});

			const data = await res.json().catch(() => null);

			if (!res.ok || !data?.status) {
				// ✅ rollback context
				setFavoriteProducts((prev: ProductI[]) => {
					if (!next) {
						if (prev.some((p) => p.id === productId)) return prev;
						return [...prev, { id: productId } as ProductI];
					} else {
						return prev.filter((p) => p.id !== productId);
					}
				});

				toast.error(data?.message || 'فشل تحديث المفضلة');
				return;
			}
		} catch {
			// ✅ rollback context
			setFavoriteProducts((prev: ProductI[]) => {
				if (!next) {
					if (prev.some((p) => p.id === productId)) return prev;
					return [...prev, { id: productId } as ProductI];
				} else {
					return prev.filter((p) => p.id !== productId);
				}
			});

			toast.error('حدث خطأ أثناء تحديث المفضلة');
		}
	};

	const { addToCart } = useCart();

	const handleAddToCart = async () => {
		// الزوار مسموح لهم بالإضافة — تسجيل الدخول مطلوب عند إتمام الطلب فقط
		if (isAdding || !inStock) return;

		setIsAdding(true);

		await addToCart(id, {
			quantity: 1,
			size_id: selectedSizeId ?? null,
			color_id: selectedColorId ?? null,
			printing_method_id: selectedPrintingMethodId ?? null,
			print_locations: selectedPrintLocations.length ? selectedPrintLocations : [],
			embroider_locations: selectedEmbroiderLocations.length ? selectedEmbroiderLocations : [],
			selected_options: selectedOptions.length ? selectedOptions : [],
			design_service_id: selectedDesignServiceId ?? null,
			is_sample: isSample,
		});

		setIsAdding(false);
	};

	// ✅ show lowest_price when final_price == 0 (or missing)
	const displayFinalPrice = useMemo(() => {
		const fp = Number(final_price || 0);
		if (fp > 0) return fp;

		const lp = Number(product?.lowest_price ?? 0);
		return lp > 0 ? lp : 0;
	}, [final_price, product?.lowest_price]);

	const displayPrice = useMemo(() => {
		const p = Number(price || 0);
		return p > 0 ? p : 0;
	}, [price]);

	const priceHasDiscount = useMemo(() => {
		if (!displayFinalPrice) return false;
		if (!displayPrice) return false;
		return displayPrice !== displayFinalPrice;
	}, [displayPrice, displayFinalPrice]);

	const showDiscountChip = Boolean(discount?.value);

	// وصف مختصر (أول كلمات من وصف المنتج) لتعبئة المساحة البيضاء
	const shortDesc = useMemo(() => {
		const raw = String((product as any)?.short_description || product?.description || "");
		if (!raw) return "";
		const text = raw
			.replace(/<[^>]*>/g, " ")
			.replace(/&nbsp;/gi, " ")
			.replace(/&amp;/gi, "&")
			.replace(/\s+/g, " ")
			.trim();
		return text.length > 110 ? `${text.slice(0, 110).trim()}…` : text;
	}, [product?.description, (product as any)?.short_description]);
	return (
		<motion.div
			className="relative group h-full"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
		>
			<motion.div
				whileHover={{ y: -3 }}
				transition={{ type: 'spring', stiffness: 260, damping: 18 }}
				className="relative flex h-full flex-col rounded-lg md:rounded-3xl border border-slate-200 bg-white overflow-hidden
                    shadow-sm hover:border-gray-200 transition"
			>
				{/* Image */}
				<div className={`relative w-full flex-1 min-h-[190px] md:min-h-[270px] bg-white`}>
					<Link href={`/product/${slug || id}`} className="block h-full">
						<div className="relative h-full overflow-hidden">
							<ImageComponent image={image || '/images/not.jpg'} />
							<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
						</div>
					</Link>

					{/* أزرار المفضلة والرؤية — على الشمال */}
					<div className="absolute top-2 left-2 md:top-3 md:left-3 z-20 flex flex-col items-center gap-2">
						<HearComponent
							onToggleLike={() => toggleFavorite(id)}
							liked={computedIsFavorite}
							ClassName="text-pro "
							ClassNameP="!w-9 !h-9"
						/>

						<motion.button
							aria-label="quick view"
							onClick={async (e) => {
								e.preventDefault();
								e.stopPropagation();
								await openQuickView();
							}}
							whileHover={{ scale: 1.08 }}
							whileTap={{ scale: 0.92 }}
							className="border border-slate-100 bg-white/95 backdrop-blur w-9 h-9 rounded-full flex items-center justify-center shadow ring-1 ring-black/5"
						>
							<GoEye className="text-gray-800" />
						</motion.button>
					</div>

					{/* Discount / Stock — على اليمين */}
					<div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
						<div className="flex flex-col gap-1 items-start">
							{product?.price_text && (<span className="px-2 md:px-3 py-1 max-w-[120px] md:max-w-[170px] text-[9px] md:text-[11px] leading-tight text-center font-extrabold rounded-lg md:rounded-full bg-emerald-500 text-white ring-1 ring-black/5 shadow-sm whitespace-normal break-words">
								{/* {product?.price_text?.slice(0, 10)} */}
								{/* {product?.price_text?.length > 17 ?product?.price_text?.slice(0, 17) + '...' :product?.price_text} */}
								{product?.price_text}
							</span>)}
							{showDiscountChip && (
								<span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-600 text-white shadow-sm">
									-{discount?.value}%
								</span>
							)}
							
						</div>
					</div>



					<QuickViewModal
						open={quickViewOpen}
						onClose={() => setQuickViewOpen(false)}
						product={quickViewProduct}

						onAddToCart={handleAddToCart}
						isAdding={isAdding}
					/>

					<AnimatePresence>
						{showImage && <ShowImage onClose={() => setShowImage(false)} src={image || '/images/not.jpg'} />}
					</AnimatePresence>




					{/* Rating on Image */}
					{/* <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
						<div className="bg-white/70 backdrop-blur-[2px] px-2 py-0.5 rounded-full shadow-sm scale-90">
							<RatingStars average_ratingc={average_rating || 0} reviewsc={reviews || []} />
						</div>
					</div> */}
				</div>

				{/* Content */}
				<div className="p-4 flex flex-col gap-3">
					<div>
					<Link href={`/product/${slug || id}`}>
						<Tooltip title={name} arrow placement="top">
							<h3 className="text-[12.5px] md:text-[14px] font-black text-gray-900 text-right leading-snug hover:text-pro transition break-words min-h-[2.6rem] md:min-h-[3rem]">
								{name}
							</h3>
						</Tooltip>
					</Link>

					{shortDesc && (
						<p className="text-[10.5px] md:text-[12px] leading-relaxed text-slate-500 font-semibold text-right line-clamp-2">
							{shortDesc}
						</p>
					)}
					</div>

					{/* Price */}
					{/* <div className={`flex items-center gap-2 max-md:!mb-1 ${classNameHome}`}>
						{displayFinalPrice > 0 ? (
							<div className='flex items-center gap-1 flex-wrap' >
								<PriceComponent start price_text={product?.price_text} />
								{priceHasDiscount && (
									<span className="text-sm text-gray-400 line-through">{displayPrice} ر.س</span>
								)}
							</div>
						) : null}
					</div> */}

					{/* أضف للسلة */}
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleAddToCart();
						}}
						disabled={isAdding || !inStock}
						className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12px] md:text-[13px] font-extrabold transition ${
							inStock
								? "bg-pro text-white hover:bg-pro-hover active:scale-[0.99]"
								: "bg-gray-100 text-gray-400 cursor-not-allowed"
						}`}
					>
						{isAdding ? (
							<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
						) : (
							<BsCart3 className="w-4 h-4" />
						)}
						{inStock ? "أضف للسلة" : "غير متوفر"}
					</button>

					{/* Divider */}
					<div className="h-px bg-gray-200/70" />

					{/* Bottom */}
					<BottomSlider text_ads={product?.text_ads} />
				</div>
			</motion.div>
		</motion.div>
	);
}
