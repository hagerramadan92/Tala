import StaticPageClient from "../../components/StaticPage";
import NotFound from "../not-found";

 
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

async function getPageData(slug: string): Promise<PageData | null> {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/static-pages/${slug}`,
		{ cache: "no-store" }
	);

	const json = await res.json();
	if (!json?.status) return null;

	return json.data;
}

/* ✅ META HERE */
export async function generateMetadata() {
	const data = await getPageData("mn-nhn");

	if (!data) {
		return {
			title: "الصفحة غير موجودة",
		};
	}

	return {
		title: data.seo?.meta_title || data.title,
		description: data.seo?.meta_description,
		keywords: data.seo?.meta_keywords,
	};
}

export default async function Page() {
	const data = await getPageData("mn-nhn");

	if (!data) {
		return <NotFound />
	}

	return (
		<StaticPageClient data={data} />
	);
}
