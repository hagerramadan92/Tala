"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { fetchHomeData } from "@/lib/api";
import { fetchApi } from "@/lib/api";

import { CategoryI } from "@/Types/CategoriesI";
import { ProductI } from "@/Types/ProductsI";
import { SubCategoriesI } from "@/Types/SubCategoriesI";
import { BannerI } from "@/Types/BannerI";
import { SocialMediaI } from "@/Types/SocialMediaI";


interface HomeData {
	categories: CategoryI[];
	products: ProductI[];
	sub_categories: SubCategoriesI[];
	sliders: BannerI[];
	sub_categories_pagination : any
}

interface AppContextType {
	homeData: HomeData | null;
	parentCategories: CategoryI[];
	socialMedia: SocialMediaI[];
	paymentMethods: any
	loading: boolean;
	error: string | null;
	loadingHome: any
	loadingCategories: any
}

const AppContext = createContext<AppContextType>({
	homeData: null,
	parentCategories: [],
	socialMedia: [],
	paymentMethods: [],
	loading: true,
	error: null,
	loadingHome: true,
	loadingCategories: true
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
	const [homeData, setHomeData] = useState<HomeData | null>(null);
	const [loadingHome, setLoadingHome] = useState<any>(null);
	const [parentCategories, setParentCategories] = useState<CategoryI[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(true);
	const [socialMedia, setSocialMedia] = useState<SocialMediaI[]>([]);
	const [paymentMethods, setPaymentMethods] = useState<any>([]);


	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const pathname = usePathname();

	useEffect(() => {
		const loadSharedData = async () => {
			try {
				setLoading(true);
				setLoadingCategories(true)

				const [categoriesResult, socialResult, paymentResult] = await Promise.allSettled([
					fetchApi("categories?type=parent"),
					fetchApi("social-media"),
					fetchApi("payment-methods?is_payment=true"),
				]);

				if (categoriesResult.status === "fulfilled") {
					setParentCategories(Array.isArray(categoriesResult.value) ? categoriesResult.value : []);
				}
				if (socialResult.status === "fulfilled") {
					setSocialMedia(Array.isArray(socialResult.value) ? socialResult.value : []);
				}
				if (paymentResult.status === "fulfilled") {
					setPaymentMethods(Array.isArray(paymentResult.value) ? paymentResult.value : []);
				}

			} catch (err: any) {
				setError(err.message || "فشل تحميل البيانات");
				console.error("Error loading data:", err);

			} finally {
				setLoadingCategories(false)
				setLoading(false);
			}
		};

		loadSharedData();
	}, []);

	useEffect(() => {
		if (!pathname.startsWith("/product/")) {
			setLoadingHome(false);
			return;
		}

		setLoadingHome(true);
		fetchHomeData()
			.then(setHomeData)
			.catch(() => setHomeData(null))
			.finally(() => setLoadingHome(false));
	}, [pathname]);


	return (
		<AppContext.Provider
			value={{
				homeData,
				parentCategories,
				socialMedia,
				paymentMethods,
				loading,
				error,
				loadingHome,
				loadingCategories
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export const useAppContext = () => useContext(AppContext);
