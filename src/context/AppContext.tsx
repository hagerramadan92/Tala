"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";

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
	childCategories: CategoryI[];
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
	childCategories: [],
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
	const [loadingCategories, setLoadingCategories] = useState<any>([]);
	const [childCategories, setChildCategories] = useState<CategoryI[]>([]);
	const [socialMedia, setSocialMedia] = useState<SocialMediaI[]>([]);
	const [paymentMethods, setPaymentMethods] = useState<any>([]);


	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadAllData = async () => {
			try {
				setLoading(true);
				setLoadingHome(true)
				setLoadingCategories(true)

				fetchHomeData().then(res => {
					setHomeData(res)
					setLoadingHome(true)
				}).finally(() => {
					setLoadingHome(false)
				})

				// 2) Categories Parent
				fetchApi("categories?type=parent").then(res => {
					setParentCategories(Array.isArray(res) ? res : []);
					setLoadingCategories(true)
				}).finally(() => {
					setLoadingCategories(false)
				})

				// 3) Categories Child
				fetchApi("categories?type=child").then(res => {
					setChildCategories(Array.isArray(res) ? res : []);
				})
				
				// 4) socialMedia
				const socialMedia = await fetchApi("social-media");
				setSocialMedia(Array.isArray(socialMedia) ? socialMedia : []);

				const paymentMethods = await fetchApi("payment-methods?is_payment=true");
				setPaymentMethods(Array.isArray(paymentMethods) ? paymentMethods : []);

			} catch (err: any) {
				setError(err.message || "فشل تحميل البيانات");
				console.error("Error loading data:", err);

			} finally {
				setLoading(false);
			}
		};

		loadAllData();
	}, []);


	return (
		<AppContext.Provider
			value={{
				homeData,
				parentCategories,
				childCategories,
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
