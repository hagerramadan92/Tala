"use client";

import { useEffect, useMemo, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import { useAppContext } from "@/src/context/AppContext";

import {
	Box, FormControl, InputLabel, Select, MenuItem, FormHelperText,
	CircularProgress, Alert, Button, Checkbox, ListItemText, Divider,
} from "@mui/material";
import { Save, CheckCircle, Warning, Info, Refresh } from "@mui/icons-material";
import { StickerFormSkeleton } from "@/components/skeletons/HomeSkeletons";


export interface StickerFormHandle {
	getOptions: () => SelectedOptions;
	validate: () => boolean;
}

interface StickerFormProps {
	cartItemId?: number;
	productId: number;
	productData?: any;

	onOptionsChange?: (options: SelectedOptions) => void;
	showValidation?: boolean;
}

type DesignSendMethod = "whatsapp" | "email" | "upload" | null;

function getSocialValue(socialMedia: any, key: "whatsapp" | "email") {
	const arr = Array.isArray(socialMedia) ? socialMedia : [];
	const item = arr.find((x: any) => String(x?.key).toLowerCase() === key);
	const value = String(item?.value || "").trim();
	return value || null;
}

export const StickerForm = forwardRef<StickerFormHandle, StickerFormProps>(function StickerForm(
	{ cartItemId, productId, productData, onOptionsChange, showValidation = false },
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

	// design (optional)
	const [designFile, setDesignFile] = useState<File | null>(null);
	const [designSendMethod, setDesignSendMethod] = useState<DesignSendMethod>(null);
	const [designUploading, setDesignUploading] = useState(false);

	const groupedOptions = useMemo(() => {
		const list = Array.isArray(apiData?.options) ? apiData.options : [];
		const out: Record<string, any[]> = {};
		list.forEach((o: any) => {
			const k = String(o.option_name || "").trim();
			if (!k) return;
			out[k] = out[k] || [];
			out[k].push(o);
		});
		return out;
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
		});

		if (needPrintingMethod && printingMethod === "اختر") isValid = false;
		if (needPrintLocation && (!Array.isArray(printLocations) || printLocations.length === 0)) isValid = false;

		return isValid;
	}, [apiData, needSize, needSizeTier, needColor, needMaterial, needPrintingMethod, needPrintLocation, size, sizeTierId, color, material, optionGroups, requiredOptionGroups, printingMethod, printLocations]);

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
			printing_method: printingMethod,
			print_locations: printLocations,
			isValid: validateCurrentOptions(),
		};
	}, [size, sizeTierId, sizeTierQty, sizeTierUnit, sizeTierTotal, color, material, optionGroups, printingMethod, printLocations, validateCurrentOptions]);

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

			// init groups
			if (Array.isArray(productData?.options)) {
				const out: Record<string, string> = {};
				productData.options.forEach((o: any) => {
					const k = String(o.option_name || "").trim();
					if (!k) return;
					if (!out[k]) out[k] = "اختر";
				});
				setOptionGroups(out);
			} else {
				setOptionGroups({});
			}

			// reset (do not wipe in cart if you want preserve; we restore from saved anyway)
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

	// CART MODE: load saved options
	const loadSavedOptions = useCallback(async () => {
		if (!cartItemId) return;
		if (!apiData) return;

		try {
			const saved = await fetchCartItemOptions(cartItemId);
			if (!saved) return;

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
				setSizeTierTotal(backendTotal > 0 ? backendTotal : (t && t > 0 ? t : computed > 0 ? computed : null));
			}

			// restore option groups
			const out: Record<string, string> = {};
			Object.keys(groupedOptions).forEach((g) => (out[g] = "اختر"));

			if (Array.isArray(saved.selected_options)) {
				saved.selected_options.forEach((opt: any) => {
					const name = String(opt.option_name || "").trim();
					const value = String(opt.option_value || "").trim();
					if (!name || !value) return;

					if (["المقاس", "اللون", "الخامة", "طريقة الطباعة", "مكان الطباعة", "كمية المقاس", "سعر المقاس الإجمالي", "سعر الوحدة"].includes(name)) return;
					if (Object.prototype.hasOwnProperty.call(out, name)) out[name] = value;
				});
			}

			setOptionGroups(out);
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

	// IMPORTANT FIX (same as product page): compute total if backend total missing
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
		const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
		const idsPayload = buildIdsPayload(apiData, opts);

		// ✅ IMPORTANT: in cart mode, if tier qty exists, update quantity too
		const payload: any = {
			...idsPayload,
			selected_options,
			quantity: needSizeTier && opts.size_quantity ? Number(opts.size_quantity) : undefined,
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

	// design service (show only if "خدمة تصميم" === "لدى تصميم")
	const designServiceValue = String(optionGroups?.["خدمة تصميم"] ?? "اختر").trim();
	const showDesignBoxes = designServiceValue === "لدى تصميم";

	const whatsappFromSocial = getSocialValue(socialMedia, "whatsapp"); // could be full link or phone or web.whatsapp.com
	const emailFromSocial = getSocialValue(socialMedia, "email");

	// build links:
	const waText = encodeURIComponent(`مرحباً، لدي تصميم للمنتج رقم ${productId}${cartItemId ? ` - عنصر سلة: ${cartItemId}` : ""}`);

	const whatsappHref = useMemo(() => {
		if (!whatsappFromSocial) return null;

		// if already URL, use it (append text if wa.me)
		if (/^https?:\/\//i.test(whatsappFromSocial)) {
			// if it's wa.me link, add ?text=
			if (/wa\.me\//i.test(whatsappFromSocial) && !/text=/i.test(whatsappFromSocial)) {
				const join = whatsappFromSocial.includes("?") ? "&" : "?";
				return `${whatsappFromSocial}${join}text=${waText}`;
			}
			return whatsappFromSocial;
		}

		// otherwise treat as phone number
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

	// upload design file (optional)
	const uploadDesignFile = async () => {
		if (!API_URL) return toast.error("API غير متوفر");
		if (!token) return toast.error("يجب تسجيل الدخول أولاً");
		if (!designFile) return toast.error("اختر ملف التصميم أولاً");

		try {
			setDesignUploading(true);

			const opts = getOptionsObj();
			const selected_options = buildSelectedOptionsWithPrice(apiData, opts);

			const fd = new FormData();
			fd.append("file", designFile);
			fd.append("product_id", String(productId));
			if (cartItemId) fd.append("cart_item_id", String(cartItemId));
			fd.append("user_id", String(userId ?? user?.id ?? ""));
			fd.append("design_service", "لدى تصميم");
			fd.append("selected_options", JSON.stringify(selected_options));

			const res = await fetch(`${API_URL}/file`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: fd,
			});

			const json = await res.json().catch(() => null);
			if (!res.ok || (json && json.status === false)) throw new Error(json?.message || "فشل رفع الملف");

			toast.success("تم رفع الملف بنجاح ✅");
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
								onChange={(e) => { setColor(e.target.value as string); markDirty(); }}
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
								onChange={(e) => { setMaterial(e.target.value as string); markDirty(); }}
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

				{/* option groups */}
				{Object.keys(groupedOptions).map((groupName) => {
					const items = groupedOptions[groupName] || [];
					const required = items.some((x: any) => Boolean(x?.is_required));
					const currentValue = optionGroups?.[groupName] || "اختر";
					const fieldError = showValidation && required && currentValue === "اختر";

					return (
						<Box key={groupName}>
							<FormControl fullWidth size="small" required={required} error={fieldError}>
								<InputLabel>{groupName}</InputLabel>
								<Select
									value={currentValue}
									onChange={(e) => {
										const value = e.target.value as string;
										setOptionGroups((prev) => ({ ...prev, [groupName]: value }));
										markDirty();

										// if design service changed -> reset method/file
										if (String(groupName).trim() === "خدمة تصميم") {
											setDesignSendMethod(null);
											setDesignFile(null);
										}
									}}
									label={groupName}
									className="bg-white"
								>
									<MenuItem value="اختر" disabled>
										<em className="text-gray-600">اختر</em>
									</MenuItem>

									{items.map((o: any) => (
										<MenuItem key={o.id} value={o.option_value}>
											<div className="flex items-center justify-between gap-3 w-full">
												<span>{o.option_value}</span>
												{Number(o.additional_price || 0) > 0 ? (
													<span className="text-xs font-black text-amber-700">+ {o.additional_price}</span>
												) : (
													<span className="text-xs font-black text-slate-500">0</span>
												)}
											</div>
										</MenuItem>
									))}
								</Select>

								{fieldError && <FormHelperText className="text-red-500 text-xs">يجب اختيار {groupName}</FormHelperText>}
							</FormControl>

							{/* ✅ Design boxes: show only when social values exist */}
							{String(groupName).trim() === "خدمة تصميم" && showDesignBoxes && (whatsappHref || emailHref) && (
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
												<input type="file" onChange={(e) => setDesignFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />

												<Button
													variant="contained"
													onClick={uploadDesignFile}
													disabled={designUploading || !designFile}
													startIcon={designUploading ? <CircularProgress size={16} /> : undefined}
													sx={{ borderRadius: "14px", backgroundColor: "#14213d", fontWeight: 900 }}
												>
													{designUploading ? "جاري الرفع..." : "رفع الملف"}
												</Button>

												<p className="text-xs text-slate-500 font-bold">سيتم إرسال الملف مع تفاصيل المنتج والخيارات إلى: {API_URL}/file</p>
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
								onChange={(e) => { setPrintingMethod(e.target.value as string); markDirty(); }}
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
								onChange={(e) => { setPrintLocations(e.target.value as string[]); markDirty(); }}
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



// src/utils/productOptions.ts

export type SelectedOptions = {
	size: string;

	// tier selection for size
	size_tier_id?: number | null;
	size_quantity?: number | null;
	size_price_per_unit?: number | null;
	size_total_price?: number | null;

	color: string;
	material: string;
	optionGroups: Record<string, string>;
	printing_method: string;

	// multi-select print locations
	print_locations: string[];

	isValid: boolean;
};

export const num = (v: any) => {
	const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
	return Number.isFinite(x) ? x : 0;
};

export function buildIdsPayload(apiData: any, opts: SelectedOptions) {
	const sizeObj = apiData?.sizes?.find((s: any) => s?.name === opts.size);
	const colorObj = apiData?.colors?.find((c: any) => c?.name === opts.color);
	const materialObj = apiData?.materials?.find((m: any) => m?.name === opts.material);
	const pmObj = apiData?.printing_methods?.find((p: any) => p?.name === opts.printing_method);

	// print locations => array of IDs
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

export function buildSelectedOptionsWithPrice(apiData: any, opts: SelectedOptions) {
	const selected_options: Array<{ option_name: string; option_value: string; additional_price: number }> = [];

	// size (name)
	if (opts.size && opts.size !== "اختر") {
		selected_options.push({ option_name: "المقاس", option_value: opts.size, additional_price: 0 });
	}

	// tier (qty + totals)
	if (opts.size_tier_id && opts.size_quantity && opts.size_total_price != null) {
		selected_options.push({ option_name: "كمية المقاس", option_value: String(opts.size_quantity), additional_price: 0 });
		selected_options.push({ option_name: "سعر المقاس الإجمالي", option_value: String(opts.size_total_price), additional_price: 0 });
		if (opts.size_price_per_unit != null) {
			selected_options.push({ option_name: "سعر الوحدة", option_value: String(opts.size_price_per_unit), additional_price: 0 });
		}
	}

	// color
	if (opts.color && opts.color !== "اختر") {
		const c = apiData?.colors?.find((x: any) => x.name === opts.color);
		selected_options.push({ option_name: "اللون", option_value: opts.color, additional_price: num(c?.additional_price) });
	}

	// material
	if (opts.material && opts.material !== "اختر") {
		const m = apiData?.materials?.find((x: any) => x.name === opts.material);
		selected_options.push({ option_name: "الخامة", option_value: opts.material, additional_price: num(m?.additional_price) });
	}

	// option groups
	Object.entries(opts.optionGroups || {}).forEach(([group, value]) => {
		if (!value || value === "اختر") return;
		const row = apiData?.options?.find(
			(o: any) =>
				String(o.option_name || "").trim() === String(group).trim() &&
				String(o.option_value || "").trim() === String(value).trim()
		);
		selected_options.push({
			option_name: group,
			option_value: value,
			additional_price: num(row?.additional_price),
		});
	});

	// printing method
	if (opts.printing_method && opts.printing_method !== "اختر") {
		const pm = apiData?.printing_methods?.find((x: any) => x.name === opts.printing_method);
		selected_options.push({
			option_name: "طريقة الطباعة",
			option_value: opts.printing_method,
			additional_price: num(pm?.base_price ?? pm?.pivot_price),
		});
	}

	// print locations (multi)
	if (Array.isArray(opts.print_locations) && opts.print_locations.length > 0) {
		opts.print_locations.forEach((locName) => {
			const pl = apiData?.print_locations?.find((x: any) => x.name === locName);
			selected_options.push({
				option_name: "مكان الطباعة",
				option_value: locName,
				additional_price: num(pl?.additional_price ?? pl?.pivot_price),
			});
		});
	}

	return selected_options;
}

export function extractValueFromOptions(options: any[], optionName: string) {
	if (!options || !Array.isArray(options)) return null;
	const option = options.find((opt: any) => opt.option_name === optionName);
	return option ? option.option_value : null;
}

export function extractValuesFromOptions(options: any[], optionName: string) {
	if (!options || !Array.isArray(options)) return [];
	return options
		.filter((opt: any) => opt.option_name === optionName)
		.map((x: any) => String(x.option_value || "").trim())
		.filter(Boolean);
}
