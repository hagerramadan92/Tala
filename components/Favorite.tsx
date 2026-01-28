"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import NoOrders from "./NoOrders";
import { useAuth } from "@/src/context/AuthContext";
import FavoriteSkeleton from "@/components/skeletons/favorite";

export default function Favorite() {
	const { favoriteProducts, setFavoriteProducts, favoriteProductsLoading } = useAuth();

	const removeFavoriteLocally = (productId: number) => {
		setFavoriteProducts((prev: any) => prev.filter((p: any) => p.id !== productId));
	};

	if (favoriteProductsLoading) return <FavoriteSkeleton count={8} />;

	if (favoriteProducts.length === 0)
		return <NoOrders title="لا يوجد منتجات مفضلة." />;

	return (
		<div className=" ">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<h2 className="text-2xl font-extrabold text-slate-900">
						منتجاتي المفضلة
					</h2>
					<p className="mt-1 text-sm text-slate-500">
						كل المنتجات التي قمت بحفظها للعودة إليها لاحقًا.
					</p>
				</div>

				<span className="rounded-xl text-nowrap bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
					{favoriteProducts.length} منتج
				</span>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
				{favoriteProducts.map((product: any) => (
					<ProductCard
					product={product}
						key={product.id}
						{...product}
						onFavoriteChange={() => removeFavoriteLocally(product.id)}
						Bottom="bottom-41"
						className2="hidden"
					/>
				))}
			</div>
		</div>
	);
}
