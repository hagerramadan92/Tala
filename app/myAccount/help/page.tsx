"use client";

import UserNameWelcome from "@/components/UserNameWelcome";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TfiMenuAlt } from "react-icons/tfi";
import { TiMessages } from "react-icons/ti";
import { FiSearch } from "react-icons/fi";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { BsShieldCheck, BsArrowReturnLeft } from "react-icons/bs";

type HelpItem = {
	href: string;
	title: string;
	desc: string;
	icon: React.ReactNode;
	badge?: string;
};

function Card({
	item,
}: {
	item: HelpItem;
}) {
	return (
		<Link href={item.href} aria-label={item.title} className="group">
			<div
				className="
          relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 md:p-5
          shadow-sm transition
          hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300
          focus:outline-none
        "
			>
				{/* subtle shine */}
				<div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
					<div className="absolute -left-24 top-0 h-full w-40 rotate-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
				</div>

				<div className="flex items-start gap-4">
					<div
						className="
              grid h-12 w-12 place-items-center rounded-2xl
              bg-slate-50 text-[#233a7d] ring-1 ring-slate-200
              group-hover:bg-[#eff6ff] group-hover:ring-[#c7ddff]
              transition
            "
					>
						{item.icon}
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between gap-3">
							<h5 className="text-base md:text-lg font-extrabold text-slate-900 truncate">
								{item.title}
							</h5>

							{item.badge ? (
								<span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
									{item.badge}
								</span>
							) : null}
						</div>

						<p className="mt-1 text-sm text-slate-600 leading-6 line-clamp-2">
							{item.desc}
						</p>

						<div className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-pro">
							اقرأ المزيد
							<MdOutlineKeyboardArrowLeft className="text-pro transition group-hover:translate-x-[-2px]" />
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}

export default function Page() {
	const [q, setQ] = useState("");

	const items: HelpItem[] = [
		{
			href: "/FAQ",
			title: "الأسئلة الشائعة",
			desc: "تعرف على المزيد حول الاسترداد، الدفع عند الاستلام، والضمان.",
			icon: <TiMessages size={24} />,
			badge: "الأكثر زيارة",
		},
		{
			href: "/returnsPolicy",
			title: "سياسة الاسترجاع",
			desc: "تعرف على شروط وإجراءات الاسترجاع بسهولة وخطوات التنفيذ.",
			icon: <BsArrowReturnLeft size={22} />,
		},
		{
			href: "/policy",
			title: "سياسة الخصوصية",
			desc: "كيف نحمي بياناتك ونضمن خصوصيتك أثناء استخدام الموقع.",
			icon: <BsShieldCheck size={22} />,
		},
		{
			href: "/terms",
			title: "الشروط والأحكام",
			desc: "القواعد التي تنظم استخدامك لخدماتنا والالتزامات المتبادلة.",
			icon: <TfiMenuAlt size={21} />,
		},
	];

	const filtered = useMemo(() => {
		const s = q.trim();
		if (!s) return items;
		return items.filter(
			(it) =>
				it.title.includes(s) ||
				it.desc.includes(s)
		);
	}, [q]);

	return (
		<div dir="rtl" className="space-y-5">
			{/* Hero */}
			<div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<div className="absolute inset-0 bg-gradient-to-l from-pro/10 via-transparent to-transparent" />

				<div className="relative p-5 md:p-7">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h4 className="text-2xl md:text-3xl font-extrabold text-slate-900">
								مركز المساعدة
							</h4>
							<p className="mt-2 text-sm md:text-base text-slate-600">
								ابحث عن إجابات سريعة أو تصفّح المقالات الشائعة.
							</p>
							<div className="mt-3">
								<UserNameWelcome />
							</div>
						</div>

						{/* Search */}
						<div className="w-full md:w-[420px]">
							<div className="relative">
								<FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
								<input
									value={q}
									onChange={(e) => setQ(e.target.value)}
									placeholder="ابحث: استرجاع، ضمان، خصوصية..."
									className="
                    w-full rounded-2xl border border-slate-200 bg-white
                    pl-10 pr-4 py-3 text-sm font-semibold text-slate-900
                    placeholder:text-slate-400 outline-none transition
                    focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200 
                  "
								/>
							</div>

							{/* Quick tips */}
							<div className="mt-3 flex flex-wrap gap-2">
								{["استرجاع", "ضمان", "شحن", "خصوصية"].map((t) => (
									<button
										key={t}
										type="button"
										onClick={() => setQ(t)}
										className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 transition"
									>
										{t}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Popular Articles */}
			<div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 md:p-7">
				<div className="flex items-center justify-between gap-3 mb-5">
					<div>
						<h4 className="text-xl md:text-2xl font-extrabold text-slate-900">
							المقالات الشائعة
						</h4>
						<p className="mt-1 text-sm text-slate-600">
							اختر مقالاً لعرض التفاصيل.
						</p>
					</div>

					<span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
						{filtered.length} نتيجة
					</span>
				</div>

				{filtered.length === 0 ? (
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
						<p className="font-extrabold text-slate-900">لا توجد نتائج</p>
						<p className="mt-2 text-sm text-slate-600">
							جرّب كلمات أخرى مثل: استرجاع، ضمان، شحن.
						</p>
						<button
							onClick={() => setQ("")}
							className="mt-4 rounded-xl bg-pro px-5 py-3 text-sm font-extrabold text-white hover:opacity-95 transition"
						>
							مسح البحث
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{filtered.map((item) => (
							<Card key={item.href} item={item} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}



