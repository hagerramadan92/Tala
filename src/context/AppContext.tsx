"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
import { fetchApi } from "@/lib/api";

import { CategoryI } from "@/Types/CategoriesI";
import { SocialMediaI } from "@/Types/SocialMediaI";

interface AppContextType {
	parentCategories: CategoryI[];
	socialMedia: SocialMediaI[];
	paymentMethods: any
	loading: boolean;
	error: string | null;
	loadingCategories: any
}

const AppContext = createContext<AppContextType>({
	parentCategories: [],
	socialMedia: [],
	paymentMethods: [],
	loading: true,
	error: null,
	loadingCategories: true
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
	const [parentCategories, setParentCategories] = useState<CategoryI[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(true);
	const [socialMedia, setSocialMedia] = useState<SocialMediaI[]>([]);
	const [paymentMethods, setPaymentMethods] = useState<any>([]);


	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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

	return (
		<AppContext.Provider
			value={{
				parentCategories,
				socialMedia,
				paymentMethods,
				loading,
				error,
				loadingCategories
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export const useAppContext = () => useContext(AppContext);
