"use client";

/**
 * ✅ ONE FILE VERSION (ProductPageClient + StickerForm + shared utils)
 *
 * Fixes applied:
 * 1) ❌ لا نرسل (المقاس/اللون/الخامة/طريقة الطباعة/مكان الطباعة/كمية المقاس) داخل selected_options
 *    ✅ تُرسل فقط كمفاتيز IDs + quantity:
 *    - size_id, color_id, material_id, printing_method_id, print_locations (ids), quantity
 *
 * 2) ✅ خدمة التصميم (خدمة تصميم) لا تُضرب في الكمية (One-time)
 *    - في الحساب (extrasTotal) + داخل selected_options additional_price
 *
 * 3) ✅ (I have design) يرفع الملف AFTER add-to-cart فقط عبر:
 *    POST  {API_URL}/upload-image
 *    FormData: img, cart_item_id
 *
 * 4) ✅ StickerForm (Cart upload) تم توحيد الرفع لنفس endpoint /upload-image
 *    (في cart mode فقط، لأن لازم cart_item_id)
 */

import React, { useEffect, useMemo, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import toast from "react-hot-toast";

import HearComponent from "@/components/HearComponent";
import RatingStars from "@/components/RatingStars";
import ShareButton from "@/components/ShareButton";
import ProductGallery from "@/components/ProductGallery";
import CustomSeparator from "@/components/Breadcrumbs";
import ButtonComponent from "@/components/ButtonComponent";
import InStockSlider from "@/components/InStockSlider";
import ProductCard from "@/components/ProductCard";

import { useAuth } from "@/src/context/AuthContext";
import { useAppContext } from "@/src/context/AppContext";
import { useCart } from "@/src/context/CartContext";

import { FiAlertTriangle } from "react-icons/fi";
import { Trash2, Star, ChevronLeft, ChevronRight, ShieldCheck, Truck, Tags, Package, Eye, EyeOff } from "lucide-react";

import { ProductPageSkeleton, StickerFormSkeleton } from "../../../components/skeletons/HomeSkeletons";

// MUI (StickerForm)
import {
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormHelperText,
	CircularProgress,
	Alert,
	Button,
	Checkbox,
	ListItemText,
	Divider,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Typography,
} from "@mui/material";
import { Save, CheckCircle, Warning, Info, Refresh, ExpandMore } from "@mui/icons-material";

/* ------------------------------------------
 * Types
 * ------------------------------------------ */

type TabKey = "options" | "reviews" | "debug";

type ReviewUser = {
	id: number;
	name: string;
	avatar: string | null;
	is_verified?: boolean;
};

type Review = {
	id: number;
	product_id: number;
	user_id: number;
	rating: number;
	comment: string;
	is_verified: boolean;
	created_at: string;
	human_created_at?: string;
	user?: ReviewUser;
};

// ✅ SelectedOptions (must match StickerForm getOptions keys)
export type SelectedOptions = {
	size: string;

	// ✅ tier selection for size
	size_tier_id?: number | null;
	size_quantity?: number | null;
	size_price_per_unit?: number | null;
	size_total_price?: number | null;

	color: string;
	material: string;
	optionGroups: Record<string, string>;
	// ✅ NEW: لخزن القيم الفرعية (children)
	optionChildren: Record<string, string>;
	printing_method: string;

	// ✅ multi-select print locations (names in UI)
	print_locations: string[];

	isValid: boolean;
};

export interface StickerFormHandle {
	getOptions: () => SelectedOptions;
	validate: () => boolean;
}

/* ------------------------------------------
 * Shared helpers / rules
 * ------------------------------------------ */

const num = (v: any) => {
	const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
	return Number.isFinite(x) ? x : 0;
};

function getQty(opts: SelectedOptions) {
	const q = Math.floor(num(opts?.size_quantity));
	return q > 0 ? q : 1;
}

function computeSizeBaseTotal(opts: SelectedOptions) {
	const total = num(opts?.size_total_price);
	if (total > 0) return total;

	const qty = num(opts?.size_quantity);
	const unit = num(opts?.size_price_per_unit);
	const calc = qty > 0 && unit > 0 ? qty * unit : 0;
	return calc > 0 ? calc : 0;
}

/**
 * ✅ One-time service detector (Design service)
 * IMPORTANT: اسم الجروب عندك "خدمة تصميم" (بدون "ال")
 * فده كان سبب إنّه بيتضرب في الكمية.
 */
function isOneTimeServiceOption(optionName: string, optionValue?: string) {
	const name = String(optionName || "").trim().toLowerCase();
	const value = String(optionValue || "").trim().toLowerCase();

	// Arabic variants
	const ar1 = name.includes("خدمة تصميم");
	const ar2 = name.includes("خدمة التصميم");
	const ar3 = value.includes("خدمة تصميم") || value.includes("خدمة التصميم");

	// English variants
	const en1 = name.includes("design");
	const en2 = value.includes("design");

	return ar1 || ar2 || ar3 || en1 || en2;
}

/**
 * ✅ RULE (1) IDs payload only (no duplication in selected_options)
 */
function buildIdsPayload(apiData: any, opts: SelectedOptions) {
	const sizeObj = apiData?.sizes?.find((s: any) => s?.name === opts.size);
	const colorObj = apiData?.colors?.find((c: any) => c?.name === opts.color);
	const materialObj = apiData?.materials?.find((m: any) => m?.name === opts.material);
	const pmObj = apiData?.printing_methods?.find((p: any) => p?.name === opts.printing_method);

	// ✅ print locations => IDs only
	const printLocationIds =
		Array.isArray(opts.print_locations) && opts.print_locations.length
			? opts.print_locations
				.map((name: any) => apiData?.print_locations?.find((pl: any) => pl?.name === name)?.id)
				.filter((id: any) => typeof id === "number")
			: [];

	return {
		size_id: typeof sizeObj?.id === "number" ? sizeObj.id : null,
		color_id: typeof colorObj?.id === "number" ? colorObj.id : null,
		material_id: typeof materialObj?.id === "number" ? materialObj.id : null,
		printing_method_id: typeof pmObj?.id === "number" ? pmObj.id : null,
		print_locations: printLocationIds,
		embroider_locations: [],
	};
}

/**
 * ✅ RULE (1):
 * selected_options => optionGroups + optionChildren ONLY
 *
 * ✅ RULE (2):
 * - معظم الإضافات per-unit => تتضرب في qty
 * - "خدمة تصميم" => one-time (لا تُضرب في qty)
 */
function buildSelectedOptionsWithPrice(apiData: any, opts: SelectedOptions) {
	const selected_options: Array<{ option_name: string; option_value: string; additional_price: number }> = [];
	const qty = getQty(opts);

	// ✅ Handle optionGroups (الخيارات الرئيسية)
	Object.entries(opts.optionGroups || {}).forEach(([group, value]) => {
		if (!value || value === "اختر") return;

		// البحث في الهيكل الجديد للـ options
		const optionGroup = apiData?.options?.find((o: any) => o.name === group);
		if (!optionGroup) return;

		const optionItem = optionGroup.items?.find((item: any) => item.value === value);
		if (!optionItem) return;

		const perUnit = num(optionItem.base_price);
		const oneTime = isOneTimeServiceOption(group, value);

		selected_options.push({
			option_name: group,
			option_value: value,
			additional_price: oneTime ? perUnit : perUnit * qty,
		});

		// ✅ إذا كان للعنصر children، نضيف القيمة المختارة من optionChildren
		const childKey = `${group}::${value}`;
		const childValue = opts.optionChildren?.[childKey];
		if (childValue && childValue !== "اختر") {
			// البحث في children للعنصر
			const childItem = optionItem.children?.find((child: any) => child.value === childValue);
			if (childItem) {
				const childPerUnit = num(childItem.base_price);
				const childOneTime = isOneTimeServiceOption(childItem.name || group, childValue);
				
				selected_options.push({
					option_name: childItem.name || `${group} - تفاصيل`,
					option_value: childValue,
					additional_price: childOneTime ? childPerUnit : childPerUnit * qty,
				});
			}
		}
	});

	return selected_options;
}

function extractValueFromOptions(options: any[], optionName: string) {
	if (!options || !Array.isArray(options)) return null;
	const option = options.find((opt: any) => String(opt.option_name || "").trim() === String(optionName || "").trim());
	return option ? option.option_value : null;
}

function extractValuesFromOptions(options: any[], optionName: string) {
	if (!options || !Array.isArray(options)) return [];
	return options
		.filter((opt: any) => String(opt.option_name || "").trim() === String(optionName || "").trim())
		.map((x: any) => String(x.option_value || "").trim())
		.filter(Boolean);
}

/* ------------------------------------------
 * UI helpers
 * ------------------------------------------ */

const fadeUp: any = {
	hidden: { opacity: 0, y: 14 },
	show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function Sk({ className = "" }: { className?: string }) {
	return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

function ReviewsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="rounded-2xl border border-slate-200 bg-white p-4">
				<Sk className="h-5 w-40" />
				<Sk className="h-3 w-72 mt-3" />
				<Sk className="h-3 w-56 mt-2" />
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-2xl border border-slate-200 p-4">
						<div className="flex items-center gap-3">
							<Sk className="h-10 w-10 rounded-full" />
							<div className="flex-1">
								<Sk className="h-4 w-40" />
								<Sk className="h-3 w-24 mt-2" />
							</div>
							<Sk className="h-6 w-14" />
						</div>
						<Sk className="h-3 w-full mt-4" />
						<Sk className="h-3 w-10/12 mt-2" />
					</div>
				))}
			</div>
		</div>
	);
}

function StarsRow({ value }: { value: number }) {
	return (
		<div className="flex items-center gap-1">
			{Array.from({ length: 5 }).map((_, i) => {
				const filled = i < value;
				return (
					<Star
						key={i}
						className={`w-4 h-4 ${filled ? "text-amber-500" : "text-slate-300"}`}
						fill={filled ? "currentColor" : "none"}
					/>
				);
			})}
		</div>
	);
}

function getPages(current: number, total: number): Array<number | "…"> {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

	const pages = new Set<number>([1, total, current]);
	if (current - 1 >= 1) pages.add(current - 1);
	if (current + 1 <= total) pages.add(current + 1);

	const sorted = Array.from(pages).sort((a, b) => a - b);

	const out: Array<number | "…"> = [];
	for (let i = 0; i < sorted.length; i++) {
		const p = sorted[i];
		const prev = sorted[i - 1];
		if (i > 0 && p - (prev as number) > 1) out.push("…");
		out.push(p);
	}
	return out;
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
	return (
		<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
					{icon}
					{title}
				</h3>
			</div>
			<div className="mt-4">{children}</div>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-sm font-extrabold text-slate-700">{label}</p>
			<div className="text-sm font-black text-slate-900 text-left">{value}</div>
		</div>
	);
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "amber" | "emerald" }) {
	const map = {
		slate: "bg-slate-50 text-slate-700 border-slate-200",
		amber: "bg-amber-50 text-amber-800 border-amber-200",
		emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
	};
	return <span className={`text-[11px] font-extrabold px-2 py-1 rounded-full border ${map[tone]}`}>{children}</span>;
}

function OptChip({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-xs text-slate-500 font-bold">{label}</p>
			<p className="text-sm font-extrabold text-slate-900 mt-1">{value}</p>
		</div>
	);
}

const ratingLabels: Record<number, string> = {
	1: "سيئ جدًا",
	2: "سيئ",
	3: "متوسط",
	4: "جيد جدًا",
	5: "ممتاز",
};

interface StarRatingInputProps {
	value: number;
	onChange: (v: number) => void;
	disabled?: boolean;
}

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
	const [hovered, setHovered] = useState<number | null>(null);
	const activeValue = hovered ?? value;

	return (
		<div className="flex  items-center gap-2">
			<div className={`flex items-center  gap-1 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
				{[1, 2, 3, 4, 5].map((star) => {
					const filled = star <= activeValue;

					return (
						<motion.button
							key={star}
							type="button"
							whileHover={!disabled ? { scale: 1.15 } : undefined}
							whileTap={!disabled ? { scale: 0.95 } : undefined}
							onMouseEnter={() => !disabled && setHovered(star)}
							onMouseLeave={() => !disabled && setHovered(null)}
							onClick={() => !disabled && onChange(star)}
							className="focus:outline-none"
							aria-label={`تقييم ${star} نجوم`}
						>
							<Star className={`w-10 h-10 transition-colors ${filled ? "text-amber-400" : "text-slate-300"}`} fill={filled ? "currentColor" : "none"} />
						</motion.button>
					);
				})}
			</div>

			<motion.div key={activeValue} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-extrabold text-slate-700">
				{ratingLabels[activeValue] ?? ""}
			</motion.div>
		</div>
	);
}

/* ------------------------------------------
 * StickerForm Component (shared)
 * ------------------------------------------ */

type DesignSendMethod = "whatsapp" | "email" | "upload" | null;

function getSocialValue(socialMedia: any, key: "whatsapp" | "email") {
	const arr = Array.isArray(socialMedia) ? socialMedia : [];
	const item = arr.find((x: any) => String(x?.key).toLowerCase() === key);
	const value = String(item?.value || "").trim();
	return value || null;
}

interface StickerFormProps {
	cartItemId?: number;
	productId: number;
	productData?: any;

	onOptionsChange?: (options: SelectedOptions) => void;
	showValidation?: boolean;
	// ✅ NEW
	onDesignFileChange?: (file: File | null) => void;
}

export const StickerForm = forwardRef<StickerFormHandle, StickerFormProps>(function StickerForm(
	{ cartItemId, productId, productData, onOptionsChange, showValidation = false, onDesignFileChange },
	ref
) {
	const { updateCartItem, fetchCartItemOptions } = useCart();
	const { authToken: token, user, userId } = useAuth() as any;
	const { socialMedia } = useAppContext() as any;

	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	// main states
	const [apiData, setApiData] = useState<any>(null);
	const [formLoading, setFormLoading] = useState(true);
	const [apiError, setApiError] = useState<string | null>(null);

	const [size, setSize] = useState("اختر");
	const [color, setColor] = useState("اختر");
	const [material, setMaterial] = useState("اختر");
	const [optionGroups, setOptionGroups] = useState<Record<string, string>>({});
	// ✅ NEW: حالة للـ children
	const [optionChildren, setOptionChildren] = useState<Record<string, string>>({});
	const [printingMethod, setPrintingMethod] = useState("اختر");
	const [printLocations, setPrintLocations] = useState<string[]>([]);

	// tiers
	const [sizeTierId, setSizeTierId] = useState<number | null>(null);
	const [sizeTierQty, setSizeTierQty] = useState<number | null>(null);
	const [sizeTierUnit, setSizeTierUnit] = useState<number | null>(null);
	const [sizeTierTotal, setSizeTierTotal] = useState<number | null>(null);

	// save UI (cart mode)
	const [saving, setSaving] = useState(false);
	const [showSaveButton, setShowSaveButton] = useState(false);
	const [savedSuccessfully, setSavedSuccessfully] = useState(false);

	// design (optional in cart mode only)
	const [designFile, setDesignFile] = useState<File | null>(null);
	const [designSendMethod, setDesignSendMethod] = useState<DesignSendMethod>(null);
	const [designUploading, setDesignUploading] = useState(false);

	const groupedOptions = useMemo(() => {
		const list = Array.isArray(apiData?.options) ? apiData.options : [];
		const out: Record<string, any[]> = {};
		list.forEach((o: any) => {
			const k = String(o.name || "").trim();
			if (!k) return;
			out[k] = o.items || [];
		});
		return out;
	}, [apiData]);

	// ✅ دالة للحصول على children لخيار محدد
	const getChildrenForOption = useCallback((groupName: string, optionValue: string) => {
		if (!apiData || !apiData.options) return [];
		
		const optionGroup = apiData.options.find((o: any) => o.name === groupName);
		if (!optionGroup) return [];
		
		const optionItem = optionGroup.items?.find((item: any) => item.value === optionValue);
		if (!optionItem) return [];
		
		return optionItem.children || [];
	}, [apiData]);

	const requiredOptionGroups = useMemo(() => {
		const required: string[] = [];
		Object.keys(groupedOptions).forEach((k) => {
			const items = groupedOptions[k] || [];
			if (items.some((x: any) => Boolean(x?.is_required))) required.push(k);
		});
		return required;
	}, [groupedOptions]);

	const selectedSizeObj = useMemo(() => {
		return (apiData?.sizes || []).find((s: any) => String(s?.name).trim() === String(size).trim()) || null;
	}, [apiData, size]);

	const sizeTiers = useMemo(() => {
		const tiers = selectedSizeObj?.tiers;
		return Array.isArray(tiers) ? tiers : [];
	}, [selectedSizeObj]);

	const needSize = (apiData?.sizes?.length ?? 0) > 0;
	const needColor = (apiData?.colors?.length ?? 0) > 0;
	const needMaterial = (apiData?.materials?.length ?? 0) > 0;
	const needPrintingMethod = (apiData?.printing_methods?.length ?? 0) > 0;
	const needPrintLocation = (apiData?.print_locations?.length ?? 0) > 0;
	const needSizeTier = needSize && size !== "اختر" && sizeTiers.length > 0;

	const validateCurrentOptions = useCallback(() => {
		if (!apiData) return false;

		let isValid = true;

		if (needSize && size === "اختر") isValid = false;
		if (needSizeTier && !sizeTierId) isValid = false;

		if (needColor && color === "اختر") isValid = false;
		if (needMaterial && material === "اختر") isValid = false;

		requiredOptionGroups.forEach((g) => {
			const v = optionGroups?.[g];
			if (!v || v === "اختر") isValid = false;
			
			// ✅ التحقق من children إذا كانت مطلوبة
			const children = getChildrenForOption(g, v);
			if (children && children.length > 0) {
				const childKey = `${g}::${v}`;
				const childValue = optionChildren?.[childKey];
				if (!childValue || childValue === "اختر") {
					isValid = false;
				}
			}
		});

		if (needPrintingMethod && printingMethod === "اختر") isValid = false;
		if (needPrintLocation && (!Array.isArray(printLocations) || printLocations.length === 0)) isValid = false;

		return isValid;
	}, [
		apiData,
		needSize,
		needSizeTier,
		needColor,
		needMaterial,
		needPrintingMethod,
		needPrintLocation,
		size,
		sizeTierId,
		color,
		material,
		optionGroups,
		optionChildren,
		requiredOptionGroups,
		printingMethod,
		printLocations,
		getChildrenForOption,
	]);

	const getOptionsObj = useCallback((): SelectedOptions => {
		return {
			size,
			size_tier_id: sizeTierId,
			size_quantity: sizeTierQty,
			size_price_per_unit: sizeTierUnit,
			size_total_price: sizeTierTotal,
			color,
			material,
			optionGroups,
			optionChildren, // ✅ إضافة optionChildren
			printing_method: printingMethod,
			print_locations: printLocations,
			isValid: validateCurrentOptions(),
		};
	}, [
		size, sizeTierId, sizeTierQty, sizeTierUnit, sizeTierTotal, 
		color, material, optionGroups, optionChildren, printingMethod, 
		printLocations, validateCurrentOptions
	]);

	useImperativeHandle(ref, () => ({
		getOptions: () => getOptionsObj(),
		validate: () => validateCurrentOptions(),
	}));

	// load apiData from props (both pages)
	useEffect(() => {
		setApiError(null);
		setFormLoading(true);

		try {
			if (!productData) throw new Error("لا توجد بيانات للمنتج");
			setApiData(productData);

			// init groups - الجديد
			if (Array.isArray(productData?.options)) {
				const out: Record<string, string> = {};
				const childrenOut: Record<string, string> = {};
				productData.options.forEach((o: any) => {
					const k = String(o.name || "").trim();
					if (!k) return;
					if (!out[k]) out[k] = "اختر";
				});
				setOptionGroups(out);
				setOptionChildren(childrenOut);
			} else {
				setOptionGroups({});
				setOptionChildren({});
			}

			setPrintingMethod("اختر");
			setPrintLocations([]);
			setSizeTierId(null);
			setSizeTierQty(null);
			setSizeTierUnit(null);
			setSizeTierTotal(null);

			setDesignFile(null);
			setDesignSendMethod(null);
			setDesignUploading(false);
		} catch (err: any) {
			setApiError(err?.message || "حدث خطأ أثناء تحميل الخيارات");
			setApiData(null);
		} finally {
			setFormLoading(false);
		}
	}, [productData]);

	// push changes to parent (product page summary)
	const pushTimer = useRef<any>(null);
	useEffect(() => {
		if (!onOptionsChange) return;
		if (pushTimer.current) clearTimeout(pushTimer.current);

		pushTimer.current = setTimeout(() => {
			onOptionsChange(getOptionsObj());
		}, 80);

		return () => clearTimeout(pushTimer.current);
	}, [getOptionsObj, onOptionsChange]);

	// CART MODE: load saved options (⚠️ backend may have old selected_options; we try best)
	const loadSavedOptions = useCallback(async () => {
		if (!cartItemId) return;
		if (!apiData) return;

		try {
			const saved = await fetchCartItemOptions(cartItemId);
			if (!saved) return;

			// Prefer new backend fields if exist; else fallback to selected_options
			const sizeFrom = extractValueFromOptions(saved.selected_options, "المقاس");
			const colorFrom = extractValueFromOptions(saved.selected_options, "اللون");
			const matFrom = extractValueFromOptions(saved.selected_options, "الخامة");
			const pmFrom = extractValueFromOptions(saved.selected_options, "طريقة الطباعة");

			const qtyFrom = extractValueFromOptions(saved.selected_options, "كمية المقاس");
			const totalFrom = extractValueFromOptions(saved.selected_options, "سعر المقاس الإجمالي");
			const unitFrom = extractValueFromOptions(saved.selected_options, "سعر الوحدة");
			const locsFrom = extractValuesFromOptions(saved.selected_options, "مكان الطباعة");

			setSize(sizeFrom || saved.size || "اختر");
			setColor(colorFrom || (saved.color?.name || saved.color) || "اختر");
			setMaterial(matFrom || saved.material || "اختر");
			setPrintingMethod(pmFrom || "اختر");
			setPrintLocations(locsFrom || []);

			const q = qtyFrom ? Number(qtyFrom) : null;
			const t = totalFrom ? Number(totalFrom) : null;
			const u = unitFrom ? Number(unitFrom) : null;

			// restore tier by qty if possible
			if (q && apiData?.sizes) {
				const sz = apiData.sizes.find((s: any) => s?.name === (sizeFrom || saved.size));
				const tier = (sz?.tiers || []).find((x: any) => Number(x?.quantity) === q) || null;

				const tierUnit = num(tier?.price_per_unit) || num(u);
				const backendTotal = num(tier?.total_price);
				const computed = q && tierUnit ? q * tierUnit : 0;

				setSizeTierId(tier?.id ?? null);
				setSizeTierQty(tier?.quantity ?? q ?? null);
				setSizeTierUnit(tierUnit || null);
				setSizeTierTotal(backendTotal > 0 ? backendTotal : t && t > 0 ? t : computed > 0 ? computed : null);
			}

			// restore option groups AND children
			const out: Record<string, string> = {};
			const childrenOut: Record<string, string> = {};
			
			// تهيئة جميع الـ groups بـ "اختر"
			Object.keys(groupedOptions).forEach((g) => (out[g] = "اختر"));

			if (Array.isArray(saved.selected_options)) {
				// فحص العلاقة بين الـ parent و children في الـ API data
				const parentChildMap = new Map(); // لتخزين العلاقات بين parent و children
				
				apiData.options?.forEach((optionGroup: any) => {
					optionGroup.items?.forEach((item: any) => {
						if (item.children && item.children.length > 0) {
							parentChildMap.set(`${optionGroup.name}::${item.value}`, item.children);
						}
					});
				});

				// حل أبسط للبيانات النموذجية:
				saved.selected_options.forEach((opt: any) => {
					const name = String(opt.option_name || "").trim();
					const value = String(opt.option_value || "").trim();
					if (!name || !value) return;

					// تخطي الحقول النظامية
					if (["المقاس", "اللون", "الخامة", "طريقة الطباعة", "مكان الطباعة", "كمية المقاس", "سعر المقاس الإجمالي", "سعر الوحدة"].includes(name)) return;

					// تحقق إذا كان الاسم موجودًا في الـ groups
					if (Object.prototype.hasOwnProperty.call(out, name)) {
						out[name] = value;
						
						// إذا كان للخيار المختار children، نبحث عن child له
						const group = apiData.options?.find((o: any) => o.name === name);
						if (group) {
							const item = group.items?.find((i: any) => i.value === value);
							if (item?.children && item.children.length > 0) {
								// نبحث في saved options عن child ينتمي لهذا parent
								saved.selected_options.forEach((childOpt: any) => {
									const childName = String(childOpt.option_name || "").trim();
									const childValue = String(childOpt.option_value || "").trim();
									
									// تحقق إذا كان child ينتمي لهذا parent
									// يمكننا التحقق بناءً على البنية الهرمية
									if (childName && childValue && childName !== name) {
										// تحقق إذا كانت القيمة مطابقة لأحد children
										const isChild = item.children.some((child: any) => 
											child.value === childValue || child.name === childName
										);
										
										if (isChild) {
											const childKey = `${name}::${value}`;
											childrenOut[childKey] = childValue;
										}
									}
								});
							}
						}
					} else {
						// قد يكون child option
						// نبحث في جميع groups للعثور على parent مناسب
						apiData.options?.forEach((group: any) => {
							group.items?.forEach((item: any) => {
								if (item.children && item.children.length > 0) {
									const isChild = item.children.some((child: any) => 
										child.value === value || child.name === name
									);
									
									if (isChild) {
										// نضبط الـ parent أولاً
										if (!out[group.name] || out[group.name] === "اختر") {
											out[group.name] = item.value;
										}
										const childKey = `${group.name}::${item.value}`;
										childrenOut[childKey] = value;
									}
								}
							});
						});
					}
				});
			}

			setOptionGroups(out);
			setOptionChildren(childrenOut);
			setShowSaveButton(false);
		} catch {
			// ignore
		}
	}, [cartItemId, apiData, fetchCartItemOptions, groupedOptions]);

	useEffect(() => {
		if (!cartItemId || !apiData) return;
		loadSavedOptions();
	}, [cartItemId, apiData, loadSavedOptions]);

	const markDirty = () => {
		if (!cartItemId) return; // only show save UI in cart mode
		setShowSaveButton(true);
		setSavedSuccessfully(false);
	};

	const handleSizeChange = (value: string) => {
		setSize(value);
		setSizeTierId(null);
		setSizeTierQty(null);
		setSizeTierUnit(null);
		setSizeTierTotal(null);
		markDirty();
	};

	// compute total if backend total missing
	const handleTierChange = (tierIdStr: string) => {
		const tierId = Number(tierIdStr);
		const tier = sizeTiers.find((t: any) => Number(t?.id) === tierId) || null;

		const qty = tier ? Number(tier.quantity) : null;
		const unit = tier ? num(tier.price_per_unit) : null;
		const backendTotal = tier ? num(tier.total_price) : 0;

		const computedTotal = qty && unit ? qty * unit : 0;
		const finalTotal = backendTotal > 0 ? backendTotal : computedTotal > 0 ? computedTotal : null;

		setSizeTierId(tier ? Number(tier.id) : null);
		setSizeTierQty(qty);
		setSizeTierUnit(unit);
		setSizeTierTotal(finalTotal);

		markDirty();
	};

	const saveAllOptions = async () => {
		if (!cartItemId || !apiData) return;

		const opts = getOptionsObj();

		// ✅ NEW RULES payload
		const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
		const idsPayload = buildIdsPayload(apiData, opts);

		const qty = Math.max(1, Number(opts?.size_quantity || 1));

		const payload: any = {
			...idsPayload,
			selected_options,
			quantity: needSizeTier ? qty : undefined,
		};

		try {
			setSaving(true);
			const success = await updateCartItem(cartItemId, payload);
			if (success) {
				setSavedSuccessfully(true);
				setShowSaveButton(false);
				setTimeout(() => setSavedSuccessfully(false), 2500);
				toast.success("تم حفظ التغييرات ✅");
			}
		} finally {
			setSaving(false);
		}
	};

	const resetAllOptions = () => {
		setSize("اختر");
		setColor("اختر");
		setMaterial("اختر");

		const resetGroups: Record<string, string> = {};
		Object.keys(groupedOptions).forEach((g) => (resetGroups[g] = "اختر"));
		setOptionGroups(resetGroups);
		setOptionChildren({});

		setPrintingMethod("اختر");
		setPrintLocations([]);

		setSizeTierId(null);
		setSizeTierQty(null);
		setSizeTierUnit(null);
		setSizeTierTotal(null);

		setDesignFile(null);
		setDesignSendMethod(null);
		setDesignUploading(false);

		markDirty();
	};

	// ✅ دالة لمعالجة تغيير الخيار الرئيسي
	const handleOptionGroupChange = (groupName: string, value: string) => {
		setOptionGroups((prev) => ({ ...prev, [groupName]: value }));
		
		// ✅ مسح children القديم لهذا الخيار
		const oldChildKey = `${groupName}::${optionGroups[groupName]}`;
		if (optionChildren[oldChildKey]) {
			setOptionChildren((prev) => {
				const newChildren = { ...prev };
				delete newChildren[oldChildKey];
				return newChildren;
			});
		}
		
		// ✅ إذا كان الخيار الجديد يحتوي على children، نضيف خانة اختيار لهم
		const newChildren = getChildrenForOption(groupName, value);
		if (newChildren && newChildren.length > 0) {
			const newChildKey = `${groupName}::${value}`;
			setOptionChildren((prev) => ({ ...prev, [newChildKey]: "اختر" }));
		}

		markDirty();

		// if design service changed -> reset method/file
		if (String(groupName).trim() === "خدمة تصميم" || String(groupName).trim() === "خدمة التصميم") {
			setDesignSendMethod(null);
			setDesignFile(null);
		}
	};

	// ✅ دالة لمعالجة تغيير child
	const handleChildChange = (parentKey: string, value: string) => {
		setOptionChildren((prev) => ({ ...prev, [parentKey]: value }));
		markDirty();
	};

	// design service (show only if "خدمة تصميم" === "لدى تصميم")
	const designServiceValue = String(optionGroups?.["خدمة تصميم"] ?? optionGroups?.["خدمة التصميم"] ?? "اختر").trim();
	const showDesignBoxes = ["رفع تصميم خاص", "رفع تصميمي الخاص", "لدي تصميم يحتاج تعديل"].includes(designServiceValue);

	const whatsappFromSocial = getSocialValue(socialMedia, "whatsapp");
	const emailFromSocial = getSocialValue(socialMedia, "email");

	const waText = encodeURIComponent(`مرحباً، لدي تصميم للمنتج رقم ${productId}${cartItemId ? ` - عنصر سلة: ${cartItemId}` : ""}`);

	const whatsappHref = useMemo(() => {
		if (!whatsappFromSocial) return null;

		if (/^https?:\/\//i.test(whatsappFromSocial)) {
			if (/wa\.me\//i.test(whatsappFromSocial) && !/text=/i.test(whatsappFromSocial)) {
				const join = whatsappFromSocial.includes("?") ? "&" : "?";
				return `${whatsappFromSocial}${join}text=${waText}`;
			}
			return whatsappFromSocial;
		}

		const phone = whatsappFromSocial.replace(/[^\d]/g, "");
		if (!phone) return null;
		return `https://wa.me/${phone}?text=${waText}`;
	}, [whatsappFromSocial, waText]);

	const emailHref = useMemo(() => {
		if (!emailFromSocial) return null;
		return `mailto:${emailFromSocial}?subject=${encodeURIComponent("ملف تصميم")}&body=${encodeURIComponent(
			`لدي تصميم للمنتج رقم ${productId}${cartItemId ? ` - عنصر سلة: ${cartItemId}` : ""}`
		)}`;
	}, [emailFromSocial, productId, cartItemId]);


	const uploadDesignFileCart = async () => {
		if (!API_URL) return toast.error("API غير متوفر");
		if (!token) return toast.error("يجب تسجيل الدخول أولاً");
		if (!cartItemId) return toast.error("لا يمكن رفع الملف بدون cart_item_id");
		if (!designFile) return toast.error("اختر ملف التصميم أولاً");

		try {
			setDesignUploading(true);

			const fd = new FormData();
			fd.append("img", designFile);
			fd.append("cart_item_id", String(cartItemId));

			const res = await fetch(`${API_URL}/upload-image`, {
				method: "POST",
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				body: fd,
			});

			const json = await res.json().catch(() => null);
			if (!res.ok || (json && json.status === false)) throw new Error(json?.message || "فشل رفع الملف");

			toast.success("تم رفع الملف وربطه بعنصر السلة ✅");
		} catch (e: any) {
			toast.error(e?.message || "حدث خطأ أثناء رفع الملف");
		} finally {
			setDesignUploading(false);
		}
	};

	if (formLoading) return <StickerFormSkeleton />;
	if (apiError || !apiData) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
				<p className="text-slate-700 font-extrabold">{apiError || "لا توجد بيانات للمنتج"}</p>
			</div>
		);
	}

	return (
		<motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="pt-4 mt-4">
			{/* CART MODE ONLY: Save bar */}
			{cartItemId && showSaveButton && (
				<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-2xl">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Warning className="text-yellow-600 text-sm" />
							<p className="text-sm text-yellow-800 font-bold">لديك تغييرات غير محفوظة</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outlined"
								size="small"
								onClick={resetAllOptions}
								startIcon={<Refresh />}
								sx={{ borderRadius: "14px", borderColor: "#e2e8f0", color: "#0f172a", fontWeight: 900 }}
							>
								إعادة تعيين
							</Button>

							<Button
								variant="contained"
								size="small"
								onClick={saveAllOptions}
								disabled={saving}
								startIcon={saving ? <CircularProgress size={16} /> : <Save />}
								sx={{ borderRadius: "14px", backgroundColor: "#f59e0b", fontWeight: 900 }}
							>
								{saving ? "جاري الحفظ..." : "حفظ"}
							</Button>
						</div>
					</div>
				</motion.div>
			)}

			{cartItemId && savedSuccessfully && (
				<motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
					<Alert severity="success" className="rounded-2xl" icon={<CheckCircle />}>
						تم حفظ التغييرات بنجاح
					</Alert>
				</motion.div>
			)}

			<div className="space-y-4">
				{needSize && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needSize && size === "اختر"}>
							<InputLabel>المقاس</InputLabel>
							<Select value={size} onChange={(e) => handleSizeChange(e.target.value as string)} label="المقاس" className="bg-white">
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.sizes.map((s: any) => (
									<MenuItem key={s.id} value={s.name}>
										{s.name}
									</MenuItem>
								))}
							</Select>
							{showValidation && needSize && size === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار المقاس</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needSizeTier && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needSizeTier && !sizeTierId}>
							<InputLabel>الكمية</InputLabel>
							<Select
								value={sizeTierId ? String(sizeTierId) : "اختر"}
								onChange={(e) => handleTierChange(e.target.value as string)}
								label="الكمية"
								className="bg-white"
							>
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>

								{sizeTiers.map((t: any) => {
									const qty = num(t.quantity);
									const unit = num(t.price_per_unit);
									const backendTotal = num(t.total_price);
									const computed = qty > 0 && unit > 0 ? qty * unit : 0;
									const showTotal = backendTotal > 0 ? backendTotal : computed;

									return (
										<MenuItem key={t.id} value={String(t.id)}>
											<div className="flex items-center justify-between gap-3 w-full">
												<span>{qty} قطعة</span>
												<span className="text-xs font-black text-slate-700">{Number(showTotal).toFixed(2)} ر.س</span>
											</div>
										</MenuItem>
									);
								})}
							</Select>

							{showValidation && needSizeTier && !sizeTierId && <FormHelperText className="text-red-500 text-xs">يجب اختيار كمية المقاس</FormHelperText>}

							{!!sizeTierId && (
								<FormHelperText className="text-slate-600 text-xs">
									سعر الوحدة: {num(sizeTierUnit).toFixed(2)} — الإجمالي: {num(sizeTierTotal).toFixed(2)}
								</FormHelperText>
							)}
						</FormControl>
					</Box>
				)}

				{needColor && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needColor && color === "اختر"}>
							<InputLabel>اللون</InputLabel>
							<Select
								value={color}
								onChange={(e) => {
									setColor(e.target.value as string);
									markDirty();
								}}
								label="اللون"
								className="bg-white"
							>
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.colors.map((c: any) => (
									<MenuItem key={c.id} value={c.name}>
										<div className="flex items-center gap-2">
											{c.hex_code && <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c.hex_code }} />}
											<span>{c.name}</span>
										</div>
									</MenuItem>
								))}
							</Select>
							{showValidation && needColor && color === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار اللون</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needMaterial && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needMaterial && material === "اختر"}>
							<InputLabel>الخامة</InputLabel>
							<Select
								value={material}
								onChange={(e) => {
									setMaterial(e.target.value as string);
									markDirty();
								}}
								label="الخامة"
								className="bg-white"
							>
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.materials.map((m: any) => (
									<MenuItem key={m.id} value={m.name}>
										<div className="flex items-center justify-between gap-2 w-full">
											<span>{m.name}</span>
											{Number(m.additional_price || 0) > 0 ? (
												<span className="text-xs font-black text-amber-700">+ {m.additional_price}</span>
											) : (
												<span className="text-xs font-black text-slate-500">0</span>
											)}
										</div>
									</MenuItem>
								))}
							</Select>
							{showValidation && needMaterial && material === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار الخامة</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{/* option groups - مع دعم الـ children */}
				{Object.keys(groupedOptions).map((groupName) => {
					const items = groupedOptions[groupName] || [];
					const required = items.some((x: any) => Boolean(x?.is_required));
					const currentValue = optionGroups?.[groupName] || "اختر";
					const fieldError = showValidation && required && currentValue === "اختر";

					// ✅ الحصول على children للخيار المحدد
					const children = getChildrenForOption(groupName, currentValue);
					const childKey = `${groupName}::${currentValue}`;
					const childValue = optionChildren?.[childKey] || "اختر";
					const childFieldError = showValidation && children.length > 0 && childValue === "اختر";

					return (
						<Box key={groupName}>
							<FormControl fullWidth size="small" required={required} error={fieldError}>
								<InputLabel>{groupName}</InputLabel>
								<Select
									value={currentValue}
									onChange={(e) => {
										handleOptionGroupChange(groupName, e.target.value as string);
									}}
									label={groupName}
									className="bg-white"
								>
									<MenuItem value="اختر" disabled>
										<em className="text-gray-600">اختر</em>
									</MenuItem>

									{items.map((o: any) => (
										<MenuItem key={o.id} value={o.value}>
											<div className="flex items-center justify-between gap-3 w-full">
												<span>{o.value}</span>
												{Number(o.base_price || 0) > 0 ? (
													<span className="text-xs font-black text-amber-700">+ {o.base_price.toFixed(2)}</span>
												) : (
													<span className="text-xs font-black text-slate-500"></span>
												)}
											</div>
										</MenuItem>
									))}
								</Select>

								{fieldError && <FormHelperText className="text-red-500 text-xs">يجب اختيار {groupName}</FormHelperText>}
							</FormControl>

							{/* ✅ عرض children إذا كان للخيار المحدد children */}
							{children && children.length > 0 && currentValue !== "اختر" && (
								<div className="mt-3">
									<FormControl fullWidth size="small" required error={childFieldError}>
										<InputLabel>{children[0]?.name || "تفاصيل إضافية"}</InputLabel>
										<Select
											value={childValue}
											onChange={(e) => handleChildChange(childKey, e.target.value as string)}
											label={children[0]?.name || "تفاصيل إضافية"}
											className="bg-white"
										>
											<MenuItem value="اختر" disabled>
												<em className="text-gray-600">اختر</em>
											</MenuItem>

											{children.map((child: any) => (
												<MenuItem key={child.id} value={child.value}>
													<div className="flex items-center justify-between gap-3 w-full">
														<span>{child.value}</span>
														{Number(child.base_price || 0) > 0 ? (
															<span className="text-xs font-black text-amber-700">+ {child.base_price.toFixed(2)}</span>
														) : (
															<span className="text-xs font-black text-slate-500"></span>
														)}
													</div>
												</MenuItem>
											))}
										</Select>

										{childFieldError && (
											<FormHelperText className="text-red-500 text-xs">
												يجب اختيار {children[0]?.name || "التفاصيل الإضافية"}
											</FormHelperText>
										)}
									</FormControl>
								</div>
							)}

							{/* Design boxes: show only when social values exist */}
							{(String(groupName).trim() === "خدمة تصميم" || String(groupName).trim() === "خدمة التصميم") &&
								showDesignBoxes &&
								(whatsappHref || emailHref || cartItemId) && (
									<div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<p className="text-sm font-extrabold text-slate-800">أرسل ملف التصميم عبر:</p>

										<div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
											{whatsappHref && (
												<a
													href={whatsappHref}
													target="_blank"
													rel="noreferrer"
													onClick={() => setDesignSendMethod("whatsapp")}
													className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
												>
													<p className="font-black text-slate-900">WhatsApp</p>
													<p className="text-xs text-slate-500 font-bold mt-1">فتح واتساب وإرسال الملف</p>
												</a>
											)}

											{emailHref && (
												<a
													href={emailHref}
													onClick={() => setDesignSendMethod("email")}
													className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
												>
													<p className="font-black text-slate-900">Email</p>
													<p className="text-xs text-slate-500 font-bold mt-1">{emailFromSocial}</p>
												</a>
											)}

											<button
												type="button"
												onClick={() => setDesignSendMethod("upload")}
												className={[
													"rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition text-right",
													designSendMethod === "upload" ? "ring-2 ring-amber-300" : "",
												].join(" ")}
											>
												<p className="font-black text-slate-900">رفع الملف</p>
												<p className="text-xs text-slate-500 font-bold mt-1">رفع مباشر عبر الموقع</p>
											</button>
										</div>

										{designSendMethod === "upload" && (
											<div className="mt-4">
												<Divider className="!my-3" />
												<div className="flex flex-col gap-3">
													{/* Upload Card */}
													<div className="relative">
														<label
															className={[
																"flex flex-col items-center justify-center gap-2",
																"w-full rounded-2xl border-2 border-dashed",
																"px-6 py-7 text-center cursor-pointer transition",
																designFile
																	? "border-emerald-400 bg-emerald-50"
																	: "border-slate-300 hover:border-amber-400 hover:bg-amber-50",
															].join(" ")}
														>
															<input
																type="file"
																accept="image/*,.pdf,.ai,.psd,.eps,.svg"
																className="hidden"
																onChange={(e) => {
																	const f = e.target.files?.[0] ?? null;
																	setDesignFile(f);
																	onDesignFileChange?.(f); // ✅ مهم
																}}

															/>

															{/* Icon */}
															<div
																className={[
																	"w-12 h-12 rounded-full flex items-center justify-center text-xl",
																	designFile ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800",
																].join(" ")}
															>
																📎
															</div>

															{!designFile ? (
																<>
																	<p className="text-sm font-black text-slate-800">اسحب الملف هنا أو اضغط للاختيار</p>
																	<p className="text-xs font-bold text-slate-500">PNG, JPG, PDF, AI, PSD, SVG</p>
																</>
															) : (
																<>
																	<p className="text-sm font-black text-emerald-800">تم اختيار الملف ✅</p>
																	<p className="text-xs font-extrabold text-slate-700">
																		{designFile.name}
																		<span className="text-slate-500 font-bold">
																			{" "}
																			— {(designFile.size / 1024 / 1024).toFixed(2)} MB
																		</span>
																	</p>
																</>
															)}
														</label>

														{/* Remove */}
														{designFile && !designUploading && (
															<button
																type="button"
																onClick={() => {
																	setDesignFile(null);
																	onDesignFileChange?.(null); // ✅
																}}

																className="absolute top-3 right-3 text-xs font-black text-rose-700 hover:underline"
															>
																إزالة
															</button>
														)}
													</div>
												</div>

											</div>
										)}
									</div>
								)}
						</Box>
					);
				})}

				{needPrintingMethod && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && printingMethod === "اختر"}>
							<InputLabel>طريقة الطباعة</InputLabel>
							<Select
								value={printingMethod}
								onChange={(e) => {
									setPrintingMethod(e.target.value as string);
									markDirty();
								}}
								label="طريقة الطباعة"
								className="bg-white"
							>
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.printing_methods.map((p: any) => (
									<MenuItem key={p.id} value={p.name}>
										<div className="flex items-center justify-between gap-3 w-full">
											<span>{p.name}</span>
											<span className="text-xs font-black text-amber-700">{p.base_price}</span>
										</div>
									</MenuItem>
								))}
							</Select>

							{showValidation && printingMethod === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار طريقة الطباعة</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needPrintLocation && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && (!Array.isArray(printLocations) || printLocations.length === 0)}>
							<InputLabel>مكان الطباعة</InputLabel>
							<Select
								multiple
								value={printLocations}
								onChange={(e) => {
									setPrintLocations(e.target.value as string[]);
									markDirty();
								}}
								label="مكان الطباعة"
								className="bg-white"
								renderValue={(selected) => (Array.isArray(selected) ? selected.join("، ") : "")}
							>
								{apiData.print_locations.map((p: any) => {
									const checked = printLocations.includes(p.name);
									return (
										<MenuItem key={p.id} value={p.name}>
											<Checkbox checked={checked} />
											<ListItemText
												primary={
													<div className="flex items-center justify-between gap-3 w-full">
														<span>{p.name}</span>
														<span className="text-xs font-black text-slate-500">{p.type}</span>
													</div>
												}
											/>
										</MenuItem>
									);
								})}
							</Select>

							{showValidation && (!Array.isArray(printLocations) || printLocations.length === 0) && (
								<FormHelperText className="text-red-500 text-xs">يجب اختيار مكان الطباعة</FormHelperText>
							)}
						</FormControl>
					</Box>
				)}
			</div>

			{apiData?.options_note && (
				<div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
					<div className="flex items-start gap-2">
						<Info className="text-blue-500 text-sm mt-0.5" />
						<p className="text-sm text-blue-700 font-semibold">{apiData.options_note}</p>
					</div>
				</div>
			)}
		</motion.div>
	);
});

/* ------------------------------------------
 * ProductPageClient (default export)
 * ------------------------------------------ */

export default function ProductPageClient() {
	const { id } = useParams();
	const productId = id as string;

	const { authToken: token, user, userId } = useAuth() as any;
	const currentUserId: number | null = typeof userId === "number" ? userId : user?.id ?? null;

	const { addToCart } = useCart();
	const { homeData } = useAppContext();

	const stickerFormRef = useRef<StickerFormHandle | null>(null);

	const [product, setProduct] = useState<any>(null);
	const [apiData, setApiData] = useState<any>(null);

	const [loading, setLoading] = useState(true);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const [isFavorite, setIsFavorite] = useState(false);
	const [activeTab, setActiveTab] = useState<TabKey>("options");

	const [showValidation, setShowValidation] = useState(false);

	// ✅ RULE (3): i have design upload AFTER add-to-cart using /upload-image + cart_item_id
	const [designMode, setDesignMode] = useState<"have_design" | "need_design" | "none">("none");
	const [designFile, setDesignFile] = useState<File | null>(null);
	const [uploadingDesign, setUploadingDesign] = useState(false);

	const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
		size: "اختر",
		size_tier_id: null,
		size_quantity: null,
		size_price_per_unit: null,
		size_total_price: null,

		color: "اختر",
		material: "اختر",
		optionGroups: {},
		optionChildren: {}, // ✅ إضافة optionChildren
		printing_method: "اختر",
		print_locations: [],
		isValid: false,
	});

	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	// Reviews state
	const [reviewsLoading, setReviewsLoading] = useState(false);
	const [reviewsError, setReviewsError] = useState<string | null>(null);
	const [reviewsData, setReviewsData] = useState<any>(null);

	const [reviewsPage, setReviewsPage] = useState(1);
	const [reviewsRatingFilter, setReviewsRatingFilter] = useState<number | "">("");
	const [reviewsSortBy, setReviewsSortBy] = useState<"rating" | "created_at">("created_at");
	const [reviewsSortDir, setReviewsSortDir] = useState<"asc" | "desc">("desc");
	const [stickerDesignFile, setStickerDesignFile] = useState<File | null>(null);

	const [myRating, setMyRating] = useState<number>(5);
	const [myComment, setMyComment] = useState<string>("");

	// ✅ NEW: debug mode
	const [showDebug, setShowDebug] = useState(false);

	// fetch product
	useEffect(() => {
		let mounted = true;

		async function fetchProduct() {
			if (!productId || !API_URL) return;

			setLoading(true);
			setErrorMsg(null);

			try {
				const res = await fetch(`${API_URL}/products/${productId}`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
					cache: "no-store",
				});

				if (!res.ok) throw new Error("not_found");

				const json = await res.json();
				const prod = json?.data ?? null;

				if (!mounted) return;

				setProduct(prod);
				setApiData(json?.data);

				// seed reviews from product details
				if (Array.isArray(prod?.reviews)) {
					setReviewsData({
						reviews: prod.reviews,
						stats: {
							average_rating: num(prod?.average_rating),
							total_reviews: num(prod?.total_reviews ?? prod?.reviews?.length),
							rating_distribution: {},
						},
						pagination: {
							total: num(prod?.total_reviews ?? prod?.reviews?.length),
							per_page: prod.reviews.length || 10,
							current_page: 1,
							last_page: 1,
						},
						user_review: null,
					});
					setReviewsLoading(false);
					setReviewsError(null);
				}

				const saved = JSON.parse(localStorage.getItem("favorites") || "[]") as number[];
				setIsFavorite(!!prod && saved.includes(prod.id));
			} catch (e: any) {
				if (!mounted) return;
				setErrorMsg(e?.message === "not_found" ? "المنتج غير موجود" : "حدث خطأ أثناء تحميل المنتج");
			} finally {
				if (mounted) setLoading(false);
			}
		}

		fetchProduct();
		return () => {
			mounted = false;
		};
	}, [productId, token, API_URL]);

	const hasSeededDefaultRef = useRef(false);

	useEffect(() => {
		if (Array.isArray(product?.reviews) && product.reviews.length > 0) {
			hasSeededDefaultRef.current = true;
		}
	}, [product?.id]);

	// fetch reviews ONLY when needed
	const fetchReviews = useCallback(async () => {
		if (!API_URL || !productId) return;

		const isDefaultQuery =
			reviewsPage === 1 && reviewsRatingFilter === "" && reviewsSortBy === "created_at" && reviewsSortDir === "desc";

		if (isDefaultQuery && hasSeededDefaultRef.current) return;

		setReviewsLoading(true);
		setReviewsError(null);

		try {
			const params = new URLSearchParams();
			params.set("sort_by", reviewsSortBy);
			params.set("sort_direction", reviewsSortDir);
			params.set("page", String(reviewsPage));
			if (reviewsRatingFilter !== "") params.set("rating", String(reviewsRatingFilter));

			const res = await fetch(`${API_URL}/reviews/product/${productId}?${params.toString()}`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				cache: "no-store",
			});

			const json = await res.json();
			if (!res.ok || !json.status) throw new Error(json.message || "فشل تحميل التقييمات");

			setReviewsData(json.data);
			hasSeededDefaultRef.current = false;
		} catch (e: any) {
			setReviewsError(e?.message || "حدث خطأ أثناء تحميل التقييمات");
		} finally {
			setReviewsLoading(false);
		}
	}, [API_URL, productId, token, reviewsPage, reviewsRatingFilter, reviewsSortBy, reviewsSortDir]);

	useEffect(() => {
		if (activeTab !== "reviews") return;
		fetchReviews();
	}, [activeTab, fetchReviews]);

	const hasOptions = useMemo(() => {
		if (!apiData) return false;

		const hasSizes = Array.isArray(apiData?.sizes) && apiData.sizes.length > 0;
		const hasColors = Array.isArray(apiData?.colors) && apiData.colors.length > 0;
		const hasMaterials = Array.isArray(apiData?.materials) && apiData.materials.length > 0;

		const hasExtraOptions = Array.isArray(apiData?.options) && apiData.options.length > 0;
		const hasPrinting = Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0;

		return hasSizes || hasColors || hasMaterials || hasExtraOptions || hasPrinting || Array.isArray(apiData?.print_locations);
	}, [apiData]);

	useEffect(() => {
		if (!loading) {
			if (activeTab === "options" && !hasOptions) setActiveTab("reviews");
		}
	}, [loading, hasOptions, activeTab]);

	const warrantyText = useMemo(() => {
		const w = apiData?.warranty;
		if (!w) return null;

		const months = w?.months;
		if (typeof months === "number" && months > 0) return `${months} أشهر ضمان`;

		const raw = String(w?.display_text || "").trim();
		if (!raw) return null;
		if (/^أشهر\s+ضمان$/.test(raw) || raw === "أشهر ضمان") return null;

		return raw;
	}, [apiData]);

	const validateOptions = useCallback(
		(options: SelectedOptions, data: any) => {
			if (!data) return { isValid: false, missingOptions: [] as string[] };

			let isValid = true;
			const missingOptions: string[] = [];

			if (data.sizes?.length > 0 && (!options.size || options.size === "اختر")) {
				isValid = false;
				missingOptions.push("المقاس");
			}

			const selectedSizeObj = (data?.sizes || []).find((s: any) => s?.name === options.size);
			const hasTiers = Array.isArray(selectedSizeObj?.tiers) && selectedSizeObj.tiers.length > 0;
			if (data.sizes?.length > 0 && hasTiers && !options.size_tier_id) {
				isValid = false;
				missingOptions.push("كمية المقاس");
			}

			if (data.colors?.length > 0 && (!options.color || options.color === "اختر")) {
				isValid = false;
				missingOptions.push("اللون");
			}

			if (data.materials?.length > 0 && (!options.material || options.material === "اختر")) {
				isValid = false;
				missingOptions.push("الخامة");
			}

			if (Array.isArray(data?.options) && data.options.length > 0) {
				data.options.forEach((o: any) => {
					const groupName = String(o.name || "").trim();
					const items = o.items || [];
					const isRequired = items.some((x: any) => Boolean(x?.is_required));
					if (!isRequired) return;

					const v = options.optionGroups?.[groupName];
					if (!v || v === "اختر") {
						isValid = false;
						missingOptions.push(groupName);
					}

					// ✅ التحقق من children إذا كانت مطلوبة
					if (v && v !== "اختر") {
						const item = items.find((i: any) => i.value === v);
						if (item?.children && item.children.length > 0) {
							const childKey = `${groupName}::${v}`;
							const childValue = options.optionChildren?.[childKey];
							if (!childValue || childValue === "اختر") {
								isValid = false;
								missingOptions.push(`${groupName} - تفاصيل`);
							}
						}
					}
				});
			}

			if (Array.isArray(data?.printing_methods) && data.printing_methods.length > 0) {
				if (!options.printing_method || options.printing_method === "اختر") {
					isValid = false;
					missingOptions.push("طريقة الطباعة");
				}
			}

			if (Array.isArray(data?.print_locations) && data.print_locations.length > 0) {
				if (!Array.isArray(options.print_locations) || options.print_locations.length === 0) {
					isValid = false;
					missingOptions.push("مكان الطباعة");
				}
			}

			// design file validation (حسب اختيارك)
			if (designMode === "have_design" && !designFile) {
				isValid = false;
				missingOptions.push("ملف التصميم");
			}

			return { isValid, missingOptions };
		},
		[designMode, designFile]
	);

	const getSelectedOptions = async () => {
		if (stickerFormRef.current?.getOptions) {
			const opts = await stickerFormRef.current.getOptions();
			setSelectedOptions(opts);
			return opts;
		}
		return selectedOptions;
	};

	// base price from tier total
	const basePrice = useMemo(() => {
		const total = computeSizeBaseTotal(selectedOptions);
		return total > 0 ? total : 0;
	}, [selectedOptions]);

	// ✅ extras based on optionGroups + optionChildren only (design one-time is handled)
	const extrasTotal = useMemo(() => {
		if (!apiData) return 0;
		const selected = buildSelectedOptionsWithPrice(apiData, selectedOptions);
		return selected.reduce((sum, o) => sum + num(o.additional_price), 0);
	}, [apiData, selectedOptions]);

	const displayTotal = useMemo(() => {
		const total = basePrice + extrasTotal;
		return total > 0 ? total : 0;
	}, [basePrice, extrasTotal]);
 
	// في ProductPageClient، ابحثي عن دالة handleAddToCart
// واستبدليها بهذا الكود:

const handleAddToCart = async () => {
  setShowValidation(true);

  const opts = await getSelectedOptions();
  const validation = validateOptions(opts, apiData);

  if (!validation.isValid && hasOptions) {
    toast.error(`يرجى اختيار: ${validation.missingOptions.join("، ")}`);
    return;
  }

  if (!token) return toast.error("يجب تسجيل الدخول أولاً");
  if (!API_URL) return toast.error("API غير متوفر");

  const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
  const idsPayload = buildIdsPayload(apiData, opts);

  const qty = Math.max(1, Number(opts?.size_quantity || 1));

  const cartData = {
    product_id: product.id,
    quantity: qty,
    ...idsPayload,
    selected_options,
    design_service_id: null,
    is_sample: false,
    note: "",
    // ✅ الأهم: إضافة image_design هنا إذا كان موجوداً
    image_design: designFile || stickerDesignFile ? "pending" : null,
  };

  try {
    const res: any = await addToCart(product.id, cartData);

    const cartItemId =
      Number(res?.data?.cart_item_id) ||
      Number(res?.data?.id) ||
      Number(res?.cart_item_id) ||
      Number(res?.id) ||
      null;

    // ✅ رفع الصورة إذا كانت موجودة
    const fileToUpload = designFile || stickerDesignFile;

    if (fileToUpload && cartItemId) {
      setUploadingDesign(true);
      try {
        const fd = new FormData();
        fd.append("image", fileToUpload);
        fd.append("cart_item_id", String(cartItemId));

        const res2 = await fetch(`${API_URL}/cart/upload-image`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: fd,
        });

        const json2 = await res2.json().catch(() => null);
        if (!res2.ok || (json2 && json2.status === false)) {
          throw new Error(json2?.message || "فشل رفع ملف التصميم");
        }

        toast.success("تم رفع ملف التصميم وربطه بالمنتج ✅");
        
        // ✅ تخزين الصورة مؤقتاً في localStorage للمعاينة
        const reader = new FileReader();
        reader.onload = (e) => {
          localStorage.setItem(`design_temp_${cartItemId}`, e.target?.result as string);
        };
        reader.readAsDataURL(fileToUpload);
        
      } catch (e: any) {
        console.log(e);
        toast.error(e?.message || "حدث خطأ أثناء رفع ملف التصميم");
      } finally {
        setUploadingDesign(false);
      }
    }

  } catch {
    toast.error("حدث خطأ أثناء إضافة المنتج للسلة");
  }
};



	const toggleFavorite = async () => {
		if (!token) return toast.error("يجب تسجيل الدخول أولاً");
		if (!product) return;

		const newState = !isFavorite;
		setIsFavorite(newState);

		let saved = JSON.parse(localStorage.getItem("favorites") || "[]") as number[];
		if (newState) {
			if (!saved.includes(product.id)) saved.push(product.id);
		} else {
			saved = saved.filter((pid) => pid !== product.id);
		}
		localStorage.setItem("favorites", JSON.stringify(saved));

		try {
			const res = await fetch(`${API_URL}/favorites/toggle`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ product_id: product.id }),
			});

			const data = await res.json();
			if (!res.ok || !data.status) {
				setIsFavorite(!newState);
				toast.error(data.message || "فشل تحديث المفضلة");
			} else {
				toast.success(data.message || "تم تحديث المفضلة");
			}
		} catch {
			setIsFavorite(!newState);
			toast.error("حدث خطأ أثناء تحديث المفضلة");
		}
	};

	const categories2 = homeData?.sub_categories || [];

	const canDeleteReview = useCallback(
		(r: Review) => {
			if (reviewsData?.user_review && r.id === reviewsData.user_review.id) return true;
			if (currentUserId && r.user_id === currentUserId) return true;
			return false;
		},
		[reviewsData?.user_review, currentUserId]
	);

	const submitReview = async () => {
		if (!token) return toast.error("يجب تسجيل الدخول أولاً");
		if (!product) return;

		const comment = myComment.trim();
		if (!comment) return toast.error("اكتب تعليقك أولاً");
		if (myRating < 1 || myRating > 5) return toast.error("التقييم غير صحيح");

		try {
			const res = await fetch(`${API_URL}/reviews`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
				body: JSON.stringify({
					product_id: product.id,
					rating: myRating,
					comment,
				}),
			});

			const json = await res.json();
			if (!res.ok || !json.status) throw new Error(json.message || "فشل إرسال التقييم");

			toast.success("تم إرسال تقييمك ✅");
			setReviewsPage(1);
			await fetchReviews();
		} catch (e: any) {
			toast.error(e?.message || "حدث خطأ أثناء إرسال التقييم");
		}
	};

	const deleteReview = async (reviewId: number) => {
		if (!token) return toast.error("يجب تسجيل الدخول أولاً");

		try {
			const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});

			const json = await res.json();
			if (!res.ok || !json.status) throw new Error(json.message || "فشل حذف التقييم");

			toast.success("تم حذف التقييم");
			setReviewsPage(1);
			await fetchReviews();
		} catch (e: any) {
			toast.error(e?.message || "حدث خطأ أثناء حذف التقييم");
		}
	};

	// Render states
	if (loading) return <ProductPageSkeleton />;

	if (errorMsg || !product) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
				<div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
							<FiAlertTriangle className="text-rose-600" size={22} />
						</div>
						<div>
							<p className="font-extrabold text-slate-900">تعذر عرض المنتج</p>
							<p className="text-sm text-slate-600 mt-1">{errorMsg || "المنتج غير موجود"}</p>
						</div>
					</div>
					<button
						onClick={() => location.reload()}
						className="mt-4 w-full rounded-2xl bg-slate-900 text-white py-3 font-extrabold hover:opacity-95 transition"
					>
						إعادة المحاولة
					</button>
				</div>
			</div>
		);
	}

	const currentValidation = validateOptions(selectedOptions, apiData);
	const showMissingBadge = showValidation && hasOptions && !currentValidation.isValid;

	const anySelected =
		selectedOptions.size !== "اختر" ||
		selectedOptions.color !== "اختر" ||
		selectedOptions.material !== "اختر" ||
		selectedOptions.printing_method !== "اختر" ||
		(selectedOptions.print_locations?.length ?? 0) > 0 ||
		Object.values(selectedOptions.optionGroups || {}).some((v) => v !== "اختر") ||
		Object.values(selectedOptions.optionChildren || {}).some((v) => v !== "اختر");

	return (
		<>
			<section className="container pt-8 pb-24" dir="rtl">
				<motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-4">
					<CustomSeparator proName={product.name} />
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Left: Info */}
					<motion.div variants={fadeUp} initial="hidden" animate="show" className=" space-y-5 lg:col-span-5">
						<h1 className="text-slate-900 text-2xl md:text-3xl font-extrabold leading-snug">{product.name}</h1>

						<div className="mt-3 flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<HearComponent
									liked={isFavorite}
									onToggleLike={toggleFavorite}
									ClassName="text-slate-500"
									ClassNameP="border border-slate-200 hover:border-slate-300"
								/>
								<ShareButton />
							</div>

							<div className="flex items-center gap-2">
								<RatingStars average_ratingc={product.average_rating || 0} reviewsc={product.reviews || []} />
							</div>
						</div>

						<SectionCard title="وصف المنتج" icon={<Package className="w-5 h-5 text-slate-700" />}>
							<div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.description || "" }} />
						</SectionCard>

						{apiData?.delivery_time && (
							<SectionCard title="معلومات الشحن والضمان والعروض" icon={<Truck className="w-5 h-5 text-slate-700" />}>
								<div className="space-y-3">
									{apiData?.delivery_time?.estimated && (
										<InfoRow label="التوصيل المتوقع" value={<Pill tone="emerald">{apiData.delivery_time.estimated}</Pill>} />
									)}

									{warrantyText && (
										<InfoRow
											label="الضمان"
											value={
												<span className="inline-flex items-center gap-2">
													<ShieldCheck className="w-4 h-4 text-emerald-600" />
													<span className="font-black">{warrantyText}</span>
												</span>
											}
										/>
									)}

									{Array.isArray(apiData?.offers) && apiData.offers.length > 0 && (
										<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
											<p className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
												<Tags className="w-4 h-4" /> العروض المتاحة
											</p>
											<div className="mt-2 flex flex-wrap gap-2">
												{apiData.offers.map((o: any) => (
													<Pill key={o.id} tone="amber">
														{o.name}
													</Pill>
												))}
											</div>
										</div>
									)}
								</div>
							</SectionCard>
						)}

						{Array.isArray(apiData?.features) && apiData.features.length > 0 && (
							<SectionCard title="المواصفات" icon={<Star className="w-5 h-5 text-slate-700" />}>
								<div className="space-y-2">
									{apiData.features.map((f: any, idx: number) => (
										<InfoRow
											key={`${f?.name}-${idx}`}
											label={String(f?.name || "—")}
											value={<span className="font-black">{String(f?.value || "—")}</span>}
										/>
									))}
								</div>
							</SectionCard>
						)}

						{/* Tabs */}
						<div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
							<div className="grid grid-cols-3 border-b border-slate-200">
								<button
									disabled={!hasOptions}
									className={[
										"py-3 font-extrabold transition",
										activeTab === "options" ? "bg-[#14213d] text-white" : "bg-white text-slate-800",
										!hasOptions ? "opacity-40 cursor-not-allowed" : " ",
									].join(" ")}
									onClick={() => hasOptions && setActiveTab("options")}
								>
									خيارات المنتج
								</button>

								<button
									className={[
										"py-3 font-extrabold transition",
										activeTab === "reviews" ? "bg-[#14213d] text-white" : "bg-white text-slate-800",
										"  ",
									].join(" ")}
									onClick={() => setActiveTab("reviews")}
								>
									تقييمات المنتج
								</button>

								{/* ✅ Debug Tab */}
								<button
									className={[
										"py-3 font-extrabold transition",
										activeTab === "debug" ? "bg-purple-600 text-white" : "bg-white text-slate-800",
										"  ",
									].join(" ")}
									onClick={() => setActiveTab("debug")}
								>
									عرض البيانات
								</button>
							</div>

							<div className="m-4">
								{activeTab === "options" &&
									(hasOptions ? (
										<StickerForm
											productId={product.id}
											productData={apiData}
											ref={stickerFormRef}
											onOptionsChange={setSelectedOptions}
											showValidation={showValidation}
											onDesignFileChange={setStickerDesignFile} // ✅
										/>
									) : (
										<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600 font-bold">لا توجد خيارات لهذا المنتج.</div>
									))}

								{activeTab === "reviews" && (
									<div className="space-y-5">
										{reviewsLoading ? (
											<ReviewsSkeleton />
										) : reviewsError ? (
											<div className="rounded-2xl border border-slate-200 bg-white p-5">
												<p className="font-extrabold text-slate-900">تعذر تحميل التقييمات</p>
												<p className="text-sm text-slate-600 mt-1">{reviewsError}</p>
												<button
													onClick={fetchReviews}
													className="mt-4 rounded-xl border border-slate-200 px-4 py-2 font-extrabold hover:bg-slate-50 transition"
												>
													إعادة المحاولة
												</button>
											</div>
										) : (
											<>
												<div className="rounded-3xl border border-slate-200 bg-white p-5">
													<div className="flex items-start justify-between gap-4">
														<div>
															<p className="text-sm font-bold text-slate-500">متوسط التقييم</p>
															<div className="flex items-center gap-3 mt-1">
																<p className="text-3xl font-black text-slate-900">
																	{reviewsData?.stats?.average_rating ?? product?.average_rating ?? 0}
																</p>
																<StarsRow value={Math.round(reviewsData?.stats?.average_rating ?? product?.average_rating ?? 0)} />
															</div>
															<p className="text-sm text-slate-500 mt-1">{reviewsData?.stats?.total_reviews ?? product?.total_reviews ?? 0} تقييم</p>
														</div>
													</div>
												</div>

												<div className="rounded-3xl border border-slate-200 bg-white p-5">
													<div className="flex items-center justify-between gap-3">
														<p className="font-extrabold text-slate-900">اكتب تقييمك</p>
														{!token && (
															<span className="text-xs font-extrabold rounded-full bg-slate-50 text-slate-600 px-3 py-1 border border-slate-200">
																سجّل الدخول لإضافة تقييم
															</span>
														)}
													</div>

													<div className="mt-5 flex flex-col  gap-5">
														<div className="flex items-center gap-4 ">
															<StarRatingInput value={myRating} onChange={setMyRating} disabled={!token} />
														</div>

														<div className=" flex items-start gap-4">
															<textarea
																disabled={!token}
																value={myComment}
																onChange={(e) => setMyComment(e.target.value)}
																rows={4}
																className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
																placeholder="اكتب رأيك في المنتج بكل صراحة..."
															/>
														</div>
													</div>

													<button
														disabled={!token}
														onClick={submitReview}
														className="mt-5 w-full md:w-auto rounded-2xl bg-[#14213d] text-white px-8 py-3 font-extrabold hover:opacity-95 transition disabled:opacity-50"
													>
														إرسال التقييم
													</button>
												</div>

												<div className="rounded-3xl border border-slate-200 bg-white p-5">
													<p className="font-extrabold text-slate-900 mb-4">آراء العملاء</p>

													{reviewsData?.reviews?.length ? (
														<div className="space-y-3">
															{reviewsData.reviews.map((r: any) => (
																<div key={r.id} className="rounded-2xl border border-slate-200 p-4">
																	<div className="flex items-start justify-between gap-3">
																		<div className="flex items-center gap-3">
																			<div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
																				{r.user?.avatar ? (
																					<Image src={r.user.avatar} alt={r.user.name} fill className="object-cover" />
																				) : (
																					<div className="w-full h-full flex items-center justify-center text-slate-400 font-black">
																						{r.user?.name?.[0] ?? "U"}
																					</div>
																				)}
																			</div>
																			<div>
																				<p className="font-extrabold text-slate-900">{r.user?.name ?? "مستخدم"}</p>
																				<p className="text-xs text-slate-500 font-bold">{r.human_created_at || r.created_at}</p>
																			</div>
																		</div>

																		<div className="flex items-center gap-2">
																			<StarsRow value={r.rating} />
																			{canDeleteReview(r) && (
																				<button
																					onClick={() => deleteReview(r.id)}
																					className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 hover:bg-rose-50 transition"
																					aria-label="حذف التقييم"
																					title="حذف التقييم"
																				>
																					<Trash2 className="w-4 h-4 text-rose-600" />
																				</button>
																			)}
																		</div>
																	</div>

																	{r.comment && <p className="mt-3 text-slate-700 font-semibold leading-relaxed">{r.comment}</p>}
																</div>
															))}
														</div>
													) : (
														<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-slate-600 font-bold">
															لا توجد تقييمات حتى الآن.
														</div>
													)}

													{reviewsData?.pagination?.last_page > 1 && (
														<div className="mt-6 flex items-center justify-center">
															<div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
																<button
																	onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
																	disabled={reviewsPage === 1}
																	className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
																	aria-label="السابق"
																>
																	<ChevronRight className="w-4 h-4" />
																</button>

																<div className="h-6 w-px bg-slate-200 mx-1" />

																<div className="flex items-center gap-1">
																	{getPages(reviewsPage, reviewsData.pagination.last_page).map((p, idx) =>
																		p === "…" ? (
																			<span key={`dots-${idx}`} className="px-2 text-slate-400 font-extrabold">
																				…
																			</span>
																		) : (
																			<motion.button
																				key={p}
																				whileHover={{ scale: 1.03 }}
																				whileTap={{ scale: 0.98 }}
																				onClick={() => setReviewsPage(p)}
																				className={[
																					"min-w-[38px] h-[38px] rounded-xl px-2 text-sm font-black transition",
																					p === reviewsPage ? "bg-[#14213d] text-white shadow" : "text-slate-700 hover:bg-slate-50",
																				].join(" ")}
																				aria-current={p === reviewsPage ? "page" : undefined}
																				aria-label={`الصفحة ${p}`}
																			>
																				{p}
																			</motion.button>
																		)
																	)}
																</div>

																<div className="h-6 w-px bg-slate-200 mx-1" />

																<button
																	onClick={() => setReviewsPage((p) => Math.min(reviewsData.pagination.last_page, p + 1))}
																	disabled={reviewsPage >= reviewsData.pagination.last_page}
																	className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
																	aria-label="التالي"
																>
																	<ChevronLeft className="w-4 h-4" />
																</button>
															</div>
														</div>
													)}
												</div>
											</>
										)}
									</div>
								)}

							
							</div>
						</div>

						{/* Selected Options Summary */}
						<AnimatePresence>
							{anySelected && (
								<motion.div
									initial={{ opacity: 0, y: 14 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 14 }}
									className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
								>
									<div className="flex items-center justify-between">
										<h3 className="font-extrabold text-slate-900">الخيارات المختارة</h3>

										{showMissingBadge && (
											<span className="text-xs font-extrabold rounded-full bg-amber-50 text-amber-700 px-3 py-1 border border-amber-200">
												خيارات ناقصة
											</span>
										)}
									</div>

									<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
										{selectedOptions.size !== "اختر" && <OptChip label="المقاس" value={selectedOptions.size} />}
										{!!selectedOptions.size_quantity && <OptChip label="كمية المقاس" value={`${selectedOptions.size_quantity}`} />}
										{selectedOptions.color !== "اختر" && <OptChip label="اللون" value={selectedOptions.color} />}
										{selectedOptions.material !== "اختر" && <OptChip label="الخامة" value={selectedOptions.material} />}
										{selectedOptions.printing_method !== "اختر" && <OptChip label="طريقة الطباعة" value={selectedOptions.printing_method} />}
										{(selectedOptions.print_locations?.length ?? 0) > 0 && (
											<OptChip label="مكان الطباعة" value={selectedOptions.print_locations.join("، ")} />
										)}
										{Object.entries(selectedOptions.optionGroups || {}).map(([k, v]) => (v !== "اختر" ? <OptChip key={k} label={k} value={v} /> : null))}
										{/* ✅ عرض optionChildren المحددة */}
										{Object.entries(selectedOptions.optionChildren || {}).map(([k, v]) => {
											if (v !== "اختر") {
												const [parentGroup, parentValue] = k.split("::");
												return <OptChip key={k} label={`تفاصيل ${parentGroup}`} value={v} />;
											}
											return null;
										})}
									</div>

									{/* price breakdown */}
									<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<div className="flex items-center justify-between text-sm font-extrabold text-slate-700">
											<span>السعر الأساسي (المقاس × الكمية)</span>
											<span>{basePrice.toFixed(2)} ر.س</span>
										</div>
									
										<div className="h-px bg-slate-200 my-3" />
										<div className="flex items-center justify-between text-base font-black text-slate-900">
											<span>الإجمالي</span>
											<span>{displayTotal.toFixed(2)} ر.س</span>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>

					{/* Right: Gallery */}
					<motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-7">
						<div className="lg:sticky lg:top-[150px]">
							<ProductGallery mainImage={product.image} images={product.images} />
						</div>
					</motion.div>
				</div>

				{/* Similar products */}
				<div className="mt-10">
					{product && categories2.length > 0 && (
						<section>
							{(() => {
								const currentCategory = categories2.find((cat: any) => cat.products?.some((p: any) => p.id === product.id));
								const base = currentCategory?.products?.filter((p: any) => p.id !== product.id) || [];
								const fallback = categories2.flatMap((cat: any) => cat.products || []).filter((p: any) => p.id !== product.id).slice(0, 12);
								const list = base.length ? base : fallback;
								if (!list.length) return null;

								return (
									<div className="mb-10">
										<InStockSlider
											title="منتجات قد تعجبك"
											inStock={list}
											CardComponent={(props: any) => <ProductCard {...props} product={product} classNameHome="hidden" className2="hidden" />}
										/>
									</div>
								);
							})()}
						</section>
					)}
				</div>
			</section>

			{/* Bottom bar */}
			<div className="fixed bottom-0 start-0 end-0 z-50">
				<div className="border-t border-slate-200 bg-white/80 backdrop-blur">
					<div className="container py-3">
						<div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-3 py-3 md:px-4 md:py-4">
							<div className="flex max-md:flex-col items-center justify-between gap-3">
								{/* Left */}
								<div className="max-md:w-full flex items-center gap-3 min-w-0">
									<div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
										<Image src={product.image || "/images/not.jpg"} alt={product.name} fill className="object-cover" />
									</div>

									<div className="min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<p className="text-[12px] text-slate-500 font-extrabold">{product?.includes_tax ? "السعر شامل الضريبة" : "السعر"}</p>

											<span
												className={[
													"text-[11px] font-extrabold px-2 py-1 rounded-full border",
													product?.meta?.in_stock ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200",
												].join(" ")}
											>
												{product?.meta?.stock_status || (product?.stock ? "متوفر" : "غير متوفر")}
											</span>

											<span className="text-[11px] font-extrabold px-2 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
												{product?.includes_shipping ? "شامل الشحن" : "بدون شحن"}
											</span>
										</div>

										<p className="text-sm md:text-base font-black text-slate-900 line-clamp-2">{product.name}</p>

										<p className="text-[12px] text-slate-500 font-bold mt-0.5 line-clamp-1">
											{product?.delivery_time?.estimated ? `التوصيل المتوقع: ${product.delivery_time.estimated}` : ""}
										</p>
									</div>
								</div>

								{/* Right */}
								<div className="flex max-md:w-full max-md:justify-between items-center gap-3">
									<div className="hidden sm:flex flex-col items-end">
										<div className="flex items-center gap-2 justify-end">
											<p className="text-[12px] text-slate-500 font-extrabold">الإجمالي</p>
										
										</div>

										<div className="mt-0.5 flex items-end gap-2 justify-end">
											<p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{displayTotal.toFixed(2)}</p>
											<span className="text-sm font-extrabold text-slate-700">ر.س</span>
										</div>
									</div>

									<div className="sm:hidden flex flex-col items-end">
										<p className="text-[11px] text-slate-500 font-extrabold">الإجمالي</p>
										<div className="flex items-end gap-1">
											<p className="text-lg font-black text-slate-900 leading-none">{displayTotal.toFixed(2)}</p>
											<span className="text-[12px] font-extrabold text-slate-700">ر.س</span>
										</div>
									</div>

									<div className="min-w-[170px]">
										<ButtonComponent
											className="scale-[.8]"
											title={showMissingBadge ? "اختر الخيارات أولاً" : uploadingDesign ? "جاري الرفع..." : "اضافة للسلة"}
											onClick={handleAddToCart}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="h-16" />
		</>
	);
}