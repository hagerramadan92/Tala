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
import { motion, AnimatePresence } from 'framer-motion';
import QuickViewModal from './QuickViewModal';

export default function ProductCard({
	product,
	id,
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
		if (!token) {
			toast.error('يجب تسجيل الدخول أولاً');
			return;
		}
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
	return (
		<motion.div
			className="relative group"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
		>
			<motion.div
				whileHover={{ y: -3 }}
				transition={{ type: 'spring', stiffness: 260, damping: 18 }}
				className="relative flex flex-col rounded-lg md:rounded-3xl border border-slate-200 bg-white overflow-hidden
                    shadow-sm hover:border-gray-200 transition"
			>
				{/* Image */}
				<div className={`relative w-full h-[150px] md:h-[240px] bg-gray-50`}>
					<Link href={`/product/${id}`} className="block h-full">
						<div className="relative h-full overflow-hidden">
							<ImageComponent image={image || '/images/c1.png'} />
							<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
						</div>
					</Link>

					{/* Top actions */}
					<div className="absolute top-1 md:top-3 inset-x-1  md:inset-x-3 flex items-center justify-between z-10">
						<HearComponent
							onToggleLike={() => toggleFavorite(id)}
							liked={computedIsFavorite}
							ClassName="text-pro "
							ClassNameP="!w-9 !h-9"
						/>
						{/* Discount / Stock */}
						{showDiscountChip ? (
							<span className="px-3 py-1 text-[11px] font-extrabold rounded-lg md:rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
								-{discount?.value}%
							</span>
						) : (
							<span
								className={`px-3 py-1 text-[11px] font-extrabold rounded-lg md:rounded-full ring-1 ring-black/5 ${inStock ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
									}`}
							>
								{inStock ? 'متوفر' : 'غير متوفر'}
							</span>
						)}
					</div>

					<motion.button
						aria-label="quick view"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setQuickViewOpen(true);
						}}
						whileHover={{ scale: 1.08 }}
						whileTap={{ scale: 0.92 }}
						className={`absolute top-[88px] md:top-[95px] right-[6px] md:start-[14px] border border-slate-100 bg-white/90 backdrop-blur w-9 h-9  rounded-full flex items-center justify-center shadow ring-1 ring-black/5 `}
					>
						<GoEye className="text-gray-800" />
					</motion.button>

					<QuickViewModal
						open={quickViewOpen}
						onClose={() => setQuickViewOpen(false)}
						product={product}

						onAddToCart={handleAddToCart}
						isAdding={isAdding}
					/>

					<AnimatePresence>
						{showImage && <ShowImage onClose={() => setShowImage(false)} src={image || '/images/c1.png'} />}
					</AnimatePresence>


					{/* Cart Floating Button (intentional placement) */}
					<motion.button
						aria-label="add to cart"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleAddToCart();
						}}
						disabled={isAdding || !inStock}
						whileHover={inStock && !isAdding ? { scale: 1.06 } : undefined}
						whileTap={inStock && !isAdding ? { scale: 0.92 } : undefined}
						className={`absolute right-[6px] md:right-3 top-[64px]  md:top-[72px] -translate-y-1/2 z-20 ${classNameCate}`}
					>
						<div
							className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ring-1 ring-black/5 ${inStock ? 'bg-pro text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
								}`}
						>
							{isAdding ? (
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : (
								<BsCart3 className="w-18 max-md:!w-16 " />
							)}
						</div>
					</motion.button>
				</div>

				{/* Content */}
				<div className="p-4 space-y-3">
					<Link href={`/product/${id}`}>
						<h3 className="text-sm md:text-[16px] font-extrabold text-gray-900 line-clamp-1 hover:text-pro transition">
							{name}
						</h3>
					</Link>

					{/* Price */}
					<div className={`flex items-center gap-2 max-md:!mb-1 ${classNameHome}`}>
						{displayFinalPrice > 0 ? (
							<div className='flex items-center gap-1 flex-wrap' >
								<PriceComponent start price_text={product?.price_text} />
								{priceHasDiscount && (
									<span className="text-sm text-gray-400 line-through">{displayPrice} ر.س</span>
								)}
							</div>
						) : null}
					</div>

					{/* Rating */}
					<RatingStars average_ratingc={average_rating || 0} reviewsc={reviews || []} />

					{/* Divider */}
					<div className="h-px bg-gray-200/70" />

					{/* Bottom */}
					<BottomSlider text_ads={product?.text_ads} />
				</div>
			</motion.div>
		</motion.div>
	);
}
