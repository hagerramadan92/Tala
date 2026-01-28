"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormHelperText,
	CircularProgress,
	Alert,
} from "@mui/material";
import { motion } from "framer-motion";
import { useCart } from "@/src/context/CartContext";
import { CheckCircle, Info } from "@mui/icons-material";
import { StickerFormSkeleton } from "./skeletons/HomeSkeletons";

type SelectedOpt = { option_name: string; option_value: string };

interface StickerFormProps {
	cartItemId?: number;
	productId: number;

	/** ✅ NEW: pass product object from cart to avoid refetch per item */
	productData?: any;

	/** ✅ NEW: initial selected_options from cart item (string or array) */
	initialSelectedOptions?: any;

	/** Optional callback */
	onOptionsChange?: (options: any) => void;

	/** show field validation */
	showValidation?: boolean;

	/** debounce ms for auto save */
	autoSaveDebounceMs?: number;
}

function safeParseSelectedOptions(raw: any): SelectedOpt[] {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

function extractValueFromOptions(options: SelectedOpt[], optionName: string) {
	if (!options || !Array.isArray(options)) return null;
	const found = options.find((opt) => String(opt.option_name).trim() === String(optionName).trim());
	return found ? String(found.option_value ?? "").trim() : null;
}

export default function StickerForm({
	cartItemId,
	productId,
	productData,
	initialSelectedOptions,
	onOptionsChange,
	showValidation = false,
	autoSaveDebounceMs = 700,
}: StickerFormProps) {
	const { updateCartItem } = useCart();

	const [size, setSize] = useState("اختر");
	const [color, setColor] = useState("اختر");
	const [material, setMaterial] = useState("اختر");

	const [optionGroups, setOptionGroups] = useState<Record<string, string>>({});
	const [printingMethod, setPrintingMethod] = useState("اختر");
	const [printLocation, setPrintLocation] = useState("اختر");

	const [apiData, setApiData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	const [saving, setSaving] = useState(false);
	const [savedSuccessfully, setSavedSuccessfully] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);

	// prevents autosave firing while we initialize/restore
	const isHydratingRef = useRef(true);
	const saveTimerRef = useRef<any>(null);
	const lastPayloadRef = useRef<string>("");

	const baseUrl = process.env.NEXT_PUBLIC_API_URL;

	// ✅ prefer productData from cart; fallback to fetch if not provided
	useEffect(() => {
		let alive = true;

		const load = async () => {
			setApiError(null);
			setLoading(true);

			try {
				if (productData) {
					if (!alive) return;
					setApiData(productData);
					return;
				}

				const res = await fetch(`${baseUrl}/products/${productId}`, { cache: "no-store" });
				if (!res.ok) throw new Error("فشل تحميل خيارات المنتج");

				const json = await res.json();
				if (!json?.data) throw new Error("لا توجد بيانات للمنتج");

				if (!alive) return;
				setApiData(json.data);
			} catch (err: any) {
				if (!alive) return;
				setApiError(err?.message || "حدث خطأ أثناء تحميل الخيارات");
				setApiData(null);
			} finally {
				if (!alive) return;
				setLoading(false);
			}
		};

		load();
		return () => {
			alive = false;
		};
	}, [productId, baseUrl, productData]);

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

	const validateCurrentOptions = useCallback(() => {
		if (!apiData) return false;

		let isValid = true;

		if (apiData.sizes?.length > 0 && (!size || size === "اختر")) isValid = false;
		if (apiData.colors?.length > 0 && (!color || color === "اختر")) isValid = false;
		if (apiData.materials?.length > 0 && (!material || material === "اختر")) isValid = false;

		requiredOptionGroups.forEach((g) => {
			const v = optionGroups?.[g];
			if (!v || v === "اختر") isValid = false;
		});

		if (Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0) {
			if (!printingMethod || printingMethod === "اختر") isValid = false;
		}
		if (Array.isArray(apiData?.print_locations) && apiData.print_locations.length > 0) {
			if (!printLocation || printLocation === "اختر") isValid = false;
		}

		return isValid;
	}, [apiData, size, color, material, optionGroups, requiredOptionGroups, printingMethod, printLocation]);

	// ✅ init optionGroups keys + restore initial selected options
	useEffect(() => {
		if (!apiData) return;

		isHydratingRef.current = true;

		// init option group keys with "اختر"
		const initGroups: Record<string, string> = {};
		Object.keys(groupedOptions).forEach((g) => (initGroups[g] = "اختر"));

		// restore from cart item selected_options
		const selected = safeParseSelectedOptions(initialSelectedOptions);

		const sizeFrom = extractValueFromOptions(selected, "المقاس");
		const colorFrom = extractValueFromOptions(selected, "اللون");
		const materialFrom = extractValueFromOptions(selected, "الخامة");
		const printingFrom = extractValueFromOptions(selected, "طريقة الطباعة");
		const locationFrom = extractValueFromOptions(selected, "مكان الطباعة");

		setSize(sizeFrom || "اختر");
		setColor(colorFrom || "اختر");
		setMaterial(materialFrom || "اختر");
		setPrintingMethod(printingFrom || "اختر");
		setPrintLocation(locationFrom || "اختر");

		// restore dynamic groups
		selected.forEach((opt) => {
			const name = String(opt.option_name || "").trim();
			const value = String(opt.option_value || "").trim();
			if (!name || !value) return;

			if (["المقاس", "اللون", "الخامة", "طريقة الطباعة", "مكان الطباعة"].includes(name)) return;
			if (Object.prototype.hasOwnProperty.call(initGroups, name)) initGroups[name] = value;
		});

		setOptionGroups(initGroups);

		// allow autosave after first paint tick
		setTimeout(() => {
			isHydratingRef.current = false;
		}, 0);
	}, [apiData, groupedOptions, initialSelectedOptions]);

	// emit changes to parent (optional)
	useEffect(() => {
		if (!onOptionsChange) return;
		onOptionsChange({
			size,
			color,
			material,
			optionGroups,
			printing_method: printingMethod,
			print_location: printLocation,
			isValid: validateCurrentOptions(),
		});
	}, [size, color, material, optionGroups, printingMethod, printLocation, validateCurrentOptions, onOptionsChange]);

	const buildSelectedOptionsPayload = useCallback(() => {
		if (!apiData) return [];

		const selected_options: SelectedOpt[] = [];

		if (apiData.sizes?.length > 0 && size !== "اختر") selected_options.push({ option_name: "المقاس", option_value: size });
		if (apiData.colors?.length > 0 && color !== "اختر") selected_options.push({ option_name: "اللون", option_value: color });
		if (apiData.materials?.length > 0 && material !== "اختر") selected_options.push({ option_name: "الخامة", option_value: material });

		Object.entries(optionGroups || {}).forEach(([group, value]) => {
			if (value && value !== "اختر") selected_options.push({ option_name: group, option_value: value });
		});

		if (Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0 && printingMethod !== "اختر") {
			selected_options.push({ option_name: "طريقة الطباعة", option_value: printingMethod });
		}
		if (Array.isArray(apiData?.print_locations) && apiData.print_locations.length > 0 && printLocation !== "اختر") {
			selected_options.push({ option_name: "مكان الطباعة", option_value: printLocation });
		}

		return selected_options;
	}, [apiData, size, color, material, optionGroups, printingMethod, printLocation]);

	// ✅ AUTO SAVE (debounced) whenever options change
	useEffect(() => {
		if (!cartItemId) return; // only autosave in cart
		if (!apiData) return;
		if (isHydratingRef.current) return;

		const payload = buildSelectedOptionsPayload();
		const payloadKey = JSON.stringify(payload);

		// skip if same as last sent payload
		if (payloadKey === lastPayloadRef.current) return;

		// debounce
		if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

		saveTimerRef.current = setTimeout(async () => {
			setSaving(true);
			setSavedSuccessfully(false);

			try {
				const ok = await updateCartItem(cartItemId, { selected_options: payload });
				if (ok) {
					lastPayloadRef.current = payloadKey;
					setSavedSuccessfully(true);
					setTimeout(() => setSavedSuccessfully(false), 1500);
				}
			} finally {
				setSaving(false);
			}
		}, autoSaveDebounceMs);

		return () => {
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		};
	}, [cartItemId, apiData, buildSelectedOptionsPayload, autoSaveDebounceMs, size, color, material, optionGroups, printingMethod, printLocation, updateCartItem]);

	if (loading) return <StickerFormSkeleton />;

	if (apiError || !apiData) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
				<p className="text-slate-700 font-extrabold">{apiError || "لا توجد بيانات للمنتج"}</p>
			</div>
		);
	}

	const needSize = apiData?.sizes?.length > 0;
	const needColor = apiData?.colors?.length > 0;
	const needMaterial = apiData?.materials?.length > 0;

	const needPrintingMethod = Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0;
	const needPrintLocation = Array.isArray(apiData?.print_locations) && apiData.print_locations.length > 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 14 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			className="pt-2"
		>
			{/* ✅ autosave status */}
			{cartItemId && (
				<div className="mb-3 flex items-center gap-2">
					{saving ? (
						<div className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
							<CircularProgress size={14} />
							جاري حفظ الخيارات...
						</div>
					) : savedSuccessfully ? (
						<Alert severity="success" className="rounded-2xl py-1" icon={<CheckCircle />}>
							تم حفظ الخيارات
						</Alert>
					) : null}
				</div>
			)}

			<div className="space-y-4">
				{/* SIZE */}
				{needSize && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needSize && size === "اختر"}>
							<InputLabel>المقاس</InputLabel>
							<Select value={size} onChange={(e) => setSize(e.target.value as string)} label="المقاس" className="bg-white">
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

				{/* COLOR */}
				{needColor && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needColor && color === "اختر"}>
							<InputLabel>اللون</InputLabel>
							<Select value={color} onChange={(e) => setColor(e.target.value as string)} label="اللون" className="bg-white">
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

				{/* MATERIAL */}
				{needMaterial && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needMaterial && material === "اختر"}>
							<InputLabel>الخامة</InputLabel>
							<Select value={material} onChange={(e) => setMaterial(e.target.value as string)} label="الخامة" className="bg-white">
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

				{/* OPTIONS GROUPS */}
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
									onChange={(e) => setOptionGroups((prev) => ({ ...prev, [groupName]: e.target.value as string }))}
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
						</Box>
					);
				})}

				{/* PRINTING METHOD */}
				{needPrintingMethod && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && printingMethod === "اختر"}>
							<InputLabel>طريقة الطباعة</InputLabel>
							<Select value={printingMethod} onChange={(e) => setPrintingMethod(e.target.value as string)} label="طريقة الطباعة" className="bg-white">
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

				{/* PRINT LOCATION */}
				{needPrintLocation && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && printLocation === "اختر"}>
							<InputLabel>مكان الطباعة</InputLabel>
							<Select value={printLocation} onChange={(e) => setPrintLocation(e.target.value as string)} label="مكان الطباعة" className="bg-white">
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.print_locations.map((p: any) => (
									<MenuItem key={p.id} value={p.name}>
										<div className="flex items-center justify-between gap-3 w-full">
											<span>{p.name}</span>
											<span className="text-xs font-black text-slate-500">{p.type}</span>
										</div>
									</MenuItem>
								))}
							</Select>
							{showValidation && printLocation === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار مكان الطباعة</FormHelperText>}
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
}
