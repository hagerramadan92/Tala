"use client";
import { useState } from "react";

type MsgType = "success" | "error" | "";

type CouponResponse = {
	status?: boolean;
	message?: string;
	data?: {
		coupon_id?: number;
		discount_amount?: number;
		new_total?: number;
	};
};

type CoBonProps = {
	onApplied?: (payload: CouponResponse) => void;
	onError?: (payload: CouponResponse) => void;
	onCleared?: () => void;
};

export default function CoBon({ onApplied, onError, onCleared , code, setCode }: any) {

	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [msgType, setMsgType] = useState<MsgType>("");

	const baseUrl = process.env.NEXT_PUBLIC_API_URL;

	const handleApply = async () => {
		setMessage("");
		setMsgType("");

		if (!code.trim()) {
			setMessage("من فضلك أدخل كود الكوبون");
			setMsgType("error");
			return;
		}

		if (!baseUrl) {
			setMessage("إعدادات السيرفر غير مكتملة");
			setMsgType("error");
			return;
		}

		setLoading(true);

		try {
			const token = localStorage.getItem("auth_token");

			const res = await fetch(`${baseUrl}/coupon/apply`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ coupon_code: code }),
			});

			const data: CouponResponse = await res.json();

			if (res.ok) {
				setMessage(data.message || "تم تطبيق الكود بنجاح");
				setMsgType("success");

				onApplied?.(data);
			} else {
				setMessage(data.message || "الكود غير صحيح");
				setMsgType("error");

				onError?.(data);
			}
		} catch (error) {
			const payload: CouponResponse = { status: false, message: "حدث خطأ أثناء الاتصال بالسيرفر" };
			setMessage(payload.message || "حدث خطأ أثناء الاتصال بالسيرفر");
			setMsgType("error");

			onError?.(payload);
		} finally {
			setLoading(false);
		}
	};

	const handleClear = () => {
		setCode("");
		setMessage("");
		setMsgType("");
		onCleared?.();
	};

	return (
		<div className="w-full max-w-sm">
			<p className="text-md p-2 text-pro">كوبون كود</p>

			<div className="flex text-sm items-center border border-gray-300 rounded overflow-hidden">
				<input
					type="text"
					value={code}
					placeholder="ادخل الكود"
					onChange={(e) => setCode(e.target.value)}
					disabled={loading}
					className="flex-1 px-4 py-2 text-gray-800 focus:outline-none disabled:bg-gray-100"
				/>

				<button
					onClick={handleApply}
					disabled={loading}
					aria-label="coupon"
					className="bg-gray-200 text-md text-gray-800 px-5 py-2 hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "جاري..." : "تطبيق"}
				</button> 
			</div>

			{message && (
				<p className={`mt-2 text-sm font-semibold ${msgType === "success" ? "text-green-600" : "text-red-600"}`}>
					{message}
				</p>
			)}
		</div>
	);
}
