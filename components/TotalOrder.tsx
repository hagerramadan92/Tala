"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/src/context/CartContext";

export default function TotalOrder({ response }: { response?: any }) {
	const { cart, cartCount, subtotal, total } = useCart();

	const [cartData, setCartData] = useState({
		items_count: cartCount || 0,
		subtotal: subtotal || 0,
		total: total || 0,
		items: cart || [],
	});


	useEffect(() => {
		if (response && response.status) {

			setCartData({
				items_count: response.data.items_count,
				subtotal: parseFloat(response.data.subtotal),
				total: parseFloat(response.data.total),
				items: response.data.items,
			});
		} else {

			setCartData({
				items_count: cartCount,
				subtotal,
				total,
				items: cart,
			});
		}
	}, [response, cart, cartCount, subtotal, total]);

	const formattedSubtotal = cartData.subtotal.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	const shippingFree = true;
	const shippingFee = shippingFree ? 0 : 48;



	const grandTotal = (cartData.total + shippingFee).toLocaleString(
		"en-US",
		{ minimumFractionDigits: 2, maximumFractionDigits: 2 }
	);

	return (
		<div className="my-4 gap-2 flex flex-col">

			{/* المجموع */}
			<div className="flex text-sm items-center justify-between text-black">
				<p className="font-semibold">المجموع ({cartData.items?.length} عناصر)</p>
				<p>
					{formattedSubtotal}
					<span className="text-sm ms-1">ريال</span>
				</p>
			</div>

			{/* رسوم الشحن */}
			<div className="flex items-center justify-between">
				<p className="text-sm">إجمالي رسوم الشحن</p>
				{shippingFree ? (
					<p className="font-semibold text-green-600">مجانا</p>
				) : (
					<p className="text-md">
						{shippingFee}
						<span className="text-sm ms-1">ريال</span>
					</p>
				)}
			</div>



			{/* الإجمالي */}
			<div className="flex items-center justify-between pb-3 pt-2">
				<div className="flex gap-1 items-center">
					<p className="text-md text-pro font-semibold">الإجمالي :</p>
					<p className="text-[12px] font-semibold text-gray-600">
						(يشمل ضريبة القيمة المضافة)
					</p>
				</div>

				<p className="text-[15px] text-pro font-bold">
					{grandTotal}
					<span> ريال</span>
				</p>
			</div>
		</div>
	);
}
