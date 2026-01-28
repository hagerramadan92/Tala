"use client";

import parse from "html-react-parser";
import { useMemo } from "react";

interface PageData {
	id: number;
	title: string;
	slug: string;
	content: string;
	seo?: {
		meta_title?: string;
		meta_description?: string;
		meta_keywords?: string;
	};
}

// إزالة H1 المكرر
function stripFirstH1(html: string) {
	try {
		const doc = new DOMParser().parseFromString(html, "text/html");
		const h1 = doc.querySelector("h1");
		if (h1) h1.remove();
		return doc.body.innerHTML;
	} catch {
		return html;
	}
}

export default function StaticPageClient({ data }: { data: PageData }) {
	const cleanHtml = useMemo(
		() => stripFirstH1(data.content),
		[data.content]
	);

	return (
		<div dir="rtl" className="container py-12">
			<div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
				{/* Header */}
				<div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200">
					<h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
						{data.title}
					</h1>

					{data.seo?.meta_description && (
						<p className="mt-2 text-slate-600 max-w-3xl">
							{data.seo.meta_description}
						</p>
					)}
				</div>

				{/* Content */}
				<div className="p-6 md:p-8">
					<div
						className="
              prose prose-slate max-w-none
              prose-headings:font-extrabold
              prose-a:text-pro
              prose-img:rounded-2xl
            "
					>
						{parse(cleanHtml)}
					</div>
				</div>
			</div>
		</div>
	);
}
