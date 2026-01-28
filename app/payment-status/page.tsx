"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type PaymentStatus = "success" | "fail" | "pending" | "processing";

function normalizeStatus(raw: string | null): PaymentStatus {
	const s = (raw ?? "").toLowerCase().trim();
	if (s === "success" || s === "fail" || s === "pending" || s === "processing") return s;
	return "processing";
}

export default function PaymentPage() {
	const params = useSearchParams();

	const status = useMemo(() => normalizeStatus(params.get("status")), [params]);
	const orderId = params.get("orderId") ?? params.get("order_id") ?? "";
	const message = params.get("message") ?? "";

	const ui = useMemo(() => {
		switch (status) {
			case "success":
				return {
					title: "Payment successful",
					subtitle: "Your order is confirmed.",
					badge: "SUCCESS",
					badgeClass: "bg-green-100 text-green-700 ring-green-200",
					cardRing: "ring-green-200",
					primary: { label: "Go to order", href: orderId ? `/orders/${orderId}` : "/orders" },
					secondary: { label: "Back to home", href: "/" },
				};
			case "fail":
				return {
					title: "Payment failed",
					subtitle: "Something went wrong. You can try again.",
					badge: "FAILED",
					badgeClass: "bg-red-100 text-red-700 ring-red-200",
					cardRing: "ring-red-200",
					primary: { label: "Try again", href: orderId ? `/checkout?orderId=${encodeURIComponent(orderId)}` : "/checkout" },
					secondary: { label: "Contact support", href: "/support" },
				};
			case "pending":
				return {
					title: "Payment pending",
					subtitle: "We’re waiting for confirmation.",
					badge: "PENDING",
					badgeClass: "bg-yellow-100 text-yellow-800 ring-yellow-200",
					cardRing: "ring-yellow-200",
					primary: { label: "Refresh status", href: `/payment?status=pending${orderId ? `&orderId=${encodeURIComponent(orderId)}` : ""}` },
					secondary: { label: "View orders", href: "/orders" },
				};
			default:
				return {
					title: "Processing payment",
					subtitle: "Please wait while we confirm your payment…",
					badge: "PROCESSING",
					badgeClass: "bg-blue-100 text-blue-700 ring-blue-200",
					cardRing: "ring-blue-200",
					primary: { label: "View orders", href: "/orders" },
					secondary: { label: "Back to home", href: "/" },
				};
		}
	}, [status, orderId]);

	return (
		<main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className={`w-full max-w-lg rounded-2xl bg-white shadow-sm ring-1 ${ui.cardRing} p-6`}>
				<div className="flex items-start justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900">{ui.title}</h1>
						<p className="mt-1 text-gray-600">{ui.subtitle}</p>
					</div>
					<span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 ${ui.badgeClass}`}>
						{ui.badge}
					</span>
				</div>

				{(orderId || message) && (
					<div className="mt-5 rounded-xl bg-gray-50 p-4">
						{orderId && (
							<div className="flex items-center justify-between gap-3">
								<span className="text-sm text-gray-600">Order ID</span>
								<span className="text-sm font-medium text-gray-900">{orderId}</span>
							</div>
						)}
						{message && (
							<p className="mt-3 text-sm text-gray-700 break-words">
								{message}
							</p>
						)}
					</div>
				)}

				<div className="mt-6 flex flex-col sm:flex-row gap-3">
					<Link
						href={ui.primary.href}
						className="inline-flex justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
					>
						{ui.primary.label}
					</Link>
					<Link
						href={ui.secondary.href}
						className="inline-flex justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50"
					>
						{ui.secondary.label}
					</Link>
				</div>

				<p className="mt-6 text-xs text-gray-500">
					Tip: use <span className="font-mono">/payment?status=success&amp;orderId=123</span>
				</p>
			</div>
		</main>
	);
}
