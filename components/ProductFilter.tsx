"use client";

import { ReactNode, useMemo, useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

type Filters = {
	available: boolean;
	categories: number[];
	brands: string[];
	materials: string[];
	colors: string[];
};

type Category = { id: number; name: string; slug?: string };

type ProductFilterProps = {
	brands?: string[];
	materials?: string[];
	colors?: string[];
	categories?: Category[];
	onFilterChange?: (filters: Filters) => void;
};
 

export default function ProductFilter({
	brands = [],
	materials = [],
	colors = [],
	categories = [],
	onFilterChange = () => { },
}: ProductFilterProps) {
	const [filters, setFilters] = useState<Filters>({
		available: false,
		categories: [],
		brands: [],
		materials: [],
		colors: [],
	});

	const hasCategories = categories.length > 0;
	const hasBrands = brands.length > 0;
	const hasMaterials = materials.length > 0;
	const hasColors = colors.length > 0;

	const activeChips = useMemo(() => {
		const chips: { key: keyof Filters; label: string; value?: string | number }[] = [];

		if (filters.available) chips.push({ key: "available", label: "متوفر فقط" });

		filters.categories.forEach((id) => {
			const c = categories.find((x) => x.id === id);
			if (c) chips.push({ key: "categories", label: c.name, value: id });
		});

		filters.materials.forEach((m) => chips.push({ key: "materials", label: m, value: m }));
		filters.colors.forEach((c) => chips.push({ key: "colors", label: c, value: c }));
		filters.brands.forEach((b) => chips.push({ key: "brands", label: b, value: b }));

		return chips;
	}, [filters, categories]);

	const notify = (next: Filters) => onFilterChange(next);

	const toggle = (type: keyof Filters, value?: string | number) => {
		setFilters((prev) => {
			const next: Filters = { ...prev };

			if (type === "available") {
				next.available = !prev.available;
			} else {
				const arr = prev[type] as any[];
				const exists = arr.includes(value);
				(next[type] as any) = exists ? arr.filter((v) => v !== value) : [...arr, value];
			}

			notify(next);
			return next;
		});
	};

	const clearAll = () => {
		const next: Filters = { available: false, categories: [], brands: [], materials: [], colors: [] };
		setFilters(next);
		notify(next);
	};

	const removeChip = (chip: { key: keyof Filters; value?: any }) => {
		if (chip.key === "available") return toggle("available");
		toggle(chip.key, chip.value);
	};

	return (
		<div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sticky top-[150px]">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<FiFilter />
					<p className="font-black text-[1.05rem] text-slate-900">تصفية</p>
				</div>

				<button
					onClick={clearAll}
					className="text-xs font-extrabold text-slate-600 hover:text-slate-900 rounded-xl px-3 py-2 hover:bg-slate-50 transition"
				>
					مسح الكل
				</button>
			</div>

			{/* Active chips */}
			{activeChips.length > 0 && (
				<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-wrap gap-2">
					{activeChips.map((chip, i) => (
						<button
							key={i}
							onClick={() => removeChip(chip)}
							className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition"
							aria-label="remove filter"
						>
							<span className="truncate max-w-[140px]">{chip.label}</span>
							<FiX />
						</button>
					))}
				</motion.div>
			)}

			<div className="mt-4 space-y-3">
				<FilterSection title="المتوفر" defaultOpen>
					<label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition">
						<input
							type="checkbox"
							className="w-4 h-4 accent-slate-900"
							checked={filters.available}
							onChange={() => toggle("available")}
						/>
						<div>
							<p className="text-sm font-extrabold text-slate-800">متوفر فقط</p>
							<p className="text-xs text-slate-500">إخفاء المنتجات غير المتاحة</p>
						</div>
					</label>
				</FilterSection>

				{/* Hide sections if empty */}
				{hasCategories && (
					<FilterSection title="فئات المنتج">
						<div className="space-y-2">
							{categories.map((cat) => (
								<label
									key={cat.id}
									className="flex items-center gap-3 cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-slate-50 transition"
								>
									<input
										type="checkbox"
										className="w-4 h-4 accent-slate-900"
										checked={filters.categories.includes(cat.id)}
										onChange={() => toggle("categories", cat.id)}
									/>
									<p className="text-sm font-extrabold text-slate-700">{cat.name}</p>
								</label>
							))}
						</div>
					</FilterSection>
				)}

				{hasBrands && (
					<FilterSection title="العلامة التجارية">
						<div className="space-y-2">
							{brands.map((b) => (
								<label
									key={b}
									className="flex items-center gap-3 cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-slate-50 transition"
								>
									<input
										type="checkbox"
										className="w-4 h-4 accent-slate-900"
										checked={filters.brands.includes(b)}
										onChange={() => toggle("brands", b)}
									/>
									<p className="text-sm font-extrabold text-slate-700">{b}</p>
								</label>
							))}
						</div>
					</FilterSection>
				)}

				{hasMaterials && (
					<FilterSection title="الخامات">
						<div className="space-y-2">
							{materials.map((m) => (
								<label
									key={m}
									className="flex items-center gap-3 cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-slate-50 transition"
								>
									<input
										type="checkbox"
										className="w-4 h-4 accent-slate-900"
										checked={filters.materials.includes(m)}
										onChange={() => toggle("materials", m)}
									/>
									<p className="text-sm font-extrabold text-slate-700">{m}</p>
								</label>
							))}
						</div>
					</FilterSection>
				)}

				{hasColors && (
					<FilterSection title="الألوان">
						<div className="space-y-2">
							{colors.map((c) => (
								<label
									key={c}
									className="flex items-center gap-3 cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-slate-50 transition"
								>
									<input
										type="checkbox"
										className="w-4 h-4 accent-slate-900"
										checked={filters.colors.includes(c)}
										onChange={() => toggle("colors", c)}
									/>

									<span
										className="w-5 h-5 rounded-full border border-slate-200 shadow-sm"
										style={{ background: c }}
									/>
									<p className="text-sm font-extrabold text-slate-700">{c}</p>
								</label>
							))}
						</div>
					</FilterSection>
				)}
			</div>

			{/* If no options at all */}
			{!hasCategories && !hasBrands && !hasMaterials && !hasColors && (
				<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
					<p className="text-sm font-extrabold text-slate-700">لا توجد خيارات تصفية هنا</p>
					<p className="text-xs text-slate-500 mt-1">سيتم عرض الخيارات تلقائيًا عند توفرها</p>
				</div>
			)}
		</div>
	);
}


function FilterSection({
	title,
	children,
	defaultOpen = false,
}: {
	title: string;
	children: ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="rounded-2xl border border-slate-200 overflow-hidden">
			<button
				type="button"
				aria-label={title}
				onClick={() => setOpen((p) => !p)}
				className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition"
			>
				<span className="font-black text-slate-900 text-[0.98rem]">{title}</span>
				<motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
					<ChevronDown className="text-slate-500" />
				</motion.span>
			</button>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.22 }}
						className="bg-white"
					>
						<div className="p-3">{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}