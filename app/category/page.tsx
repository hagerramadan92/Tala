"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import { HiOutlineSquares2X2, HiOutlineFolderOpen } from "react-icons/hi2";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";

interface Category {
	id: number;
	name: string;
	slug: string;
	description?: string;
	image?: string;
	sub_image?: string;
	is_parent?: boolean;
	children?: Category[];
}

/* -------------------- Skeleton (Shimmer) -------------------- */
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

function CategoryCardSkeleton() {
	return (
		<div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
			<div className="relative h-40">
				<Sk className="absolute inset-0 rounded-none" />
			</div>
			<div className="p-4 space-y-3">
				<Sk className="h-5 w-2/3" />
				<Sk className="h-4 w-full" />
				<Sk className="h-4 w-10/12" />
				<div className="flex items-center justify-between pt-2">
					<Sk className="h-6 w-20 rounded-full" />
					<Sk className="h-6 w-24 rounded-full" />
				</div>
			</div>
		</div>
	);
}

/* -------------------- Card -------------------- */
function CategoryCard({ category }: { category: Category }) {
	const childrenCount = category.children?.length ?? 0;

	return (
		<motion.div
			layout
			whileHover={{ y: -6 }}
			transition={{ type: "spring", stiffness: 260, damping: 18 }}
			className="group rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md"
		>
			<Link href={`/category/${category.id}`} className="block">
				{/* Image */}
				<div className="relative h-44 bg-slate-50">
					<Image
						src={category.image || "/images/noimg.png"}
						alt={category.name}
						fill
						sizes="(max-width: 768px) 100vw, 25vw"
						className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
					/>

					{/* Gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-90" />

					{/* Top badge */}
					<div className="absolute top-3 start-3">
						<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur border border-slate-200">
							<HiOutlineFolderOpen className="text-slate-700" />
							{childrenCount > 0 ? `${childrenCount} أقسام` : "قسم"}
						</span>
					</div>

					{/* Title on image */}
					<div className="absolute bottom-3 start-3 end-3">
						<h3 className="text-white font-extrabold text-lg line-clamp-1 drop-shadow">
							{category.name}
						</h3>
						{category.description ? (
							<p className="text-white/85 text-sm line-clamp-1">
								{category.description}
							</p>
						) : null}
					</div>
				</div>

				{/* Body */}
				<div className="p-4 flex flex-col gap-2 ">
					{/* children chips */}
					{childrenCount > 0 && (
						<div className="flex flex-wrap gap-2">
							{category.children!.slice(0, 4).map((child) => (
								<span
									key={child.id}
									className="text-xs px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700"
								>
									{child.name}
								</span>
							))}
							{childrenCount > 4 && (
								<span className="text-xs px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500">
									+{childrenCount - 4}
								</span>
							)}
						</div>
					)}

					{/* CTA */}
					<div className="  flex items-center justify-between">
						<span className="text-sm font-bold text-slate-700">
							استعرض المنتجات
						</span>
						<span className=" max-md:hidden inline-flex items-center gap-1 text-sm font-bold text-pro">
							فتح <MdOutlineKeyboardArrowLeft className="text-xl" />
						</span>
					</div>
				</div>
			</Link>
		</motion.div>
	);
}

/* -------------------- Page -------------------- */
export default function CategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	const [q, setQ] = useState("");
	const deferredQ = useDeferredValue(q);

	const [onlyParents, setOnlyParents] = useState(false);

	const baseUrl = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				setLoading(true);
				const res = await fetch(`${baseUrl}/categories`, { cache: "no-store" });
				const json = await res.json();
				if (json?.status) setCategories(json.data || []);
			} catch (e) {
				console.error(e);
				setCategories([]);
			} finally {
				setLoading(false);
			}
		};

		fetchCategories();
	}, [baseUrl]);

	const filtered = useMemo(() => {
		const query = deferredQ.trim().toLowerCase();

		let list = categories;

		if (onlyParents) {
			list = list.filter((c) => c.is_parent);
		}

		if (!query) return list;

		return list.filter((c) => {
			const inName = c.name?.toLowerCase().includes(query);
			const inDesc = c.description?.toLowerCase().includes(query);
			const inChildren =
				c.children?.some((ch) => ch.name?.toLowerCase().includes(query)) ?? false;

			return inName || inDesc || inChildren;
		});
	}, [categories, deferredQ, onlyParents]);

	return (
		<section dir="rtl" className=" container py-4 md:py-10">
			{/* Hero */}
			<div className="rounded-3xl border border-slate-200 bg-white overflow-hidden mb-8">
				<div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200">
					<div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
						<div>
							<h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
								الأقسام
							</h1>
							<p className="mt-2 text-slate-600">
								ابحث بسرعة أو استعرض الأقسام الرئيسية والفرعية بسهولة.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setOnlyParents(false)}
								className={`px-4 py-2 rounded-full border border-slate-200 text-sm font-bold transition ${!onlyParents ? "bg-pro text-white" : "bg-white text-slate-700 hover:bg-slate-50"
									}`}
							>
								<span className="inline-flex items-center gap-2">
									<HiOutlineSquares2X2 />
									الكل
								</span>
							</button>

							<button
								type="button"
								onClick={() => setOnlyParents(true)}
								className={`px-4 py-2 rounded-full border border-slate-200 text-sm font-bold transition ${onlyParents ? "bg-pro text-white" : "bg-white text-slate-700 hover:bg-slate-50"
									}`}
							>
								الأقسام الرئيسية فقط
							</button>
						</div>
					</div>

					{/* Search */}
					<div className="mt-5 relative">
						<FiSearch className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400" />
						<input
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="ابحث عن قسم أو قسم فرعي..."
							className="w-full h-12 rounded-2xl border border-slate-200 bg-white pr-11 pl-4 text-slate-800 outline-none focus:ring-2 focus:ring-pro/30"
						/>
					</div>

					{/* Counter */}
					{!loading && (
						<div className="mt-3 text-sm text-slate-500">
							عدد النتائج: <span className="font-bold text-slate-800">{filtered.length}</span>
						</div>
					)}
				</div>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
				{loading
					? Array.from({ length: 10 }).map((_, i) => <CategoryCardSkeleton key={i} />)
					: filtered.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
			</div>

			{!loading && filtered.length === 0 && (
				<div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center">
					<p className="text-slate-700 font-bold text-lg">لا توجد نتائج</p>
					<p className="text-slate-500 mt-1">جرّب كلمة بحث مختلفة أو اعرض الكل.</p>
					<button
						onClick={() => {
							setQ("");
							setOnlyParents(false);
						}}
						className="mt-4 px-5 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-800"
					>
						إعادة تعيين
					</button>
				</div>
			)}
		</section>
	);
}
